import { PrescricaoAplicacao } from '../../shared/types';
import { BaseRepository } from './BaseRepository';

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

export class PrescricaoRepository extends BaseRepository<PrescricaoAplicacao> {
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

  public override findAll(): PrescricaoAplicacao[] {
    return this.database.query<PrescricaoAplicacao>(
      `${PRESCRICAO_SELECT} ORDER BY id DESC`
    );
  }

  public override findById(id: number): PrescricaoAplicacao | null {
    const results = this.database.query<PrescricaoAplicacao>(
      `${PRESCRICAO_SELECT} WHERE id = ?`,
      [id]
    );

    return results[0] ?? null;
  }

  public findByConsultaId(consultaId: number): PrescricaoAplicacao[] {
    return this.database.query<PrescricaoAplicacao>(
      `${PRESCRICAO_SELECT} WHERE consulta_id = ? ORDER BY id`,
      [consultaId]
    );
  }

  public createPrescricao(data: Omit<PrescricaoAplicacao, 'id'>): number {
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

  public updatePrescricao(
    id: number,
    data: Omit<PrescricaoAplicacao, 'id'>
  ): boolean {
    if (!this.findById(id)) return false;

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

  private validatePrescricao(data: Omit<PrescricaoAplicacao, 'id'>): void {
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