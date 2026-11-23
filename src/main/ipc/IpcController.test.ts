import test from 'node:test';
import assert from 'node:assert/strict';

import { IpcController } from './IpcController';
import type { AuthService } from '../security/AuthService';
import type {
  IpcMain,
  IpcMainInvokeEvent,
  BrowserWindow
} from 'electron';

type Handler = (
  event: unknown,
  ...args: unknown[]
) => unknown;

function createTestEnvironment() {
  const handlers = new Map<string, Handler>();

  const fakeIpcMain = {
    handle(channel: string, listener: Handler) {
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
    getCurrentUser: () => null,
    hasPermission: () => true,
    createUser: async () => null,
    registerInitialAdmin: async () => null
  } as unknown as AuthService;

  const controller = new IpcController(
    authService,
    () => mainWindow,
    fakeIpcMain
  );

  controller.registerHandlers();

  return {
    controller,
    handlers,
    event
  };
}

test('deve registrar os seis canais IPC', () => {
  const { handlers } = createTestEnvironment();

  assert.equal(handlers.size, 6);
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

test('deve remover os seis canais IPC', () => {
  const { controller, handlers } = createTestEnvironment();

  assert.equal(handlers.size, 6);

  controller.removeHandlers();

  assert.equal(handlers.size, 0);
});
