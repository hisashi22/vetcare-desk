import { Veterinario } from '../../shared/types';
import { BaseRepository } from './BaseRepository';

export class VeterinarioRepository extends BaseRepository<Veterinario> {
  constructor() {
    super('veterinarios', [
        'usuario_id',
        'crmv',
         'especialidade', 
         'telefone'
      
    ]);
  }


public override findAll(): Veterinario[] {
    return this.database.query<Veterinario>(`
      SELECT
        id,
        usuario_id AS usuarioId,
        crmv,
        COALESCE((SELECT nome FROM usuarios WHERE id = usuario_id), '') AS nome,
        COALESCE(especialidade, '') AS especialidade,
        COALESCE(telefone, '') AS telefone
      FROM veterinarios
      ORDER BY crmv
    `);
  }

   public override findById(id: number): Veterinario | null {
      const results = this.database.query<Veterinario>(`
        SELECT 
          id,
          usuario_id AS usuarioId,
          crmv,
          COALESCE(especialidade, '') AS especialidade,
          COALESCE(telefone, '') AS telefone
        FROM veterinarios
        WHERE id = ?
      `, [id]);
  
      return results[0] ?? null;
    }


     public findByCrmv(crmv: string): Veterinario | null {
        const results = this.database.query<Veterinario>(`
          SELECT
            id,
            usuario_id AS usuarioId,
            crmv,
            COALESCE(especialidade, '') AS especialidade,
            COALESCE(telefone, '') AS telefone
          FROM veterinarios
          WHERE crmv = ?
        `, [crmv]);
        return results[0] ?? null;
      }
    
 
    public findByUsuarioId(usuarioId: number): Veterinario | null {
        const results = this.database.query<Veterinario>(`
         SELECT
        id,
        usuario_id AS usuarioId,
        crmv,
        COALESCE(especialidade, '') AS especialidade,
        COALESCE(telefone, '') AS telefone
      FROM veterinarios
      WHERE usuario_id = ?
    `, [usuarioId]);

    return results[0] ?? null;
  }  

     public createVeterinario(data: Omit<Veterinario, 'id'>): number {
    this.validateVeterinario(data);

    this.database.execute(`
      INSERT INTO veterinarios (
        usuario_id,
        crmv,
        especialidade,
        telefone
      )
      VALUES (?, ?, ?, ?)
    `, [
      data.usuarioId,
      data.crmv.trim(),
      data.especialidade || '',
      data.telefone || ''
    ]);

    return this.database.getLastInsertId();
  }

  private validateVeterinario(data: Omit<Veterinario, 'id'>): void {
    if (!Number.isInteger(data.usuarioId) || data.usuarioId <= 0) {
      throw new Error('Usuário inválido.');
    }

    if (!data.crmv.trim()) {
      throw new Error('O CRMV é obrigatório.');
    }
  }

    public updateVeterinario(
    id: number,
    data: Omit<Veterinario, 'id'>
  ): boolean {
    if (!this.findById(id)) return false;

    this.validateVeterinario(data);

    this.database.execute(`
      UPDATE veterinarios SET
        usuario_id = ?,
        crmv = ?,
        especialidade = ?,
        telefone = ?
      WHERE id = ?
    `, [
      data.usuarioId,
      data.crmv.trim(),
      data.especialidade || '',
      data.telefone || '',
      id
    ]);

    return true;
  }

    public usuarioEhVeterinario(usuarioId: number): boolean {
    const results = this.database.query<{ id: number }>(
      `SELECT id FROM usuarios WHERE id = ? AND perfil = 'VETERINARIO'`,
      [usuarioId]
    );

    return results.length > 0;
  }

}


