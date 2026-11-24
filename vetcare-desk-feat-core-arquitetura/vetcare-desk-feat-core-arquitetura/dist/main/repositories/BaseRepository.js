"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
const DatabaseConnection_1 = require("../database/DatabaseConnection");
class BaseRepository {
    tableName;
    allowedColumns;
    database;
    constructor(tableName, allowedColumns) {
        this.tableName = tableName;
        this.allowedColumns = allowedColumns;
        this.database = DatabaseConnection_1.DatabaseConnection.getInstance();
        this.validateIdentifier(tableName);
        for (const column of allowedColumns) {
            this.validateIdentifier(column);
        }
    }
    /**
     * Valida identificadores SQL.
     */
    validateIdentifier(identifier) {
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
            throw new Error(`Identificador SQL inválido: ${identifier}`);
        }
    }
    /**
     * Verifica se as colunas informadas são permitidas.
     */
    validateColumns(data) {
        const columns = Object.keys(data);
        if (columns.length === 0) {
            throw new Error('Nenhum dado informado.');
        }
        for (const column of columns) {
            this.validateIdentifier(column);
            if (!this.allowedColumns.includes(column)) {
                throw new Error(`Coluna não permitida: ${column}`);
            }
        }
        return columns;
    }
    /**
     * Busca todos os registros.
     */
    findAll() {
        return this.database.query(`SELECT * FROM ${this.tableName}`);
    }
    /**
     * Busca um registro pelo ID.
     */
    findById(id) {
        const results = this.database.query(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return results[0] ?? null;
    }
    /**
     * Insere um novo registro.
     */
    create(data) {
        const columns = this.validateColumns(data);
        const placeholders = columns.map(() => '?').join(', ');
        const values = columns.map(column => data[column]);
        const sql = `
      INSERT INTO ${this.tableName}
      (${columns.join(', ')})
      VALUES (${placeholders})
    `;
        this.database.execute(sql, values);
        return this.database.getLastInsertId();
    }
    /**
     * Atualiza um registro existente.
     */
    update(id, data) {
        const columns = this.validateColumns(data);
        const assignments = columns
            .map(column => `${column} = ?`)
            .join(', ');
        const values = columns.map(column => data[column]);
        this.database.execute(`UPDATE ${this.tableName} SET ${assignments} WHERE id = ?`, [...values, id]);
        return this.findById(id) !== null;
    }
    /**
     * Exclui um registro pelo ID.
     */
    delete(id) {
        const existing = this.findById(id);
        if (!existing) {
            return false;
        }
        this.database.execute(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
        return true;
    }
}
exports.BaseRepository = BaseRepository;
