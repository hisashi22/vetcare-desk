
import { DatabaseConnection } from '../database/DatabaseConnection';
import { Tutor } from '../../shared/types';
import { BaseRepository } from './BaseRepository';

export class TutorRepository extends BaseRepository<Tutor> {
  constructor() {
    super('tutores', [
      'nome',
      'cpf',
      'email',
      'telefone',
      'cep',
      'logradouro',
      'bairro',
      'cidade',
      'uf'
    ]);
  }

  public override findAll(): Tutor[] {
    return this.database.query<Tutor>(`
      SELECT
        id,
        nome,
        cpf,
        COALESCE(telefone, '') AS telefone,
        COALESCE(email, '') AS email,
        COALESCE(cep, '') AS cep,
        COALESCE(logradouro, '') AS logradouro,
        COALESCE(bairro, '') AS bairro,
        COALESCE(cidade, '') AS cidade,
        COALESCE(uf, '') AS uf
      FROM tutores
      ORDER BY nome
    `);
  }

  public override findById(id: number): Tutor | null {
    const results = this.database.query<Tutor>(`
      SELECT
        id,
        nome,
        cpf,
        COALESCE(telefone, '') AS telefone,
        COALESCE(email, '') AS email,
        COALESCE(cep, '') AS cep,
        COALESCE(logradouro, '') AS logradouro,
        COALESCE(bairro, '') AS bairro,
        COALESCE(cidade, '') AS cidade,
        COALESCE(uf, '') AS uf
      FROM tutores
      WHERE id = ?
    `, [id]);

    return results[0] ?? null;
  }

  public findByCpf(cpf: string): Tutor | null {
    const results = this.database.query<Tutor>(`
      SELECT
        id,
        nome,
        cpf,
        COALESCE(telefone, '') AS telefone,
        COALESCE(email, '') AS email,
        COALESCE(cep, '') AS cep,
        COALESCE(logradouro, '') AS logradouro,
        COALESCE(bairro, '') AS bairro,
        COALESCE(cidade, '') AS cidade,
        COALESCE(uf, '') AS uf
      FROM tutores
      WHERE cpf = ?
    `, [cpf]);

    return results[0] ?? null;
  }

  public createTutor(data: Omit<Tutor, 'id'>): number {
    if (!data.nome.trim() || !data.cpf.trim()) {
      throw new Error('Nome e CPF são obrigatórios.');
    }

    this.database.execute(`
      INSERT INTO tutores (
        nome, cpf, telefone, email, cep,
        logradouro, bairro, cidade, uf
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.nome.trim(),
      data.cpf.trim(),
      data.telefone || '',
      data.email || '',
      data.cep || '',
      data.logradouro || '',
      data.bairro || '',
      data.cidade || '',
      data.uf || ''
    ]);

    return this.database.getLastInsertId();
  }

  public updateTutor(
    id: number,
    data: Omit<Tutor, 'id'>
  ): boolean {
    if (!this.findById(id)) return false;

    if (!data.nome.trim() || !data.cpf.trim()) {
      throw new Error('Nome e CPF são obrigatórios.');
    }

    this.database.execute(`
      UPDATE tutores SET
        nome = ?,
        cpf = ?,
        telefone = ?,
        email = ?,
        cep = ?,
        logradouro = ?,
        bairro = ?,
        cidade = ?,
        uf = ?
      WHERE id = ?
    `, [
      data.nome.trim(),
      data.cpf.trim(),
      data.telefone || '',
      data.email || '',
      data.cep || '',
      data.logradouro || '',
      data.bairro || '',
      data.cidade || '',
      data.uf || '',
      id
    ]);

    return true;
  }

  public deleteTutor(id: number): boolean {
    if (!this.findById(id)) return false;

    this.database.execute(
      'DELETE FROM tutores WHERE id = ?',
      [id]
    );

    return true;
  }
}
