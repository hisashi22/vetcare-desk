"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const IpcController_1 = require("./IpcController");
const EXPECTED_CHANNELS = [
    'auth:register-initial-admin',
    'auth:login',
    'auth:logout',
    'auth:get-current-user',
    'auth:has-permission',
    'auth:create-user',
    'clinical:list-tutors',
    'clinical:get-tutor',
    'clinical:get-tutor-by-cpf',
    'clinical:create-tutor',
    'clinical:update-tutor',
    'clinical:delete-tutor',
    'clinical:buscar-cep',
    'clinical:list-pets',
    'clinical:get-pet',
    'clinical:list-pets-by-tutor',
    'clinical:create-pet',
    'clinical:update-pet',
    'clinical:delete-pet',
    'clinical:list-produtos',
    'clinical:list-veterinarios',
    'clinical:get-veterinario',
    'clinical:create-veterinario',
    'clinical:update-veterinario',
    'clinical:delete-veterinario',
    'clinical:list-consultas',
    'clinical:get-consulta',
    'clinical:list-prontuario-pet',
    'clinical:create-consulta',
    'clinical:update-consulta',
    'clinical:delete-consulta',
    'clinical:list-prescricoes-by-consulta',
    'clinical:create-prescricao',
    'clinical:delete-prescricao',
    'clinical:buscar-bula',
    'clinical:salvar-bula-produto',
    'notificacoes:buscar-vacinas-pendentes',
    'notificacoes:enviar'
];
function createTestEnvironment(autenticado = true, permissaoClinica = true) {
    const handlers = new Map();
    const fakeIpcMain = {
        handle(channel, listener) {
            if (handlers.has(channel)) {
                throw new Error(`Canal duplicado: ${channel}`);
            }
            handlers.set(channel, listener);
        },
        removeHandler(channel) {
            handlers.delete(channel);
        }
    };
    const mainFrame = {};
    const webContents = { mainFrame };
    const mainWindow = {
        webContents,
        isDestroyed: () => false
    };
    const event = {
        sender: webContents,
        senderFrame: mainFrame
    };
    const authService = {
        login: async () => null,
        logout: () => undefined,
        getCurrentUser: () => autenticado
            ? {
                id: 1,
                nome: 'Administrador',
                email: 'admin@email.com',
                role: 'ADMIN'
            }
            : null,
        hasPermission: (permission) => permission === 'MANAGE_CLINICAL'
            ? permissaoClinica
            : true,
        createUser: async () => null,
        registerInitialAdmin: async () => null
    };
    const clinicaService = {
        listarTutores: () => [],
        buscarTutor: () => null,
        buscarTutorPorCpf: () => null,
        cadastrarTutor: () => null,
        atualizarTutor: () => null,
        excluirTutor: () => true,
        listarPets: () => [],
        buscarPet: () => null,
        listarPetsDoTutor: () => [],
        cadastrarPet: () => null,
        atualizarPet: () => null,
        excluirPet: () => true
    };
    const notificacaoVacinaService = {
        buscarVacinasPendentes: () => [],
        enviarNotificacoes: async () => ({
            total: 0,
            enviados: 0,
            falhas: 0,
            ignorados: 0
        })
    };
    const cepService = {
        buscarEnderecoPorCep: async () => ({
            cep: '01001-000',
            logradouro: 'Praça da Sé',
            bairro: 'Sé',
            cidade: 'São Paulo',
            uf: 'SP'
        })
    };
    const controller = new IpcController_1.IpcController(authService, () => mainWindow, fakeIpcMain, clinicaService, notificacaoVacinaService, cepService);
    controller.registerHandlers();
    return {
        controller,
        handlers,
        event
    };
}
(0, node_test_1.default)('deve registrar os vinte e um canais IPC', () => {
    const { handlers } = createTestEnvironment();
    strict_1.default.equal(handlers.size, EXPECTED_CHANNELS.length);
    for (const channel of EXPECTED_CHANNELS) {
        strict_1.default.equal(handlers.has(channel), true, `O canal ${channel} deveria estar registrado.`);
    }
});
(0, node_test_1.default)('deve rejeitar chamadas de origem não autorizada', () => {
    const { handlers, event } = createTestEnvironment();
    const unauthorizedEvent = {
        ...event,
        sender: {}
    };
    strict_1.default.throws(() => handlers.get('auth:logout')(unauthorizedEvent), /Origem da chamada IPC não autorizada/);
});
(0, node_test_1.default)('deve rejeitar dados de login inválidos', () => {
    const { handlers, event } = createTestEnvironment();
    strict_1.default.throws(() => handlers.get('auth:login')(event, { email: 123, password: '12345678' }), /Dados de login inválidos/);
});
(0, node_test_1.default)('deve rejeitar permissões inválidas', () => {
    const { handlers, event } = createTestEnvironment();
    strict_1.default.throws(() => handlers.get('auth:has-permission')(event, 'PERMISSAO_INEXISTENTE'), /Permissão inválida/);
});
(0, node_test_1.default)('deve rejeitar perfil de usuário inválido', () => {
    const { handlers, event } = createTestEnvironment();
    strict_1.default.throws(() => handlers.get('auth:create-user')(event, {
        nome: 'Usuário Teste',
        email: 'teste@email.com',
        password: 'SenhaForte123!',
        role: 'GERENTE'
    }), /Perfil de usuário inválido/);
});
(0, node_test_1.default)('deve impedir registro duplicado dos canais', () => {
    const { controller } = createTestEnvironment();
    strict_1.default.throws(() => controller.registerHandlers(), /Os canais IPC já foram registrados/);
});
(0, node_test_1.default)('deve remover os vinte e um canais IPC', () => {
    const { controller, handlers } = createTestEnvironment();
    strict_1.default.equal(handlers.size, EXPECTED_CHANNELS.length);
    controller.removeHandlers();
    strict_1.default.equal(handlers.size, 0);
});
(0, node_test_1.default)('deve permitir buscar vacinas para usuário autorizado', () => {
    const { handlers, event } = createTestEnvironment();
    const resultado = handlers.get('notificacoes:buscar-vacinas-pendentes')(event);
    strict_1.default.deepEqual(resultado, []);
});
(0, node_test_1.default)('deve bloquear notificações sem usuário autenticado', async () => {
    const { handlers, event } = createTestEnvironment(false);
    await strict_1.default.rejects(async () => await handlers.get('notificacoes:enviar')(event), /Acesso não autorizado/);
});
(0, node_test_1.default)('deve bloquear notificações sem permissão clínica', () => {
    const { handlers, event } = createTestEnvironment(true, false);
    strict_1.default.throws(() => handlers.get('notificacoes:buscar-vacinas-pendentes')(event), /Acesso não autorizado/);
});
