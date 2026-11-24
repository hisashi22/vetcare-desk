import { ProdutoEstoque } from '../../shared/types';
import { BaseRepository } from './BaseRepository';

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

export class ProdutoRepository extends BaseRepository<ProdutoEstoque> {
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

  public override findAll(): ProdutoEstoque[] {
    return this.database.query<ProdutoEstoque>(
      `${PRODUTO_SELECT} ORDER BY nome`
    );
  }

  public override findById(id: number): ProdutoEstoque | null {
    const results = this.database.query<ProdutoEstoque>(
      `${PRODUTO_SELECT} WHERE id = ?`,
      [id]
    );

    return results[0] ?? null;
  }

  public updateQuantidade(id: number, quantidade: number): boolean {
    if (!Number.isInteger(quantidade) || quantidade < 0) {
      throw new Error('Quantidade inválida.');
    }

    if (!this.findById(id)) return false;

    this.database.execute(
      'UPDATE produtos_estoque SET quantidade = ? WHERE id = ?',
      [quantidade, id]
    );

    return true;
  }

  public updateBula(id: number, bula: string): boolean {
    if (!this.findById(id)) return false;

    this.database.execute(
      'UPDATE produtos_estoque SET bula = ? WHERE id = ?',
      [bula, id]
    );

    return true;
  }
}