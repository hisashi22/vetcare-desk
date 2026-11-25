
import test, { before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { DatabaseConnection } from '../database/DatabaseConnection';
import { AppRepositories } from '../repositories/AppRepositories';
import { ClinicaService } from './ClinicaService';
import { Tutor, Pet } from '../../shared/types';

let database: DatabaseConnection;
let repositories: AppRepositories;
let service: ClinicaService;
let tempDir: string;
let originalCwd: string;

function tutorData(
  overrides: Partial<Omit<Tutor, 'id'>> = {}
): Omit<Tutor, 'id'> {
  return {
    nome: 'Felipe Guidotti',
    cpf: '529.982.247-25',
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

function petData(
  tutorId: number,
  overrides: Partial<Omit<Pet, 'id'>> = {}
): Omit<Pet, 'id'> {
  return {
    tutorId,
    nome: 'Rex',
    especie: 'CACHORRO',
    raca: 'Labrador',
    idade: 5,
    peso: 25,
    observacoes: 'Pet saudável',
    ...overrides
  };
}

function createTutor(
  data: Omit<Tutor, 'id'> = tutorData()
): number {
  return service.cadastrarTutor(data);
}

function createPet(
  tutorId: number,
  data: Partial<Omit<Pet, 'id'>> = {}
): number {
  return service.cadastrarPet(petData(tutorId, data));
}

before(async () => {
  originalCwd = process.cwd();

  tempDir = mkdtempSync(join(tmpdir(), 'vetcare-clinica-tests-'));
  process.chdir(tempDir);

  database = DatabaseConnection.getInstance();
  await database.initialize();

  repositories = new AppRepositories();
  service = new ClinicaService(repositories);
});

beforeEach(() => {
  database.execute('DELETE FROM pets');
  database.execute('DELETE FROM tutores');
});

after(() => {
  database.close();
  process.chdir(originalCwd);
  rmSync(tempDir, { recursive: true, force: true });
});

// =========================
// TUTORES
// =========================

test('deve cadastrar um tutor e retornar seu ID', () => {
  const id = createTutor();

  assert.equal(typeof id, 'number');
  assert.ok(id > 0);
});

test('deve normalizar CPF ao cadastrar tutor', () => {
  const id = createTutor();

  const tutor = service.buscarTutor(id);

  assert.ok(tutor);
  assert.equal(tutor.cpf, '52998224725');
});

test('deve remover espaços extras do nome do tutor', () => {
  const id = createTutor(tutorData({
    nome: '  Felipe Guidotti  '
  }));

  assert.equal(service.buscarTutor(id)?.nome, 'Felipe Guidotti');
});

test('não deve cadastrar tutor com CPF inválido', () => {
  assert.throws(
    () => createTutor(tutorData({
      cpf: '111.111.111-11'
    })),
    /CPF inválido/
  );
});

test('não deve cadastrar tutor com CPF incompleto', () => {
  assert.throws(
    () => createTutor(tutorData({
      cpf: '12345'
    })),
    /CPF deve conter 11 dígitos/
  );
});

test('não deve cadastrar tutor com nome vazio', () => {
  assert.throws(
    () => createTutor(tutorData({
      nome: '   '
    })),
    /Nome do tutor é obrigatório/
  );
});

test('não deve cadastrar tutor com e-mail inválido', () => {
  assert.throws(
    () => createTutor(tutorData({
      email: 'email-invalido'
    })),
    /E-mail inválido/
  );
});

test('não deve cadastrar tutor com CEP inválido', () => {
  assert.throws(
    () => createTutor(tutorData({
      cep: '123'
    })),
    /CEP inválido/
  );
});

test('não deve cadastrar tutor com UF inválida', () => {
  assert.throws(
    () => createTutor(tutorData({
      uf: 'ABC'
    })),
    /UF deve conter duas letras/
  );
});

test('não deve permitir CPF duplicado', () => {
  createTutor();

  assert.throws(
    () => createTutor(tutorData({
      nome: 'Outro Tutor'
    })),
    /Este CPF já está cadastrado/
  );
});

test('deve buscar tutor por CPF com ou sem pontuação', () => {
  createTutor();

  const tutor = service.buscarTutorPorCpf('529.982.247-25');

  assert.ok(tutor);
  assert.equal(tutor.cpf, '52998224725');
});

test('deve retornar null quando CPF não existir', () => {
  assert.equal(
    service.buscarTutorPorCpf('11144477735'),
    null
  );
});

test('deve listar tutores cadastrados', () => {
  createTutor();

  const tutores = service.listarTutores();

  assert.equal(tutores.length, 1);
  assert.equal(tutores[0].nome, 'Felipe Guidotti');
});

test('deve buscar tutor pelo ID', () => {
  const id = createTutor();

  assert.equal(service.buscarTutor(id)?.id, id);
});

test('não deve buscar tutor com ID inválido', () => {
  assert.throws(
    () => service.buscarTutor(0),
    /Identificador inválido/
  );
});

test('deve atualizar os dados de um tutor', () => {
  const id = createTutor();

  const atualizado = service.atualizarTutor(
    id,
    tutorData({ nome: 'Felipe Atualizado' })
  );

  assert.equal(atualizado, true);
  assert.equal(
    service.buscarTutor(id)?.nome,
    'Felipe Atualizado'
  );
});

test('não deve atualizar tutor inexistente', () => {
  const atualizado = service.atualizarTutor(
    999,
    tutorData()
  );

  assert.equal(atualizado, false);
});

test('não deve permitir CPF pertencente a outro tutor', () => {
  createTutor();

  const outroId = createTutor(tutorData({
    nome: 'Outro Tutor',
    cpf: '11144477735'
  }));

  assert.throws(
    () => service.atualizarTutor(
      outroId,
      tutorData({ nome: 'Outro Tutor' })
    ),
    /Este CPF já pertence a outro tutor/
  );
});

test('deve permitir excluir tutor sem pets', () => {
  const id = createTutor();

  assert.equal(service.excluirTutor(id), true);
  assert.equal(service.buscarTutor(id), null);
});

// =========================
// PETS
// =========================

test('deve cadastrar um pet e retornar seu ID', () => {
  const tutorId = createTutor();
  const petId = createPet(tutorId);

  assert.equal(typeof petId, 'number');
  assert.ok(petId > 0);
});

test('não deve cadastrar pet com tutor inexistente', () => {
  assert.throws(
    () => createPet(999),
    /Tutor não encontrado/
  );
});

test('não deve cadastrar pet com nome vazio', () => {
  const tutorId = createTutor();

  assert.throws(
    () => createPet(tutorId, {
      nome: '   '
    }),
    /Nome do pet é obrigatório/
  );
});

test('não deve cadastrar pet com espécie inválida', () => {
  const tutorId = createTutor();

  assert.throws(
    () => createPet(tutorId, {
      especie: 'AVE' as Pet['especie']
    }),
    /Espécie inválida/
  );
});

test('não deve cadastrar pet com idade negativa', () => {
  const tutorId = createTutor();

  assert.throws(
    () => createPet(tutorId, {
      idade: -1
    }),
    /Idade do pet inválida/
  );
});

test('não deve cadastrar pet com idade decimal', () => {
  const tutorId = createTutor();

  assert.throws(
    () => createPet(tutorId, {
      idade: 2.5
    }),
    /Idade do pet inválida/
  );
});

test('não deve cadastrar pet com peso negativo', () => {
  const tutorId = createTutor();

  assert.throws(
    () => createPet(tutorId, {
      peso: -1
    }),
    /Peso do pet inválido/
  );
});

test('deve listar pets cadastrados', () => {
  const tutorId = createTutor();
  createPet(tutorId);

  const pets = service.listarPets();

  assert.equal(pets.length, 1);
  assert.equal(pets[0].nome, 'Rex');
});

test('deve buscar pet pelo ID', () => {
  const tutorId = createTutor();
  const petId = createPet(tutorId);

  assert.equal(service.buscarPet(petId)?.id, petId);
});

test('deve retornar null quando pet não existir', () => {
  assert.equal(service.buscarPet(999), null);
});

test('deve listar pets de um tutor', () => {
  const tutorId = createTutor();

  createPet(tutorId);
  createPet(tutorId, {
    nome: 'Mimi',
    especie: 'GATO'
  });

  const pets = service.listarPetsDoTutor(tutorId);

  assert.equal(pets.length, 2);
});

test('não deve listar pets de tutor inexistente', () => {
  assert.throws(
    () => service.listarPetsDoTutor(999),
    /Tutor não encontrado/
  );
});

test('deve atualizar os dados de um pet', () => {
  const tutorId = createTutor();
  const petId = createPet(tutorId);

  const atualizado = service.atualizarPet(
    petId,
    petData(tutorId, { nome: 'Rex Atualizado' })
  );

  assert.equal(atualizado, true);
  assert.equal(
    service.buscarPet(petId)?.nome,
    'Rex Atualizado'
  );
});

test('deve retornar false ao atualizar pet inexistente', () => {
  const tutorId = createTutor();

  const atualizado = service.atualizarPet(
    999,
    petData(tutorId)
  );

  assert.equal(atualizado, false);
});

test('deve excluir pet existente', () => {
  const tutorId = createTutor();
  const petId = createPet(tutorId);

  assert.equal(service.excluirPet(petId), true);
  assert.equal(service.buscarPet(petId), null);
});

test('não deve excluir pet inexistente', () => {
  assert.equal(service.excluirPet(999), false);
});

test('não deve excluir tutor que possui pets', () => {
  const tutorId = createTutor();
  createPet(tutorId);

  assert.throws(
    () => service.excluirTutor(tutorId),
    /Não é possível excluir um tutor que possui pets cadastrados/
  );
});

test('deve rejeitar identificadores inválidos', () => {
  assert.throws(
    () => service.buscarPet(0),
    /Identificador inválido/
  );

  assert.throws(
    () => service.buscarTutor(-1),
    /Identificador inválido/
  );
});
