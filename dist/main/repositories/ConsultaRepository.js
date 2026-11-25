"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsultaRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const CONSULTA_SELECT = `
  SELECT
    id,
    pet_id AS petId,
    veterinario_id AS veterinarioId,
    data_consulta AS data,
    COALESCE(diagnostico, '') AS diagnostico
  FROM consultas
`;
class ConsultaRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('consultas', [
            'pet_id',
            'veterinario_id',
            'data_consulta',
            'diagnostico',
            'observacoes'
        ]);
    }
    findAll() {
        return this.database.query(`${CONSULTA_SELECT} ORDER BY data_consulta DESC`);
    }
    findById(id) {
        const results = this.database.query(`${CONSULTA_SELECT} WHERE id = ?`, [id]);
        return results[0] ?? null;
    }
    findByPetId(petId) {
        return this.database.query(`${CONSULTA_SELECT} WHERE pet_id = ? ORDER BY data_consulta DESC`, [petId]);
    }
    createConsulta(data) {
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
    updateConsulta(id, data) {
        if (!this.findById(id))
            return false;
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
    validateConsulta(data) {
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
    findByVeterinarioId(veterinarioId) {
        return this.database.query(`${CONSULTA_SELECT} WHERE veterinario_id = ? ORDER BY data_consulta DESC`, [veterinarioId]);
    }
}
exports.ConsultaRepository = ConsultaRepository;
