import { Fornecedor } from '../../shared/types';
import { BaseRepository } from './BaseRepository';

export class FornecedorRepository extends BaseRepository<Fornecedor> {
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

  public override findAll(): Fornecedor[] {
    return this.database.query<Fornecedor>(`
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

  public override findById(id: number): Fornecedor | null {
    const results = this.database.query<Fornecedor>(
      `
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
      `,
      [id]
    );

    return results[0] ?? null;
  }

  public createFornecedor(data: Omit<Fornecedor, 'id'>): number {
    return this.create({
      nome: data.nome,
      documento: data.documento || null,
      email: data.email || null,
      telefone: data.telefone || null,
      pais: data.pais || 'Brasil',
      moeda: data.moeda
    });
  }

  public updateFornecedor(id: number, data: Omit<Fornecedor, 'id'>): boolean {
    return this.update(id, {
      nome: data.nome,
      documento: data.documento || null,
      email: data.email || null,
      telefone: data.telefone || null,
      pais: data.pais || 'Brasil',
      moeda: data.moeda
    });
  }

  public deleteFornecedor(id: number): boolean {
    return this.delete(id);
  }
}
