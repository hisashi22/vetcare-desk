import test, { before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { DatabaseConnection } from '../database/DatabaseConnection';
import { PetRepository } from './PetRepository';
import { TutorRepository } from './TutorRepository';
import { Pet } from '../../shared/types';

let database: DatabaseConnection;
let petRepository: PetRepository;
let tutorRepository: TutorRepository;
let tempDir: string;
let originalCwd: string;
let tutorId: number;

function tutorData() {
  return {
    nome: 'Felipe Guidotti',
    cpf: '12345678901',
    telefone: '19999999999',
    email: 'felipe@email.com',
    cep: '13600000',
    logradouro: 'Rua Central',
    bairro: 'Centro',
    cidade: 'Araras',
    uf: 'SP'
  };
}

function petData(
  overrides: Partial<Omit<Pet, 'id'>> = {}
): Omit<Pet, 'id'> {
  return {
    tutorId,
    nome: 'Rex',
    especie: 'CACHORRO',
    raca: 'Labrador',
    idade: 3,
    peso: 25,
    observacoes: 'Pet saudável',
    ...overrides
  };
}

before(async () => {
  originalCwd = process.cwd();

  tempDir = mkdtempSync(join(tmpdir(), 'vetcare-pet-tests-'));
  process.chdir(tempDir);

  database = DatabaseConnection.getInstance();
  await database.initialize();

  petRepository = new PetRepository();
  tutorRepository = new TutorRepository();
});

beforeEach(() => {
  database.execute('DELETE FROM pets');
  database.execute('DELETE FROM tutores');

  tutorId = tutorRepository.createTutor(tutorData());
});

after(() => {
  database.close();
  process.chdir(originalCwd);
  rmSync(tempDir, { recursive: true, force: true });
});

test('deve cadastrar um pet e retornar seu ID', () => {
  const id = petRepository.createPet(petData());

  assert.equal(typeof id, 'number');
  assert.ok(id > 0);
});

test('deve buscar um pet pelo ID', () => {
  const id = petRepository.createPet(petData());

  const pet = petRepository.findById(id);

  assert.ok(pet);
  assert.equal(pet.id, id);
  assert.equal(pet.nome, 'Rex');
  assert.equal(pet.tutorId, tutorId);
});

test('deve retornar null quando o ID não existir', () => {
  assert.equal(petRepository.findById(999), null);
});

test('deve listar todos os pets em ordem alfabética', () => {
  petRepository.createPet(petData({
    nome: 'Zeca'
  }));

  petRepository.createPet(petData({
    nome: 'Amora'
  }));

  const pets = petRepository.findAll();

  assert.deepEqual(
    pets.map(pet => pet.nome),
    ['Amora', 'Zeca']
  );
});

test('deve buscar pets pelo ID do tutor', () => {
  petRepository.createPet(petData({ nome: 'Rex' }));
  petRepository.createPet(petData({ nome: 'Luna' }));

  const pets = petRepository.findByTutorId(tutorId);

  assert.equal(pets.length, 2);
  assert.deepEqual(
    pets.map(pet => pet.nome),
    ['Luna', 'Rex']
  );
});

test('deve retornar lista vazia quando tutor não possuir pets', () => {
  assert.deepEqual(
    petRepository.findByTutorId(tutorId),
    []
  );
});

test('deve atualizar os dados de um pet', () => {
  const id = petRepository.createPet(petData());

  const atualizado = petRepository.updatePet(
    id,
    petData({ nome: 'Rex Atualizado', idade: 4 })
  );

  assert.equal(atualizado, true);
  assert.equal(petRepository.findById(id)?.nome, 'Rex Atualizado');
  assert.equal(petRepository.findById(id)?.idade, 4);
});

test('não deve atualizar um pet inexistente', () => {
  assert.equal(
    petRepository.updatePet(999, petData()),
    false
  );
});

test('deve excluir um pet existente', () => {
  const id = petRepository.createPet(petData());

  assert.equal(petRepository.deletePet(id), true);
  assert.equal(petRepository.findById(id), null);
});

test('não deve excluir um pet inexistente', () => {
  assert.equal(petRepository.deletePet(999), false);
});

test('não deve cadastrar pet com nome vazio', () => {
  assert.throws(
    () => petRepository.createPet(petData({ nome: '   ' })),
    /O nome do pet é obrigatório/
  );
});

test('não deve cadastrar pet com tutor inválido', () => {
  assert.throws(
    () => petRepository.createPet(petData({ tutorId: 0 })),
    /Tutor inválido/
  );
});

test('não deve cadastrar pet com espécie inválida', () => {
  assert.throws(
    () => petRepository.createPet(
      petData({ especie: 'AVE' as Pet['especie'] })
    ),
    /Espécie inválida/
  );
});

test('não deve cadastrar pet com idade ou peso negativos', () => {
  assert.throws(
    () => petRepository.createPet(petData({ idade: -1 })),
    /Idade e peso não podem ser negativos/
  );

  assert.throws(
    () => petRepository.createPet(petData({ peso: -1 })),
    /Idade e peso não podem ser negativos/
  );
});

test('deve permitir cadastrar um gato', () => {
  const id = petRepository.createPet(
    petData({ especie: 'GATO', nome: 'Mimi' })
  );

  assert.equal(petRepository.findById(id)?.especie, 'GATO');
});

test('o banco deve impedir cadastro com tutor inexistente', () => {
  assert.throws(
    () => petRepository.createPet(petData({ tutorId: 999 })),
    /FOREIGN KEY constraint failed/
  );
});
