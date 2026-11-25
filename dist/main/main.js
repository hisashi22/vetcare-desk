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
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const electron_1 = require("electron");
const path = __importStar(require("path"));
const DatabaseConnection_1 = require("./database/DatabaseConnection");
const AuthService_1 = require("./security/AuthService");
const IpcController_1 = require("./ipc/IpcController");
let mainWindow = null;
let ipcController = null;
async function createWindow() {
    console.log('[INIT] Criando BrowserWindow...');
    mainWindow = new electron_1.BrowserWindow({
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
    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
        console.error('[RENDERER] Falha ao carregar:', {
            errorCode,
            errorDescription,
            validatedURL
        });
    });
    mainWindow.webContents.on('render-process-gone', (_event, details) => {
        console.error('[RENDERER] Processo encerrado:', details);
    });
    mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
        console.log('[RENDERER] Console:', {
            level,
            message,
            line,
            sourceId
        });
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
    console.log('[INIT] Carregando index.html...');
    await mainWindow.loadFile(path.join(__dirname, '../../src/renderer/index.html'));
    console.log('[INIT] index.html carregado com sucesso');
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
electron_1.app.whenReady().then(async () => {
    console.log('[INIT] Electron pronto');
    try {
        console.log('[INIT] Inicializando banco de dados...');
        await DatabaseConnection_1.DatabaseConnection.getInstance().initialize();
        console.log('[INIT] Banco de dados inicializado');
        console.log('[INIT] Criando AuthService...');
        const authService = new AuthService_1.AuthService();
        console.log('[INIT] Criando IpcController...');
        ipcController = new IpcController_1.IpcController(authService, () => mainWindow, electron_1.ipcMain);
        console.log('[INIT] Registrando handlers IPC...');
        ipcController.registerHandlers();
        console.log('[INIT] Handlers IPC registrados');
        console.log('[INIT] Criando janela...');
        await createWindow();
        console.log('[INIT] Inicialização concluída');
        electron_1.app.on('activate', async () => {
            if (electron_1.BrowserWindow.getAllWindows().length === 0) {
                await createWindow();
            }
        });
    }
    catch (error) {
        console.error('[INIT] Erro ao inicializar o VetCare:', error);
        electron_1.app.quit();
    }
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('will-quit', () => {
    ipcController?.removeHandlers();
});
