"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FornecedorRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class FornecedorRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('fornecedores', [
            'nome',
            'documento',
            'email',
            'telefone',
            'pais',
            'moeda'
        ]);
    }
    findAll() {
        return this.database.query(`
      SELECT
        id,
        nome,
        COALESCE(documento, '') AS documento,
        COALESCE(email, '') AS email,
        COALESCE(telefone, '') AS telefone,
        COALESCE(pais, 'Brasil') AS pais,
        moeda
      FROM fornecedores
      ORDER BY nome
    `);
    }
    findById(id) {
        const results = this.database.query(`
      SELECT
        id,
        nome,
        COALESCE(documento, '') AS documento,
        COALESCE(email, '') AS email,
        COALESCE(telefone, '') AS telefone,
        COALESCE(pais, 'Brasil') AS pais,
        moeda
      FROM fornecedores
      WHERE id = ?
      `, [id]);
        return results[0] ?? null;
    }
    createFornecedor(data) {
        return this.create({
            nome: data.nome,
            documento: data.documento || null,
            email: data.email || null,
            telefone: data.telefone || null,
            pais: data.pais || 'Brasil',
            moeda: data.moeda
        });
    }
    updateFornecedor(id, data) {
        return this.update(id, {
            nome: data.nome,
            documento: data.documento || null,
            email: data.email || null,
            telefone: data.telefone || null,
            pais: data.pais || 'Brasil',
            moeda: data.moeda
        });
    }
    deleteFornecedor(id) {
        return this.delete(id);
    }
}
exports.FornecedorRepository = FornecedorRepository;
