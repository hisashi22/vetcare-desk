
import { DatabaseConnection } from '../database/DatabaseConnection';
import { Pet } from '../../shared/types';
import { BaseRepository } from './BaseRepository';

export class PetRepository extends BaseRepository<Pet> {
  constructor() {
    super('pets', [
      'tutor_id',
      'nome',
      'especie',
      'raca',
      'idade',
      'peso',
      'observacoes'
    ]);
  }

  public override findAll(): Pet[] {
    return this.database.query<Pet>(`
      SELECT
        id,
        tutor_id AS tutorId,
        nome,
        especie,
        COALESCE(raca, '') AS raca,
        COALESCE(idade, 0) AS idade,
        COALESCE(peso, 0) AS peso,
        COALESCE(observacoes, '') AS observacoes
      FROM pets
      ORDER BY nome
    `);
  }

  public override findById(id: number): Pet | null {
    const results = this.database.query<Pet>(`
      SELECT
        id,
        tutor_id AS tutorId,
        nome,
        especie,
        COALESCE(raca, '') AS raca,
        COALESCE(idade, 0) AS idade,
        COALESCE(peso, 0) AS peso,
        COALESCE(observacoes, '') AS observacoes
      FROM pets
      WHERE id = ?
    `, [id]);

    return results[0] ?? null;
  }

  public findByTutorId(tutorId: number): Pet[] {
    return this.database.query<Pet>(`
      SELECT
        id,
        tutor_id AS tutorId,
        nome,
        especie,
        COALESCE(raca, '') AS raca,
        COALESCE(idade, 0) AS idade,
        COALESCE(peso, 0) AS peso,
        COALESCE(observacoes, '') AS observacoes
      FROM pets
      WHERE tutor_id = ?
      ORDER BY nome
    `, [tutorId]);
  }

  public createPet(data: Omit<Pet, 'id'>): number {
    this.validatePet(data);

    this.database.execute(`
      INSERT INTO pets (
        tutor_id,
        nome,
        especie,
        raca,
        idade,
        peso,
        observacoes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      data.tutorId,
      data.nome.trim(),
      data.especie,
      data.raca || '',
      data.idade ?? 0,
      data.peso ?? 0,
      data.observacoes || ''
    ]);

    return this.database.getLastInsertId();
  }

  public updatePet(
    id: number,
    data: Omit<Pet, 'id'>
  ): boolean {
    if (!this.findById(id)) return false;

    this.validatePet(data);

    this.database.execute(`
      UPDATE pets SET
        tutor_id = ?,
        nome = ?,
        especie = ?,
        raca = ?,
        idade = ?,
        peso = ?,
        observacoes = ?
      WHERE id = ?
    `, [
      data.tutorId,
      data.nome.trim(),
      data.especie,
      data.raca || '',
      data.idade ?? 0,
      data.peso ?? 0,
      data.observacoes || '',
      id
    ]);

    return true;
  }

  public deletePet(id: number): boolean {
    if (!this.findById(id)) return false;

    this.database.execute(
      'DELETE FROM pets WHERE id = ?',
      [id]
    );

    return true;
  }

  private validatePet(data: Omit<Pet, 'id'>): void {
    if (!data.nome.trim()) {
      throw new Error('O nome do pet é obrigatório.');
    }

    if (!Number.isInteger(data.tutorId) || data.tutorId <= 0) {
      throw new Error('Tutor inválido.');
    }

    if (
      data.especie !== 'CACHORRO' &&
      data.especie !== 'GATO'
    ) {
      throw new Error('Espécie inválida.');
    }

    if (data.idade < 0 || data.peso < 0) {
      throw new Error('Idade e peso não podem ser negativos.');
    }
  }
}
