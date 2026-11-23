
import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';

import { DatabaseConnection } from './database/DatabaseConnection';
import { AuthService } from './security/AuthService';
import { IpcController } from './ipc/IpcController';

let mainWindow: BrowserWindow | null = null;
let ipcController: IpcController | null = null;

async function createWindow(): Promise<void> {
  console.log('[INIT] Criando BrowserWindow...');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.webContents.on(
    'did-fail-load',
    (_event, errorCode, errorDescription, validatedURL) => {
      console.error('[RENDERER] Falha ao carregar:', {
        errorCode,
        errorDescription,
        validatedURL
      });
    }
  );

  mainWindow.webContents.on(
    'render-process-gone',
    (_event, details) => {
      console.error('[RENDERER] Processo encerrado:', details);
    }
  );

  mainWindow.webContents.on(
    'console-message',
    (_event, level, message, line, sourceId) => {
      console.log('[RENDERER] Console:', {
        level,
        message,
        line,
        sourceId
      });
    }
  );

  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const currentUrl = mainWindow?.webContents.getURL();

    if (navigationUrl !== currentUrl) {
      event.preventDefault();
    }
  });

  console.log('[INIT] Carregando index.html...');

  await mainWindow.loadFile(
    path.join(__dirname, '../../src/renderer/index.html')
  );

  console.log('[INIT] index.html carregado com sucesso');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  console.log('[INIT] Electron pronto');

  try {
    console.log('[INIT] Inicializando banco de dados...');
    await DatabaseConnection.getInstance().initialize();
    console.log('[INIT] Banco de dados inicializado');

    console.log('[INIT] Criando AuthService...');
    const authService = new AuthService();

    console.log('[INIT] Criando IpcController...');
    ipcController = new IpcController(
      authService,
      () => mainWindow,
      ipcMain
    );

    console.log('[INIT] Registrando handlers IPC...');
    ipcController.registerHandlers();
    console.log('[INIT] Handlers IPC registrados');

    console.log('[INIT] Criando janela...');
    await createWindow();

    console.log('[INIT] Inicialização concluída');

    app.on('activate', async () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        await createWindow();
      }
    });
  } catch (error) {
    console.error('[INIT] Erro ao inicializar o VetCare:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  ipcController?.removeHandlers();
});
