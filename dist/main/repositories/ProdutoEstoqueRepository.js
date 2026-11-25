"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProdutoEstoqueRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class ProdutoEstoqueRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('produtos_estoque', [
            'fornecedor_id',
            'nome',
            'categoria',
            'lote',
            'validade',
            'quantidade',
            'estoque_minimo',
            'custo',
            'bula'
        ]);
    }
    findAll() {
        return this.database.query(`
      SELECT
        id,
        fornecedor_id AS fornecedorId,
        nome,
        categoria,
        COALESCE(lote, '') AS lote,
        COALESCE(validade, '') AS validade,
        quantidade,
        estoque_minimo AS estoqueMinimo,
        custo,
        COALESCE(bula, '') AS bula
      FROM produtos_estoque
      ORDER BY nome
    `);
    }
    findById(id) {
        const results = this.database.query(`
      SELECT
        id,
        fornecedor_id AS fornecedorId,
        nome,
        categoria,
        COALESCE(lote, '') AS lote,
        COALESCE(validade, '') AS validade,
        quantidade,
        estoque_minimo AS estoqueMinimo,
        custo,
        COALESCE(bula, '') AS bula
      FROM produtos_estoque
      WHERE id = ?
      `, [id]);
        return results[0] ?? null;
    }
    findByFornecedorId(fornecedorId) {
        return this.database.query(`
      SELECT
        id,
        fornecedor_id AS fornecedorId,
        nome,
        categoria,
        COALESCE(lote, '') AS lote,
        COALESCE(validade, '') AS validade,
        quantidade,
        estoque_minimo AS estoqueMinimo,
        custo,
        COALESCE(bula, '') AS bula
      FROM produtos_estoque
      WHERE fornecedor_id = ?
      ORDER BY nome
      `, [fornecedorId]);
    }
    findEstoqueCritico() {
        return this.database.query(`
      SELECT
        id,
        fornecedor_id AS fornecedorId,
        nome,
        categoria,
        COALESCE(lote, '') AS lote,
        COALESCE(validade, '') AS validade,
        quantidade,
        estoque_minimo AS estoqueMinimo,
        custo,
        COALESCE(bula, '') AS bula
      FROM produtos_estoque
      WHERE quantidade <= estoque_minimo
      ORDER BY quantidade ASC, nome ASC
    `);
    }
    createProduto(data) {
        return this.create({
            fornecedor_id: data.fornecedorId,
            nome: data.nome,
            categoria: data.categoria,
            lote: data.lote || null,
            validade: data.validade || null,
            quantidade: data.quantidade,
            estoque_minimo: data.estoqueMinimo,
            custo: data.custo,
            bula: data.bula || null
        });
    }
    updateProduto(id, data) {
        return this.update(id, {
            fornecedor_id: data.fornecedorId,
            nome: data.nome,
            categoria: data.categoria,
            lote: data.lote || null,
            validade: data.validade || null,
            quantidade: data.quantidade,
            estoque_minimo: data.estoqueMinimo,
            custo: data.custo,
            bula: data.bula || null
        });
    }
    deleteProduto(id) {
        return this.delete(id);
    }
}
exports.ProdutoEstoqueRepository = ProdutoEstoqueRepository;
