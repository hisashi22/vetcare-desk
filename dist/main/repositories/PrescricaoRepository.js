"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrescricaoRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const PRESCRICAO_SELECT = `
  SELECT
    id,
    consulta_id AS consultaId,
    produto_id AS produtoId,
    tipo,
    COALESCE(descricao, '') AS descricao,
    quantidade,
    COALESCE(data_aplicacao, '') AS dataAplicacao,
    proxima_dose AS dataReforco
  FROM prescricoes_aplicacoes
`;
class PrescricaoRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('prescricoes_aplicacoes', [
            'consulta_id',
            'produto_id',
            'tipo',
            'descricao',
            'quantidade',
            'data_aplicacao',
            'proxima_dose'
        ]);
    }
    findAll() {
        return this.database.query(`${PRESCRICAO_SELECT} ORDER BY id DESC`);
    }
    findById(id) {
        const results = this.database.query(`${PRESCRICAO_SELECT} WHERE id = ?`, [id]);
        return results[0] ?? null;
    }
    findByConsultaId(consultaId) {
        return this.database.query(`${PRESCRICAO_SELECT} WHERE consulta_id = ? ORDER BY id`, [consultaId]);
    }
    createPrescricao(data) {
        this.validatePrescricao(data);
        this.database.execute(`
      INSERT INTO prescricoes_aplicacoes (
        consulta_id,
        produto_id,
        tipo,
        descricao,
        quantidade,
        data_aplicacao,
        proxima_dose
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
            data.consultaId,
            data.produtoId,
            data.tipo,
            data.descricao || '',
            data.quantidade,
            data.dataAplicacao || null,
            data.dataReforco || null
        ]);
        return this.database.getLastInsertId();
    }
    updatePrescricao(id, data) {
        if (!this.findById(id))
            return false;
        this.validatePrescricao(data);
        this.database.execute(`
      UPDATE prescricoes_aplicacoes SET
        consulta_id = ?,
        produto_id = ?,
        tipo = ?,
        descricao = ?,
        quantidade = ?,
        data_aplicacao = ?,
        proxima_dose = ?
      WHERE id = ?
    `, [
            data.consultaId,
            data.produtoId,
            data.tipo,
            data.descricao || '',
            data.quantidade,
            data.dataAplicacao || null,
            data.dataReforco || null,
            id
        ]);
        return true;
    }
    validatePrescricao(data) {
        if (!Number.isInteger(data.consultaId) || data.consultaId <= 0) {
            throw new Error('Consulta inválida.');
        }
        if (!Number.isInteger(data.produtoId) || data.produtoId <= 0) {
            throw new Error('Produto inválido.');
        }
        if (data.tipo !== 'PRESCRICAO' && data.tipo !== 'APLICACAO') {
            throw new Error('Tipo de prescrição inválido.');
        }
        if (!Number.isInteger(data.quantidade) || data.quantidade <= 0) {
            throw new Error('A quantidade deve ser um inteiro maior que zero.');
        }
    }
}
exports.PrescricaoRepository = PrescricaoRepository;
