import { SecurityValidator } from '../security/SecurityValidator';

import { AuthService, Permission } from '../security/AuthService';
import { UserRole } from '../../shared/types';
import type {
  IpcMain,
  IpcMainInvokeEvent,
  BrowserWindow
} from 'electron';


export class IpcController {
  private readonly authService: AuthService;
  private readonly getMainWindow: () => BrowserWindow | null;
  private registered = false;
  private readonly ipcMain: IpcMain;

  constructor(
    authService: AuthService,
    getMainWindow: () => BrowserWindow | null,
    ipcMain: IpcMain
  ) {
    this.authService = authService;
    this.getMainWindow = getMainWindow;
    this.ipcMain = ipcMain;
  }

  private validateSender(event: IpcMainInvokeEvent): void {
    const mainWindow = this.getMainWindow();

    if (
      !mainWindow ||
      mainWindow.isDestroyed() ||
      event.sender !== mainWindow.webContents ||
      event.senderFrame !== mainWindow.webContents.mainFrame
    ) {
      throw new Error('Origem da chamada IPC não autorizada.');
    }
  }

  private validateLoginData(data: unknown): void {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Dados de login inválidos.');
  }

  const payload = data as Record<string, unknown>;

  if (
    typeof payload.email !== 'string' ||
    typeof payload.password !== 'string'
  ) {
    throw new Error('Dados de login inválidos.');
  }

  SecurityValidator.validateEmail(payload.email);
  SecurityValidator.validateRequired(payload.password, 'Senha');
}

private validateRegisterData(data: unknown): void {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Dados de cadastro inválidos.');
  }

  const payload = data as Record<string, unknown>;

  if (
    typeof payload.nome !== 'string' ||
    typeof payload.email !== 'string' ||
    typeof payload.password !== 'string'
  ) {
    throw new Error('Dados de cadastro inválidos.');
  }

  SecurityValidator.validateRequired(payload.nome, 'Nome');
  SecurityValidator.validateEmail(payload.email);
  SecurityValidator.validatePassword(payload.password);
}

  /**
   * Registra os canais de comunicação IPC.
   */
  public registerHandlers(): void {
    if (this.registered) {
      throw new Error('Os canais IPC já foram registrados.');
    }

      this.ipcMain.handle(
        'auth:register-initial-admin',
        (event: IpcMainInvokeEvent, data: unknown) => {
          this.validateSender(event);
          this.validateRegisterData(data);

          const payload = data as {
            nome: string;
            email: string;
            password: string;
          };

          return this.authService.registerInitialAdmin(
            payload.nome,
            payload.email,
            payload.password
          );
        }
      );

    this.ipcMain.handle(
      'auth:login',
      (event: IpcMainInvokeEvent, data: unknown) => {
        this.validateSender(event);
        this.validateLoginData(data);

        const payload = data as {
          email: string;
          password: string;
        };

        return this.authService.login(
          payload.email,
          payload.password
        );
      }
    );

    this.ipcMain.handle('auth:logout', (event: IpcMainInvokeEvent) => {
      this.validateSender(event);

      this.authService.logout();
      return true;
    });

    this.ipcMain.handle(
      'auth:get-current-user',
      (event: IpcMainInvokeEvent) => {
        this.validateSender(event);

        return this.authService.getCurrentUser();
      }
    );

    this.ipcMain.handle(
    'auth:has-permission',
    (event: IpcMainInvokeEvent, permission: unknown) => {
      this.validateSender(event);

      const validPermissions: Permission[] = [
        'MANAGE_USERS',
        'MANAGE_SUPPLIERS',
        'MANAGE_STOCK',
        'MANAGE_FINANCES',
        'MANAGE_CLINICAL',
        'DELETE_CRITICAL'
      ];

      if (
        typeof permission !== 'string' ||
        !validPermissions.includes(permission as Permission)
      ) {
        throw new Error('Permissão inválida.');
      }

      return this.authService.hasPermission(permission as Permission);
    }
  );

    this.ipcMain.handle(
      'auth:create-user',
      (event: IpcMainInvokeEvent, data: unknown) => {
        this.validateSender(event);
        this.validateRegisterData(data);

        if (!data || typeof data !== 'object' || Array.isArray(data)) {
          throw new Error('Dados de cadastro inválidos.');
        }

        const payload = data as {
          nome: string;
          email: string;
          password: string;
          role: unknown;
        };

        if (
          payload.role !== 'ADMIN' &&
          payload.role !== 'VETERINARIO'
        ) {
          throw new Error('Perfil de usuário inválido.');
        }

        return this.authService.createUser(
          payload.nome,
          payload.email,
          payload.password,
          payload.role
        );
      }
    );

    this.registered = true;
  }

  /**
   * Remove os canais registrados.
   */
  public removeHandlers(): void {
    const channels = [
      'auth:register-initial-admin',
      'auth:login',
      'auth:logout',
      'auth:get-current-user',
      'auth:has-permission',
      'auth:create-user'
    ];

    for (const channel of channels) {
      this.ipcMain.removeHandler(channel);
    }

    this.registered = false;
  }
}
