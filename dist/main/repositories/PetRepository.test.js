"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importStar(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const node_fs_1 = require("node:fs");
const node_os_1 = require("node:os");
const node_path_1 = require("node:path");
const DatabaseConnection_1 = require("../database/DatabaseConnection");
const PetRepository_1 = require("./PetRepository");
const TutorRepository_1 = require("./TutorRepository");
let database;
let petRepository;
let tutorRepository;
let tempDir;
let originalCwd;
let tutorId;
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
function petData(overrides = {}) {
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
(0, node_test_1.before)(async () => {
    originalCwd = process.cwd();
    tempDir = (0, node_fs_1.mkdtempSync)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'vetcare-pet-tests-'));
    process.chdir(tempDir);
    database = DatabaseConnection_1.DatabaseConnection.getInstance();
    await database.initialize();
    petRepository = new PetRepository_1.PetRepository();
    tutorRepository = new TutorRepository_1.TutorRepository();
});
(0, node_test_1.beforeEach)(() => {
    database.execute('DELETE FROM pets');
    database.execute('DELETE FROM tutores');
    tutorId = tutorRepository.createTutor(tutorData());
});
(0, node_test_1.after)(() => {
    database.close();
    process.chdir(originalCwd);
    (0, node_fs_1.rmSync)(tempDir, { recursive: true, force: true });
});
(0, node_test_1.default)('deve cadastrar um pet e retornar seu ID', () => {
    const id = petRepository.createPet(petData());
    strict_1.default.equal(typeof id, 'number');
    strict_1.default.ok(id > 0);
});
(0, node_test_1.default)('deve buscar um pet pelo ID', () => {
    const id = petRepository.createPet(petData());
    const pet = petRepository.findById(id);
    strict_1.default.ok(pet);
    strict_1.default.equal(pet.id, id);
    strict_1.default.equal(pet.nome, 'Rex');
    strict_1.default.equal(pet.tutorId, tutorId);
});
(0, node_test_1.default)('deve retornar null quando o ID não existir', () => {
    strict_1.default.equal(petRepository.findById(999), null);
});
(0, node_test_1.default)('deve listar todos os pets em ordem alfabética', () => {
    petRepository.createPet(petData({
        nome: 'Zeca'
    }));
    petRepository.createPet(petData({
        nome: 'Amora'
    }));
    const pets = petRepository.findAll();
    strict_1.default.deepEqual(pets.map(pet => pet.nome), ['Amora', 'Zeca']);
});
(0, node_test_1.default)('deve buscar pets pelo ID do tutor', () => {
    petRepository.createPet(petData({ nome: 'Rex' }));
    petRepository.createPet(petData({ nome: 'Luna' }));
    const pets = petRepository.findByTutorId(tutorId);
    strict_1.default.equal(pets.length, 2);
    strict_1.default.deepEqual(pets.map(pet => pet.nome), ['Luna', 'Rex']);
});
(0, node_test_1.default)('deve retornar lista vazia quando tutor não possuir pets', () => {
    strict_1.default.deepEqual(petRepository.findByTutorId(tutorId), []);
});
(0, node_test_1.default)('deve atualizar os dados de um pet', () => {
    const id = petRepository.createPet(petData());
    const atualizado = petRepository.updatePet(id, petData({ nome: 'Rex Atualizado', idade: 4 }));
    strict_1.default.equal(atualizado, true);
    strict_1.default.equal(petRepository.findById(id)?.nome, 'Rex Atualizado');
    strict_1.default.equal(petRepository.findById(id)?.idade, 4);
});
(0, node_test_1.default)('não deve atualizar um pet inexistente', () => {
    strict_1.default.equal(petRepository.updatePet(999, petData()), false);
});
(0, node_test_1.default)('deve excluir um pet existente', () => {
    const id = petRepository.createPet(petData());
    strict_1.default.equal(petRepository.deletePet(id), true);
    strict_1.default.equal(petRepository.findById(id), null);
});
(0, node_test_1.default)('não deve excluir um pet inexistente', () => {
    strict_1.default.equal(petRepository.deletePet(999), false);
});
(0, node_test_1.default)('não deve cadastrar pet com nome vazio', () => {
    strict_1.default.throws(() => petRepository.createPet(petData({ nome: '   ' })), /O nome do pet é obrigatório/);
});
(0, node_test_1.default)('não deve cadastrar pet com tutor inválido', () => {
    strict_1.default.throws(() => petRepository.createPet(petData({ tutorId: 0 })), /Tutor inválido/);
});
(0, node_test_1.default)('não deve cadastrar pet com espécie inválida', () => {
    strict_1.default.throws(() => petRepository.createPet(petData({ especie: 'AVE' })), /Espécie inválida/);
});
(0, node_test_1.default)('não deve cadastrar pet com idade ou peso negativos', () => {
    strict_1.default.throws(() => petRepository.createPet(petData({ idade: -1 })), /Idade e peso não podem ser negativos/);
    strict_1.default.throws(() => petRepository.createPet(petData({ peso: -1 })), /Idade e peso não podem ser negativos/);
});
(0, node_test_1.default)('deve permitir cadastrar um gato', () => {
    const id = petRepository.createPet(petData({ especie: 'GATO', nome: 'Mimi' }));
    strict_1.default.equal(petRepository.findById(id)?.especie, 'GATO');
});
(0, node_test_1.default)('o banco deve impedir cadastro com tutor inexistente', () => {
    strict_1.default.throws(() => petRepository.createPet(petData({ tutorId: 999 })), /FOREIGN KEY constraint failed/);
});
