"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseConnection = void 0;
const sql_js_1 = __importDefault(require("sql.js"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class DatabaseConnection {
    static instance;
    database = null;
    SQL = null;
    constructor() { }
    static getInstance() {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }
    async initialize() {
        if (this.database)
            return;
        this.SQL = await (0, sql_js_1.default)();
        const databasePath = path.join(process.cwd(), 'vetcare.db');
        if (fs.existsSync(databasePath)) {
            const fileBuffer = fs.readFileSync(databasePath);
            this.database = new this.SQL.Database(fileBuffer);
        }
        else {
            this.database = new this.SQL.Database();
        }
        this.database.run('PRAGMA foreign_keys = ON;');
        this.createTables();
        this.save();
    }
    getDatabase() {
        if (!this.database) {
            throw new Error('Banco de dados não inicializado.');
        }
        return this.database;
    }
    execute(sql, params = []) {
        const database = this.getDatabase();
        database.run(sql, params);
        this.save();
    }
    query(sql, params = []) {
        const database = this.getDatabase();
        const statement = database.prepare(sql);
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
    }
    getLastInsertId() {
        const result = this.query('SELECT last_insert_rowid() AS id');
        return result[0].id;
    }
    save() {
        const database = this.getDatabase();
        const data = database.export();
        const databasePath = path.join(process.cwd(), 'vetcare.db');
        fs.writeFileSync(databasePath, Buffer.from(data));
    }
    close() {
        if (this.database) {
            this.save();
            this.database.close();
            this.database = null;
        }
    }
    createTables() {
        const db = this.getDatabase();
        db.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        senha_hash TEXT NOT NULL,
        senha_salt TEXT NOT NULL,
        perfil TEXT NOT NULL CHECK (
          perfil IN ('ADMIN', 'VETERINARIO')
        ),
        criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS veterinarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL UNIQUE,
        crmv TEXT NOT NULL UNIQUE,
        especialidade TEXT,
        telefone TEXT,
        FOREIGN KEY (usuario_id)
          REFERENCES usuarios(id)
          ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS tutores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        cpf TEXT NOT NULL UNIQUE,
        email TEXT,
        telefone TEXT,
        cep TEXT,
        logradouro TEXT,
        bairro TEXT,
        cidade TEXT,
        uf TEXT,
        criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS pets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tutor_id INTEGER NOT NULL,
        nome TEXT NOT NULL,
        especie TEXT NOT NULL,
        raca TEXT,
        idade INTEGER,
        peso REAL,
        observacoes TEXT,
        FOREIGN KEY (tutor_id)
          REFERENCES tutores(id)
          ON DELETE RESTRICT
      );

      CREATE TABLE IF NOT EXISTS fornecedores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        documento TEXT,
        email TEXT,
        telefone TEXT,
        pais TEXT NOT NULL DEFAULT 'Brasil',
        moeda TEXT NOT NULL DEFAULT 'BRL'
          CHECK (moeda IN ('BRL', 'USD'))
      );

      CREATE TABLE IF NOT EXISTS produtos_estoque (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fornecedor_id INTEGER NOT NULL,
        nome TEXT NOT NULL,
        categoria TEXT NOT NULL,
        lote TEXT,
        validade TEXT,
        quantidade INTEGER NOT NULL DEFAULT 0,
        estoque_minimo INTEGER NOT NULL DEFAULT 0,
        custo REAL NOT NULL DEFAULT 0,
        bula TEXT,
        FOREIGN KEY (fornecedor_id)
          REFERENCES fornecedores(id)
          ON DELETE RESTRICT
      );

      CREATE TABLE IF NOT EXISTS consultas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pet_id INTEGER NOT NULL,
        veterinario_id INTEGER NOT NULL,
        data_consulta TEXT NOT NULL,
        diagnostico TEXT,
        observacoes TEXT,
        FOREIGN KEY (pet_id)
          REFERENCES pets(id)
          ON DELETE RESTRICT,
        FOREIGN KEY (veterinario_id)
          REFERENCES veterinarios(id)
          ON DELETE RESTRICT
      );

      CREATE TABLE IF NOT EXISTS prescricoes_aplicacoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        consulta_id INTEGER NOT NULL,
        produto_id INTEGER NOT NULL,
        tipo TEXT NOT NULL,
        descricao TEXT,
        quantidade INTEGER NOT NULL DEFAULT 1,
        data_aplicacao TEXT,
        proxima_dose TEXT,
        FOREIGN KEY (consulta_id)
          REFERENCES consultas(id)
          ON DELETE RESTRICT,
        FOREIGN KEY (produto_id)
          REFERENCES produtos_estoque(id)
          ON DELETE RESTRICT
      );

      CREATE TABLE IF NOT EXISTS notificacoes_vacina (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prescricao_id INTEGER NOT NULL,
        proxima_dose TEXT NOT NULL,
        email_destino TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDENTE'
          CHECK (status IN ('PENDENTE', 'ENVIADO', 'FALHA')),
        enviado_em TEXT,
        criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (prescricao_id, proxima_dose, email_destino),
        FOREIGN KEY (prescricao_id)
          REFERENCES prescricoes_aplicacoes(id)
          ON DELETE RESTRICT
      );

      CREATE INDEX IF NOT EXISTS idx_notificacoes_status
        ON notificacoes_vacina(status);

      CREATE INDEX IF NOT EXISTS idx_pets_tutor
        ON pets(tutor_id);

      CREATE INDEX IF NOT EXISTS idx_consultas_pet
        ON consultas(pet_id);

      CREATE INDEX IF NOT EXISTS idx_consultas_veterinario
        ON consultas(veterinario_id);

      CREATE INDEX IF NOT EXISTS idx_produtos_fornecedor
        ON produtos_estoque(fornecedor_id);

      CREATE INDEX IF NOT EXISTS idx_prescricoes_consulta
        ON prescricoes_aplicacoes(consulta_id);
    `);
    }
}
exports.DatabaseConnection = DatabaseConnection;
