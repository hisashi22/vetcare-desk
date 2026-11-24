"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProdutoRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const PRODUTO_SELECT = `
  SELECT
    id,
    fornecedor_id AS fornecedorId,
    nome,
    COALESCE(lote, '') AS lote,
    COALESCE(validade, '') AS validade,
    quantidade,
    estoque_minimo AS estoqueMinimo,
    COALESCE(bula, '') AS bula,
    custo
  FROM produtos_estoque
`;
class ProdutoRepository extends BaseRepository_1.BaseRepository {
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
        return this.database.query(`${PRODUTO_SELECT} ORDER BY nome`);
    }
    findById(id) {
        const results = this.database.query(`${PRODUTO_SELECT} WHERE id = ?`, [id]);
        return results[0] ?? null;
    }
    updateQuantidade(id, quantidade) {
        if (!Number.isInteger(quantidade) || quantidade < 0) {
            throw new Error('Quantidade inválida.');
        }
        if (!this.findById(id))
            return false;
        this.database.execute('UPDATE produtos_estoque SET quantidade = ? WHERE id = ?', [quantidade, id]);
        return true;
    }
    updateBula(id, bula) {
        if (!this.findById(id))
            return false;
        this.database.execute('UPDATE produtos_estoque SET bula = ? WHERE id = ?', [bula, id]);
        return true;
    }
}
exports.ProdutoRepository = ProdutoRepository;
