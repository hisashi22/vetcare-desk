import { contextBridge, ipcRenderer } from 'electron';

import type {
  AuthenticatedUser,
  Permission
} from '../shared/auth-types';

import type { UserRole } from '../shared/types';

import type {
  VacinaPendente,
  ResultadoNotificacoes
} from '../shared/notification-types';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterUserData {
  nome: string;
  email: string;
  password: string;
  role: UserRole;
}

interface RegisterAdminData {
  nome: string;
  email: string;
  password: string;
}

const vetcareAPI = {
  auth: {
    login: (data: LoginData): Promise<AuthenticatedUser> =>
      ipcRenderer.invoke('auth:login', data),

    logout: (): Promise<boolean> =>
      ipcRenderer.invoke('auth:logout'),

    getCurrentUser: (): Promise<AuthenticatedUser | null> =>
      ipcRenderer.invoke('auth:get-current-user'),

    hasPermission: (permission: Permission): Promise<boolean> =>
      ipcRenderer.invoke('auth:has-permission', permission),

    createUser: (data: RegisterUserData): Promise<AuthenticatedUser> =>
      ipcRenderer.invoke('auth:create-user', data),

    registerInitialAdmin: (
      data: RegisterAdminData
    ): Promise<AuthenticatedUser> =>
      ipcRenderer.invoke('auth:register-initial-admin', data)
  },

  notificacoes: {
    buscarVacinasPendentes: (): Promise<VacinaPendente[]> =>
      ipcRenderer.invoke('notificacoes:buscar-vacinas-pendentes'),

    enviarNotificacoes: (): Promise<ResultadoNotificacoes> =>
      ipcRenderer.invoke('notificacoes:enviar')
  }
};

contextBridge.exposeInMainWorld('vetcare', vetcareAPI);