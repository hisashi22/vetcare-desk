"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const sql_js_1 = __importDefault(require("sql.js"));
const AuthService_1 = require("./AuthService");
async function createTestContext() {
    const SQL = await (0, sql_js_1.default)();
    const db = new SQL.Database();
    db.run(`
    CREATE TABLE usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      senha_salt TEXT NOT NULL,
      perfil TEXT NOT NULL CHECK (
        perfil IN ('ADMIN', 'VETERINARIO')
      )
    );
  `);
    const memoryDatabase = {
        query(sql, params = []) {
            const statement = db.prepare(sql);
            const results = [];
            try {
                statement.bind(params);
                while (statement.step()) {
                    results.push(statement.getAsObject());
                }
            }
            finally {
                statement.free();
            }
            return results;
        },
        execute(sql, params = []) {
            db.run(sql, params);
        },
        getLastInsertId() {
            const result = this.query('SELECT last_insert_rowid() AS id');
            return result[0].id;
        }
    };
    return {
        auth: new AuthService_1.AuthService(memoryDatabase),
        db
    };
}
(0, node_test_1.default)('deve cadastrar o administrador inicial', async () => {
    const { auth, db } = await createTestContext();
    try {
        const admin = auth.registerInitialAdmin('Administrador', 'admin@email.com', 'SenhaSegura123');
        strict_1.default.equal(admin.role, 'ADMIN');
        strict_1.default.equal(admin.email, 'admin@email.com');
        // Verifica se o cadastro também iniciou a sessão.
        strict_1.default.equal(auth.getCurrentUser()?.id, admin.id);
        strict_1.default.equal(auth.hasPermission('MANAGE_CLINICAL'), true);
    }
    finally {
        db.close();
    }
});
(0, node_test_1.default)('não deve cadastrar dois administradores iniciais', async () => {
    const { auth, db } = await createTestContext();
    try {
        auth.registerInitialAdmin('Administrador', 'admin@email.com', 'SenhaSegura123');
        strict_1.default.throws(() => auth.registerInitialAdmin('Outro Admin', 'outro@email.com', 'SenhaSegura123'), /administrador inicial já foi criado/);
    }
    finally {
        db.close();
    }
});
(0, node_test_1.default)('deve realizar login com senha correta', async () => {
    const { auth, db } = await createTestContext();
    try {
        auth.registerInitialAdmin('Administrador', 'admin@email.com', 'SenhaSegura123');
        const user = auth.login('admin@email.com', 'SenhaSegura123');
        strict_1.default.equal(user.email, 'admin@email.com');
        strict_1.default.equal(user.role, 'ADMIN');
    }
    finally {
        db.close();
    }
});
(0, node_test_1.default)('deve rejeitar senha incorreta', async () => {
    const { auth, db } = await createTestContext();
    try {
        auth.registerInitialAdmin('Administrador', 'admin@email.com', 'SenhaSegura123');
        strict_1.default.throws(() => auth.login('admin@email.com', 'SenhaErrada123'), /E-mail ou senha incorretos/);
    }
    finally {
        db.close();
    }
});
(0, node_test_1.default)('ADMIN deve possuir permissão para gerenciar usuários', async () => {
    const { auth, db } = await createTestContext();
    try {
        auth.registerInitialAdmin('Administrador', 'admin@email.com', 'SenhaSegura123');
        auth.login('admin@email.com', 'SenhaSegura123');
        strict_1.default.equal(auth.hasPermission('MANAGE_USERS'), true);
        strict_1.default.equal(auth.hasPermission('DELETE_CRITICAL'), true);
    }
    finally {
        db.close();
    }
});
(0, node_test_1.default)('VETERINARIO deve acessar somente recursos clínicos', async () => {
    const { auth, db } = await createTestContext();
    try {
        auth.registerInitialAdmin('Administrador', 'admin@email.com', 'SenhaSegura123');
        auth.login('admin@email.com', 'SenhaSegura123');
        auth.createUser('Veterinário', 'vet@email.com', 'SenhaSegura123', 'VETERINARIO');
        auth.logout();
        auth.login('vet@email.com', 'SenhaSegura123');
        strict_1.default.equal(auth.hasPermission('MANAGE_CLINICAL'), true);
        strict_1.default.equal(auth.hasPermission('MANAGE_USERS'), false);
        strict_1.default.equal(auth.hasPermission('DELETE_CRITICAL'), false);
        // Verifica se o veterinário é impedido de cadastrar usuários.
        strict_1.default.throws(() => auth.createUser('Outro Usuário', 'outro@email.com', 'SenhaSegura123', 'VETERINARIO'), /Acesso negado. Apenas ADMIN pode cadastrar usuários/);
    }
    finally {
        db.close();
    }
});
(0, node_test_1.default)('deve encerrar a sessão no logout', async () => {
    const { auth, db } = await createTestContext();
    try {
        auth.registerInitialAdmin('Administrador', 'admin@email.com', 'SenhaSegura123');
        auth.login('admin@email.com', 'SenhaSegura123');
        auth.logout();
        strict_1.default.equal(auth.getCurrentUser(), null);
        strict_1.default.equal(auth.hasPermission('MANAGE_USERS'), false);
    }
    finally {
        db.close();
    }
});
