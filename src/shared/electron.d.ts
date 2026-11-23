import type {
  AuthenticatedUser,
  Permission
} from './auth-types';

import type { UserRole } from './types';

import type {
  VacinaPendente,
  ResultadoNotificacoes
} from './notification-types';

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

interface VetCareAPI {
  auth: {
    login(data: LoginData): Promise<AuthenticatedUser>;
    logout(): Promise<boolean>;
    getCurrentUser(): Promise<AuthenticatedUser | null>;
    hasPermission(permission: Permission): Promise<boolean>;
    createUser(data: RegisterUserData): Promise<AuthenticatedUser>;
    registerInitialAdmin(data: RegisterAdminData): Promise<AuthenticatedUser>;
  };

  notificacoes: {
    buscarVacinasPendentes(): Promise<VacinaPendente[]>;
    enviarNotificacoes(): Promise<ResultadoNotificacoes>;
  };
}

declare global {
  interface Window {
    vetcare: VetCareAPI;
  }
}

export {};