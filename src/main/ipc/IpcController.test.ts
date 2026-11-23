import test from 'node:test';
import assert from 'node:assert/strict';

import { IpcController } from './IpcController';
import type { AuthService } from '../security/AuthService';
import type { ClinicaService } from '../services/ClinicaService';

import type {
  IpcMain,
  IpcMainInvokeEvent,
  BrowserWindow
} from 'electron';

type Handler = (
  event: unknown,
  ...args: unknown[]
) => unknown;

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

  'notificacoes:buscar-vacinas-pendentes',
  'notificacoes:enviar'
];

function createTestEnvironment(
  autenticado = true,
  permissaoClinica = true
) {
  const handlers = new Map<string, Handler>();

  const fakeIpcMain = {
    handle(channel: string, listener: Handler) {
      if (handlers.has(channel)) {
        throw new Error(`Canal duplicado: ${channel}`);
      }

      handlers.set(channel, listener);
    },

    removeHandler(channel: string) {
      handlers.delete(channel);
    }
  } as unknown as IpcMain;

  const mainFrame = {};
  const webContents = { mainFrame };

  const mainWindow = {
    webContents,
    isDestroyed: () => false
  } as unknown as BrowserWindow;

  const event = {
    sender: webContents,
    senderFrame: mainFrame
  } as unknown as IpcMainInvokeEvent;

  const authService = {
    login: async () => null,
    logout: () => undefined,

    getCurrentUser: () =>
      autenticado
        ? {
            id: 1,
            nome: 'Administrador',
            email: 'admin@email.com',
            role: 'ADMIN'
          }
        : null,

    hasPermission: (permission: string) =>
      permission === 'MANAGE_CLINICAL'
        ? permissaoClinica
        : true,

    createUser: async () => null,
    registerInitialAdmin: async () => null
  } as unknown as AuthService;

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
  } as unknown as ClinicaService;

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

  const controller = new IpcController(
    authService,
    () => mainWindow,
    fakeIpcMain,
    clinicaService,
    notificacaoVacinaService as never,
    cepService as never
  );

  controller.registerHandlers();

  return {
    controller,
    handlers,
    event
  };
}

test('deve registrar os vinte e um canais IPC', () => {
  const { handlers } = createTestEnvironment();

  assert.equal(handlers.size, EXPECTED_CHANNELS.length);

  for (const channel of EXPECTED_CHANNELS) {
    assert.equal(
      handlers.has(channel),
      true,
      `O canal ${channel} deveria estar registrado.`
    );
  }
});

test('deve rejeitar chamadas de origem não autorizada', () => {
  const { handlers, event } = createTestEnvironment();

  const unauthorizedEvent = {
    ...event,
    sender: {}
  };

  assert.throws(
    () => handlers.get('auth:logout')!(
      unauthorizedEvent
    ),
    /Origem da chamada IPC não autorizada/
  );
});

test('deve rejeitar dados de login inválidos', () => {
  const { handlers, event } = createTestEnvironment();

  assert.throws(
    () => handlers.get('auth:login')!(
      event,
      { email: 123, password: '12345678' }
    ),
    /Dados de login inválidos/
  );
});

test('deve rejeitar permissões inválidas', () => {
  const { handlers, event } = createTestEnvironment();

  assert.throws(
    () => handlers.get('auth:has-permission')!(
      event,
      'PERMISSAO_INEXISTENTE'
    ),
    /Permissão inválida/
  );
});

test('deve rejeitar perfil de usuário inválido', () => {
  const { handlers, event } = createTestEnvironment();

  assert.throws(
    () => handlers.get('auth:create-user')!(
      event,
      {
        nome: 'Usuário Teste',
        email: 'teste@email.com',
        password: 'SenhaForte123!',
        role: 'GERENTE'
      }
    ),
    /Perfil de usuário inválido/
  );
});

test('deve impedir registro duplicado dos canais', () => {
  const { controller } = createTestEnvironment();

  assert.throws(
    () => controller.registerHandlers(),
    /Os canais IPC já foram registrados/
  );
});

test('deve remover os vinte e um canais IPC', () => {
  const { controller, handlers } = createTestEnvironment();

  assert.equal(handlers.size, EXPECTED_CHANNELS.length);

  controller.removeHandlers();

  assert.equal(handlers.size, 0);
});

test('deve permitir buscar vacinas para usuário autorizado', () => {
  const { handlers, event } = createTestEnvironment();

  const resultado = handlers.get(
    'notificacoes:buscar-vacinas-pendentes'
  )!(event);

  assert.deepEqual(resultado, []);
});

test('deve bloquear notificações sem usuário autenticado', async () => {
  const { handlers, event } = createTestEnvironment(false);

  await assert.rejects(
    async () =>
      await handlers.get('notificacoes:enviar')!(event),
    /Acesso não autorizado/
  );
});

test('deve bloquear notificações sem permissão clínica', () => {
  const { handlers, event } = createTestEnvironment(
    true,
    false
  );

  assert.throws(
    () =>
      handlers.get(
        'notificacoes:buscar-vacinas-pendentes'
      )!(event),
    /Acesso não autorizado/
  );
});