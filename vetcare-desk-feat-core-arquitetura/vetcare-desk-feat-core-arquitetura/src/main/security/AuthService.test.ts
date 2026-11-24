
import test from 'node:test';
import assert from 'node:assert/strict';
import initSqlJs, { Database } from 'sql.js';
import { AuthService } from './AuthService';

async function createTestContext() {
  const SQL = await initSqlJs();
  const db: Database = new SQL.Database();

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
    query<T = Record<string, unknown>>(
      sql: string,
      params: unknown[] = []
    ): T[] {
      const statement = db.prepare(sql);
      const results: T[] = [];

      try {
        statement.bind(
          params as (string | number | null | Uint8Array)[]
        );

        while (statement.step()) {
          results.push(statement.getAsObject() as T);
        }
      } finally {
        statement.free();
      }

      return results;
    },

    execute(sql: string, params: unknown[] = []): void {
      db.run(
        sql,
        params as (string | number | null | Uint8Array)[]
      );
    },

    getLastInsertId(): number {
      const result = this.query<{ id: number }>(
        'SELECT last_insert_rowid() AS id'
      );

      return result[0].id;
    }
  };

  return {
    auth: new AuthService(memoryDatabase),
    db
  };
}

test('deve cadastrar o administrador inicial', async () => {
  const { auth, db } = await createTestContext();

  try {
    const admin = auth.registerInitialAdmin(
      'Administrador',
      'admin@email.com',
      'SenhaSegura123'
    );

    assert.equal(admin.role, 'ADMIN');
    assert.equal(admin.email, 'admin@email.com');

    // Verifica se o cadastro também iniciou a sessão.
    assert.equal(auth.getCurrentUser()?.id, admin.id);
    assert.equal(auth.hasPermission('MANAGE_CLINICAL'), true);
  } finally {
    db.close();
  }
});

test('não deve cadastrar dois administradores iniciais', async () => {
  const { auth, db } = await createTestContext();

  try {
    auth.registerInitialAdmin(
      'Administrador',
      'admin@email.com',
      'SenhaSegura123'
    );

    assert.throws(
      () => auth.registerInitialAdmin(
        'Outro Admin',
        'outro@email.com',
        'SenhaSegura123'
      ),
      /administrador inicial já foi criado/
    );
  } finally {
    db.close();
  }
});

test('deve realizar login com senha correta', async () => {
  const { auth, db } = await createTestContext();

  try {
    auth.registerInitialAdmin(
      'Administrador',
      'admin@email.com',
      'SenhaSegura123'
    );

    const user = auth.login(
      'admin@email.com',
      'SenhaSegura123'
    );

    assert.equal(user.email, 'admin@email.com');
    assert.equal(user.role, 'ADMIN');
  } finally {
    db.close();
  }
});

test('deve rejeitar senha incorreta', async () => {
  const { auth, db } = await createTestContext();

  try {
    auth.registerInitialAdmin(
      'Administrador',
      'admin@email.com',
      'SenhaSegura123'
    );

    assert.throws(
      () => auth.login('admin@email.com', 'SenhaErrada123'),
      /E-mail ou senha incorretos/
    );
  } finally {
    db.close();
  }
});

test('ADMIN deve possuir permissão para gerenciar usuários', async () => {
  const { auth, db } = await createTestContext();

  try {
    auth.registerInitialAdmin(
      'Administrador',
      'admin@email.com',
      'SenhaSegura123'
    );

    auth.login('admin@email.com', 'SenhaSegura123');

    assert.equal(auth.hasPermission('MANAGE_USERS'), true);
    assert.equal(auth.hasPermission('DELETE_CRITICAL'), true);
  } finally {
    db.close();
  }
});

test('VETERINARIO deve acessar somente recursos clínicos', async () => {
  const { auth, db } = await createTestContext();

  try {
    auth.registerInitialAdmin(
      'Administrador',
      'admin@email.com',
      'SenhaSegura123'
    );

    auth.login('admin@email.com', 'SenhaSegura123');

    auth.createUser(
      'Veterinário',
      'vet@email.com',
      'SenhaSegura123',
      'VETERINARIO'
    );

    auth.logout();
    auth.login('vet@email.com', 'SenhaSegura123');

    assert.equal(auth.hasPermission('MANAGE_CLINICAL'), true);
    assert.equal(auth.hasPermission('MANAGE_USERS'), false);
    assert.equal(auth.hasPermission('DELETE_CRITICAL'), false);

    // Verifica se o veterinário é impedido de cadastrar usuários.
    assert.throws(
      () => auth.createUser(
        'Outro Usuário',
        'outro@email.com',
        'SenhaSegura123',
        'VETERINARIO'
      ),
      /Acesso negado. Apenas ADMIN pode cadastrar usuários/
    );
  } finally {
    db.close();
  }
});

test('deve encerrar a sessão no logout', async () => {
  const { auth, db } = await createTestContext();

  try {
    auth.registerInitialAdmin(
      'Administrador',
      'admin@email.com',
      'SenhaSegura123'
    );

    auth.login('admin@email.com', 'SenhaSegura123');
    auth.logout();

    assert.equal(auth.getCurrentUser(), null);
    assert.equal(auth.hasPermission('MANAGE_USERS'), false);
  } finally {
    db.close();
  }
});
