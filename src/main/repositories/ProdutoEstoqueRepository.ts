import { ProdutoEstoque } from '../../shared/types';
import { BaseRepository } from './BaseRepository';

export class ProdutoEstoqueRepository extends BaseRepository<ProdutoEstoque> {
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
    return this.database.query<ProdutoEstoque>(`
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

  public override findById(id: number): ProdutoEstoque | null {
    const results = this.database.query<ProdutoEstoque>(
      `
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
      `,
      [id]
    );

    return results[0] ?? null;
  }

  public findByFornecedorId(fornecedorId: number): ProdutoEstoque[] {
    return this.database.query<ProdutoEstoque>(
      `
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
      `,
      [fornecedorId]
    );
  }

  public findEstoqueCritico(): ProdutoEstoque[] {
    return this.database.query<ProdutoEstoque>(`
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

  public createProduto(data: Omit<ProdutoEstoque, 'id'>): number {
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

  public updateProduto(id: number, data: Omit<ProdutoEstoque, 'id'>): boolean {
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

  public deleteProduto(id: number): boolean {
    return this.delete(id);
  }
}
