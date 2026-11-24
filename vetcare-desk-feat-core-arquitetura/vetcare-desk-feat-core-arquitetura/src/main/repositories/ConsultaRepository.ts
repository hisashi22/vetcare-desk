import { Consulta } from '../../shared/types';
import { BaseRepository } from './BaseRepository';

const CONSULTA_SELECT = `
  SELECT
    id,
    pet_id AS petId,
    veterinario_id AS veterinarioId,
    data_consulta AS data,
    COALESCE(diagnostico, '') AS diagnostico
  FROM consultas
`;

export class ConsultaRepository extends BaseRepository<Consulta> {
  constructor() {
    super('consultas', [
      'pet_id',
      'veterinario_id',
      'data_consulta',
      'diagnostico',
      'observacoes'
    ]);
  }

  public override findAll(): Consulta[] {
    return this.database.query<Consulta>(
      `${CONSULTA_SELECT} ORDER BY data_consulta DESC`
    );
  }

  public override findById(id: number): Consulta | null {
    const results = this.database.query<Consulta>(
      `${CONSULTA_SELECT} WHERE id = ?`,
      [id]
    );

    return results[0] ?? null;
  }

  
  public findByPetId(petId: number): Consulta[] {
    return this.database.query<Consulta>(
      `${CONSULTA_SELECT} WHERE pet_id = ? ORDER BY data_consulta DESC`,
      [petId]
    );
  }

  public createConsulta(data: Omit<Consulta, 'id'>): number {
    this.validateConsulta(data);

    this.database.execute(`
      INSERT INTO consultas (
        pet_id,
        veterinario_id,
        data_consulta,
        diagnostico
      )
      VALUES (?, ?, ?, ?)
    `, [
      data.petId,
      data.veterinarioId,
      data.data.trim(),
      data.diagnostico || ''
    ]);

    return this.database.getLastInsertId();
  }

  public updateConsulta(
    id: number,
    data: Omit<Consulta, 'id'>
  ): boolean {
    if (!this.findById(id)) return false;

    this.validateConsulta(data);

    this.database.execute(`
      UPDATE consultas SET
        pet_id = ?,
        veterinario_id = ?,
        data_consulta = ?,
        diagnostico = ?
      WHERE id = ?
    `, [
      data.petId,
      data.veterinarioId,
      data.data.trim(),
      data.diagnostico || '',
      id
    ]);

    return true;
  }

  private validateConsulta(data: Omit<Consulta, 'id'>): void {
    if (!Number.isInteger(data.petId) || data.petId <= 0) {
      throw new Error('Pet inválido.');
    }

    if (!Number.isInteger(data.veterinarioId) || data.veterinarioId <= 0) {
      throw new Error('Veterinário inválido.');
    }

    if (!data.data || !data.data.trim()) {
      throw new Error('A data da consulta é obrigatória!');
    }
  }

      public findByVeterinarioId(veterinarioId: number): Consulta[] {
    return this.database.query<Consulta>(
      `${CONSULTA_SELECT} WHERE veterinario_id = ? ORDER BY data_consulta DESC`,
      [veterinarioId]
    );
  }


}