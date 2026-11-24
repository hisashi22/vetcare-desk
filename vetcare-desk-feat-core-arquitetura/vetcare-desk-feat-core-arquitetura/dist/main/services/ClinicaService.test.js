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
const AppRepositories_1 = require("../repositories/AppRepositories");
const ClinicaService_1 = require("./ClinicaService");
let database;
let repositories;
let service;
let tempDir;
let originalCwd;
function tutorData(overrides = {}) {
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
function petData(tutorId, overrides = {}) {
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
function createTutor(data = tutorData()) {
    return service.cadastrarTutor(data);
}
function createPet(tutorId, data = {}) {
    return service.cadastrarPet(petData(tutorId, data));
}
(0, node_test_1.before)(async () => {
    originalCwd = process.cwd();
    tempDir = (0, node_fs_1.mkdtempSync)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'vetcare-clinica-tests-'));
    process.chdir(tempDir);
    database = DatabaseConnection_1.DatabaseConnection.getInstance();
    await database.initialize();
    repositories = new AppRepositories_1.AppRepositories();
    service = new ClinicaService_1.ClinicaService(repositories);
});
(0, node_test_1.beforeEach)(() => {
    database.execute('DELETE FROM pets');
    database.execute('DELETE FROM tutores');
});
(0, node_test_1.after)(() => {
    database.close();
    process.chdir(originalCwd);
    (0, node_fs_1.rmSync)(tempDir, { recursive: true, force: true });
});
// =========================
// TUTORES
// =========================
(0, node_test_1.default)('deve cadastrar um tutor e retornar seu ID', () => {
    const id = createTutor();
    strict_1.default.equal(typeof id, 'number');
    strict_1.default.ok(id > 0);
});
(0, node_test_1.default)('deve normalizar CPF ao cadastrar tutor', () => {
    const id = createTutor();
    const tutor = service.buscarTutor(id);
    strict_1.default.ok(tutor);
    strict_1.default.equal(tutor.cpf, '52998224725');
});
(0, node_test_1.default)('deve remover espaços extras do nome do tutor', () => {
    const id = createTutor(tutorData({
        nome: '  Felipe Guidotti  '
    }));
    strict_1.default.equal(service.buscarTutor(id)?.nome, 'Felipe Guidotti');
});
(0, node_test_1.default)('não deve cadastrar tutor com CPF inválido', () => {
    strict_1.default.throws(() => createTutor(tutorData({
        cpf: '111.111.111-11'
    })), /CPF inválido/);
});
(0, node_test_1.default)('não deve cadastrar tutor com CPF incompleto', () => {
    strict_1.default.throws(() => createTutor(tutorData({
        cpf: '12345'
    })), /CPF deve conter 11 dígitos/);
});
(0, node_test_1.default)('não deve cadastrar tutor com nome vazio', () => {
    strict_1.default.throws(() => createTutor(tutorData({
        nome: '   '
    })), /Nome do tutor é obrigatório/);
});
(0, node_test_1.default)('não deve cadastrar tutor com e-mail inválido', () => {
    strict_1.default.throws(() => createTutor(tutorData({
        email: 'email-invalido'
    })), /E-mail inválido/);
});
(0, node_test_1.default)('não deve cadastrar tutor com CEP inválido', () => {
    strict_1.default.throws(() => createTutor(tutorData({
        cep: '123'
    })), /CEP inválido/);
});
(0, node_test_1.default)('não deve cadastrar tutor com UF inválida', () => {
    strict_1.default.throws(() => createTutor(tutorData({
        uf: 'ABC'
    })), /UF deve conter duas letras/);
});
(0, node_test_1.default)('não deve permitir CPF duplicado', () => {
    createTutor();
    strict_1.default.throws(() => createTutor(tutorData({
        nome: 'Outro Tutor'
    })), /Este CPF já está cadastrado/);
});
(0, node_test_1.default)('deve buscar tutor por CPF com ou sem pontuação', () => {
    createTutor();
    const tutor = service.buscarTutorPorCpf('529.982.247-25');
    strict_1.default.ok(tutor);
    strict_1.default.equal(tutor.cpf, '52998224725');
});
(0, node_test_1.default)('deve retornar null quando CPF não existir', () => {
    strict_1.default.equal(service.buscarTutorPorCpf('11144477735'), null);
});
(0, node_test_1.default)('deve listar tutores cadastrados', () => {
    createTutor();
    const tutores = service.listarTutores();
    strict_1.default.equal(tutores.length, 1);
    strict_1.default.equal(tutores[0].nome, 'Felipe Guidotti');
});
(0, node_test_1.default)('deve buscar tutor pelo ID', () => {
    const id = createTutor();
    strict_1.default.equal(service.buscarTutor(id)?.id, id);
});
(0, node_test_1.default)('não deve buscar tutor com ID inválido', () => {
    strict_1.default.throws(() => service.buscarTutor(0), /Identificador inválido/);
});
(0, node_test_1.default)('deve atualizar os dados de um tutor', () => {
    const id = createTutor();
    const atualizado = service.atualizarTutor(id, tutorData({ nome: 'Felipe Atualizado' }));
    strict_1.default.equal(atualizado, true);
    strict_1.default.equal(service.buscarTutor(id)?.nome, 'Felipe Atualizado');
});
(0, node_test_1.default)('não deve atualizar tutor inexistente', () => {
    const atualizado = service.atualizarTutor(999, tutorData());
    strict_1.default.equal(atualizado, false);
});
(0, node_test_1.default)('não deve permitir CPF pertencente a outro tutor', () => {
    createTutor();
    const outroId = createTutor(tutorData({
        nome: 'Outro Tutor',
        cpf: '11144477735'
    }));
    strict_1.default.throws(() => service.atualizarTutor(outroId, tutorData({ nome: 'Outro Tutor' })), /Este CPF já pertence a outro tutor/);
});
(0, node_test_1.default)('deve permitir excluir tutor sem pets', () => {
    const id = createTutor();
    strict_1.default.equal(service.excluirTutor(id), true);
    strict_1.default.equal(service.buscarTutor(id), null);
});
// =========================
// PETS
// =========================
(0, node_test_1.default)('deve cadastrar um pet e retornar seu ID', () => {
    const tutorId = createTutor();
    const petId = createPet(tutorId);
    strict_1.default.equal(typeof petId, 'number');
    strict_1.default.ok(petId > 0);
});
(0, node_test_1.default)('não deve cadastrar pet com tutor inexistente', () => {
    strict_1.default.throws(() => createPet(999), /Tutor não encontrado/);
});
(0, node_test_1.default)('não deve cadastrar pet com nome vazio', () => {
    const tutorId = createTutor();
    strict_1.default.throws(() => createPet(tutorId, {
        nome: '   '
    }), /Nome do pet é obrigatório/);
});
(0, node_test_1.default)('não deve cadastrar pet com espécie inválida', () => {
    const tutorId = createTutor();
    strict_1.default.throws(() => createPet(tutorId, {
        especie: 'AVE'
    }), /Espécie inválida/);
});
(0, node_test_1.default)('não deve cadastrar pet com idade negativa', () => {
    const tutorId = createTutor();
    strict_1.default.throws(() => createPet(tutorId, {
        idade: -1
    }), /Idade do pet inválida/);
});
(0, node_test_1.default)('não deve cadastrar pet com idade decimal', () => {
    const tutorId = createTutor();
    strict_1.default.throws(() => createPet(tutorId, {
        idade: 2.5
    }), /Idade do pet inválida/);
});
(0, node_test_1.default)('não deve cadastrar pet com peso negativo', () => {
    const tutorId = createTutor();
    strict_1.default.throws(() => createPet(tutorId, {
        peso: -1
    }), /Peso do pet inválido/);
});
(0, node_test_1.default)('deve listar pets cadastrados', () => {
    const tutorId = createTutor();
    createPet(tutorId);
    const pets = service.listarPets();
    strict_1.default.equal(pets.length, 1);
    strict_1.default.equal(pets[0].nome, 'Rex');
});
(0, node_test_1.default)('deve buscar pet pelo ID', () => {
    const tutorId = createTutor();
    const petId = createPet(tutorId);
    strict_1.default.equal(service.buscarPet(petId)?.id, petId);
});
(0, node_test_1.default)('deve retornar null quando pet não existir', () => {
    strict_1.default.equal(service.buscarPet(999), null);
});
(0, node_test_1.default)('deve listar pets de um tutor', () => {
    const tutorId = createTutor();
    createPet(tutorId);
    createPet(tutorId, {
        nome: 'Mimi',
        especie: 'GATO'
    });
    const pets = service.listarPetsDoTutor(tutorId);
    strict_1.default.equal(pets.length, 2);
});
(0, node_test_1.default)('não deve listar pets de tutor inexistente', () => {
    strict_1.default.throws(() => service.listarPetsDoTutor(999), /Tutor não encontrado/);
});
(0, node_test_1.default)('deve atualizar os dados de um pet', () => {
    const tutorId = createTutor();
    const petId = createPet(tutorId);
    const atualizado = service.atualizarPet(petId, petData(tutorId, { nome: 'Rex Atualizado' }));
    strict_1.default.equal(atualizado, true);
    strict_1.default.equal(service.buscarPet(petId)?.nome, 'Rex Atualizado');
});
(0, node_test_1.default)('deve retornar false ao atualizar pet inexistente', () => {
    const tutorId = createTutor();
    const atualizado = service.atualizarPet(999, petData(tutorId));
    strict_1.default.equal(atualizado, false);
});
(0, node_test_1.default)('deve excluir pet existente', () => {
    const tutorId = createTutor();
    const petId = createPet(tutorId);
    strict_1.default.equal(service.excluirPet(petId), true);
    strict_1.default.equal(service.buscarPet(petId), null);
});
(0, node_test_1.default)('não deve excluir pet inexistente', () => {
    strict_1.default.equal(service.excluirPet(999), false);
});
(0, node_test_1.default)('não deve excluir tutor que possui pets', () => {
    const tutorId = createTutor();
    createPet(tutorId);
    strict_1.default.throws(() => service.excluirTutor(tutorId), /Não é possível excluir um tutor que possui pets cadastrados/);
});
(0, node_test_1.default)('deve rejeitar identificadores inválidos', () => {
    strict_1.default.throws(() => service.buscarPet(0), /Identificador inválido/);
    strict_1.default.throws(() => service.buscarTutor(-1), /Identificador inválido/);
});
