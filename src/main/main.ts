import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';

import { DatabaseConnection } from './database/DatabaseConnection';
import { AuthService } from './security/AuthService';
import { IpcController } from './ipc/IpcController';

let mainWindow: BrowserWindow | null = null;
let ipcController: IpcController | null = null;

async function createWindow(): Promise<void> {
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

  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const currentUrl = mainWindow?.webContents.getURL();

    if (navigationUrl !== currentUrl) {
      event.preventDefault();
    }
  });

  await mainWindow.loadFile(
    path.join(__dirname, '../../src/renderer/index.html')
  );

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    await DatabaseConnection.getInstance().initialize();

    const authService = new AuthService();

    ipcController = new IpcController(
      authService,
      () => mainWindow,
      ipcMain
    );
    ipcController.registerHandlers();
    await createWindow();

    app.on('activate', async () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        await createWindow();
      }
    });
  } catch (error) {
    console.error('Erro ao inicializar o VetCare:', error);
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