import test, { before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { DatabaseConnection } from '../database/DatabaseConnection';
import { TutorRepository } from './TutorRepository';
import { Tutor } from '../../shared/types';

let database: DatabaseConnection;
let repository: TutorRepository;
let tempDir: string;
let originalCwd: string;

function tutorData(
  overrides: Partial<Omit<Tutor, 'id'>> = {}
): Omit<Tutor, 'id'> {
  return {
    nome: 'Felipe Guidotti',
    cpf: '12345678901',
    telefone: '19999999999',
    email: 'felipe@email.com',
    cep: '13600000',
    logradouro: 'Rua Central',
    bairro: 'Centro',
    cidade: 'Araras',
    uf: 'SP',
    ...overrides
  };
}

before(async () => {
  originalCwd = process.cwd();

  tempDir = mkdtempSync(join(tmpdir(), 'vetcare-tutor-tests-'));
  process.chdir(tempDir);

  database = DatabaseConnection.getInstance();
  await database.initialize();

  repository = new TutorRepository();
});

beforeEach(() => {
  database.execute('DELETE FROM tutores');
});

after(() => {
  database.close();
  process.chdir(originalCwd);
  rmSync(tempDir, { recursive: true, force: true });
});

test('deve cadastrar um tutor e retornar seu ID', () => {
  const id = repository.createTutor(tutorData());

  assert.equal(typeof id, 'number');
  assert.ok(id > 0);
});

test('deve buscar um tutor pelo ID', () => {
  const id = repository.createTutor(tutorData());

  const tutor = repository.findById(id);

  assert.ok(tutor);
  assert.equal(tutor.id, id);
  assert.equal(tutor.nome, 'Felipe Guidotti');
});

test('deve retornar null quando o ID não existir', () => {
  assert.equal(repository.findById(999), null);
});

test('deve buscar um tutor pelo CPF', () => {
  repository.createTutor(tutorData());

  const tutor = repository.findByCpf('12345678901');

  assert.ok(tutor);
  assert.equal(tutor.cpf, '12345678901');
});

test('deve retornar null quando o CPF não existir', () => {
  assert.equal(repository.findByCpf('00000000000'), null);
});

test('deve listar tutores em ordem alfabética', () => {
  repository.createTutor(tutorData({
    nome: 'Zeca'
  }));

  repository.createTutor(tutorData({
    nome: 'Ana',
    cpf: '98765432100'
  }));

  const tutores = repository.findAll();

  assert.deepEqual(
    tutores.map(tutor => tutor.nome),
    ['Ana', 'Zeca']
  );
});

test('deve atualizar os dados de um tutor', () => {
  const id = repository.createTutor(tutorData());

  const atualizado = repository.updateTutor(
    id,
    tutorData({ nome: 'Felipe Atualizado' })
  );

  assert.equal(atualizado, true);
  assert.equal(repository.findById(id)?.nome, 'Felipe Atualizado');
});

test('não deve atualizar um tutor inexistente', () => {
  const atualizado = repository.updateTutor(
    999,
    tutorData()
  );

  assert.equal(atualizado, false);
});

test('deve excluir um tutor existente', () => {
  const id = repository.createTutor(tutorData());

  assert.equal(repository.deleteTutor(id), true);
  assert.equal(repository.findById(id), null);
});

test('não deve excluir um tutor inexistente', () => {
  assert.equal(repository.deleteTutor(999), false);
});

test('não deve cadastrar tutor com nome vazio', () => {
  assert.throws(
    () => repository.createTutor(tutorData({ nome: '   ' })),
    /Nome e CPF são obrigatórios/
  );
});

test('não deve cadastrar tutor com CPF vazio', () => {
  assert.throws(
    () => repository.createTutor(tutorData({ cpf: '   ' })),
    /Nome e CPF são obrigatórios/
  );
});

test('não deve permitir CPF duplicado', () => {
  repository.createTutor(tutorData());

  assert.throws(
    () => repository.createTutor(tutorData({
      nome: 'Outro Tutor'
    })),
    /UNIQUE constraint failed/
  );
});
