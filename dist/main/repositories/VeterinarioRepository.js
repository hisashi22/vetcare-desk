"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VeterinarioRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class VeterinarioRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('veterinarios', [
            'usuario_id',
            'crmv',
            'especialidade',
            'telefone'
        ]);
    }
    findAll() {
        return this.database.query(`
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
    findById(id) {
        const results = this.database.query(`
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
    findByCrmv(crmv) {
        const results = this.database.query(`
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
    findByUsuarioId(usuarioId) {
        const results = this.database.query(`
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
    createVeterinario(data) {
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
    validateVeterinario(data) {
        if (!Number.isInteger(data.usuarioId) || data.usuarioId <= 0) {
            throw new Error('Usuário inválido.');
        }
        if (!data.crmv.trim()) {
            throw new Error('O CRMV é obrigatório.');
        }
    }
    updateVeterinario(id, data) {
        if (!this.findById(id))
            return false;
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
    usuarioEhVeterinario(usuarioId) {
        const results = this.database.query(`SELECT id FROM usuarios WHERE id = ? AND perfil = 'VETERINARIO'`, [usuarioId]);
        return results.length > 0;
    }
}
exports.VeterinarioRepository = VeterinarioRepository;
