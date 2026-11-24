"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class PetRepository extends BaseRepository_1.BaseRepository {
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
    findAll() {
        return this.database.query(`
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
    findById(id) {
        const results = this.database.query(`
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
    findByTutorId(tutorId) {
        return this.database.query(`
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
    createPet(data) {
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
    updatePet(id, data) {
        if (!this.findById(id))
            return false;
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
    deletePet(id) {
        if (!this.findById(id))
            return false;
        this.database.execute('DELETE FROM pets WHERE id = ?', [id]);
        return true;
    }
    validatePet(data) {
        if (!data.nome.trim()) {
            throw new Error('O nome do pet é obrigatório.');
        }
        if (!Number.isInteger(data.tutorId) || data.tutorId <= 0) {
            throw new Error('Tutor inválido.');
        }
        if (data.especie !== 'CACHORRO' &&
            data.especie !== 'GATO') {
            throw new Error('Espécie inválida.');
        }
        if (data.idade < 0 || data.peso < 0) {
            throw new Error('Idade e peso não podem ser negativos.');
        }
    }
}
exports.PetRepository = PetRepository;
