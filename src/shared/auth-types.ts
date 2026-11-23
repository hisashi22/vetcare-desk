import { UserRole } from './types';

export interface AuthenticatedUser {
  id: number;
  nome: string;
  email: string;
  role: UserRole;
}

export type Permission =
  | 'MANAGE_USERS'
  | 'MANAGE_SUPPLIERS'
  | 'MANAGE_STOCK'
  | 'MANAGE_FINANCES'
  | 'MANAGE_CLINICAL'
  | 'DELETE_CRITICAL';
