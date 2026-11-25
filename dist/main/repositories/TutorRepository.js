"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class TutorRepository extends BaseRepository_1.BaseRepository {
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
    findAll() {
        return this.database.query(`
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
    findById(id) {
        const results = this.database.query(`
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
    findByCpf(cpf) {
        const results = this.database.query(`
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
    createTutor(data) {
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
    updateTutor(id, data) {
        if (!this.findById(id))
            return false;
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
    deleteTutor(id) {
        if (!this.findById(id))
            return false;
        this.database.execute('DELETE FROM tutores WHERE id = ?', [id]);
        return true;
    }
}
exports.TutorRepository = TutorRepository;
