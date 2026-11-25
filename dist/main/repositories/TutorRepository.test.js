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
const TutorRepository_1 = require("./TutorRepository");
let database;
let repository;
let tempDir;
let originalCwd;
function tutorData(overrides = {}) {
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
(0, node_test_1.before)(async () => {
    originalCwd = process.cwd();
    tempDir = (0, node_fs_1.mkdtempSync)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'vetcare-tutor-tests-'));
    process.chdir(tempDir);
    database = DatabaseConnection_1.DatabaseConnection.getInstance();
    await database.initialize();
    repository = new TutorRepository_1.TutorRepository();
});
(0, node_test_1.beforeEach)(() => {
    database.execute('DELETE FROM tutores');
});
(0, node_test_1.after)(() => {
    database.close();
    process.chdir(originalCwd);
    (0, node_fs_1.rmSync)(tempDir, { recursive: true, force: true });
});
(0, node_test_1.default)('deve cadastrar um tutor e retornar seu ID', () => {
    const id = repository.createTutor(tutorData());
    strict_1.default.equal(typeof id, 'number');
    strict_1.default.ok(id > 0);
});
(0, node_test_1.default)('deve buscar um tutor pelo ID', () => {
    const id = repository.createTutor(tutorData());
    const tutor = repository.findById(id);
    strict_1.default.ok(tutor);
    strict_1.default.equal(tutor.id, id);
    strict_1.default.equal(tutor.nome, 'Felipe Guidotti');
});
(0, node_test_1.default)('deve retornar null quando o ID não existir', () => {
    strict_1.default.equal(repository.findById(999), null);
});
(0, node_test_1.default)('deve buscar um tutor pelo CPF', () => {
    repository.createTutor(tutorData());
    const tutor = repository.findByCpf('12345678901');
    strict_1.default.ok(tutor);
    strict_1.default.equal(tutor.cpf, '12345678901');
});
(0, node_test_1.default)('deve retornar null quando o CPF não existir', () => {
    strict_1.default.equal(repository.findByCpf('00000000000'), null);
});
(0, node_test_1.default)('deve listar tutores em ordem alfabética', () => {
    repository.createTutor(tutorData({
        nome: 'Zeca'
    }));
    repository.createTutor(tutorData({
        nome: 'Ana',
        cpf: '98765432100'
    }));
    const tutores = repository.findAll();
    strict_1.default.deepEqual(tutores.map(tutor => tutor.nome), ['Ana', 'Zeca']);
});
(0, node_test_1.default)('deve atualizar os dados de um tutor', () => {
    const id = repository.createTutor(tutorData());
    const atualizado = repository.updateTutor(id, tutorData({ nome: 'Felipe Atualizado' }));
    strict_1.default.equal(atualizado, true);
    strict_1.default.equal(repository.findById(id)?.nome, 'Felipe Atualizado');
});
(0, node_test_1.default)('não deve atualizar um tutor inexistente', () => {
    const atualizado = repository.updateTutor(999, tutorData());
    strict_1.default.equal(atualizado, false);
});
(0, node_test_1.default)('deve excluir um tutor existente', () => {
    const id = repository.createTutor(tutorData());
    strict_1.default.equal(repository.deleteTutor(id), true);
    strict_1.default.equal(repository.findById(id), null);
});
(0, node_test_1.default)('não deve excluir um tutor inexistente', () => {
    strict_1.default.equal(repository.deleteTutor(999), false);
});
(0, node_test_1.default)('não deve cadastrar tutor com nome vazio', () => {
    strict_1.default.throws(() => repository.createTutor(tutorData({ nome: '   ' })), /Nome e CPF são obrigatórios/);
});
(0, node_test_1.default)('não deve cadastrar tutor com CPF vazio', () => {
    strict_1.default.throws(() => repository.createTutor(tutorData({ cpf: '   ' })), /Nome e CPF são obrigatórios/);
});
(0, node_test_1.default)('não deve permitir CPF duplicado', () => {
    repository.createTutor(tutorData());
    strict_1.default.throws(() => repository.createTutor(tutorData({
        nome: 'Outro Tutor'
    })), /UNIQUE constraint failed/);
});
