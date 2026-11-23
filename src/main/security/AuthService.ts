
import * as crypto from 'crypto';
import { DatabaseConnection } from '../database/DatabaseConnection';
import { SecurityValidator } from './SecurityValidator';
import { UserRole } from '../../shared/types';

interface UserRow {
  id: number;
  nome: string;
  email: string;
  senha_hash: string;
  senha_salt: string;
  perfil: UserRole;
}

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


  interface AuthDatabase {
  query<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
  ): T[];

  execute(sql: string, params?: unknown[]): void;

  getLastInsertId(): number;
}

export class AuthService {
  private readonly database: AuthDatabase;
  private currentUser: AuthenticatedUser | null = null;

  private readonly permissions: Record<UserRole, Permission[]> = {
    ADMIN: [
      'MANAGE_USERS',
      'MANAGE_SUPPLIERS',
      'MANAGE_STOCK',
      'MANAGE_FINANCES',
      'MANAGE_CLINICAL',
      'DELETE_CRITICAL'
    ],
    VETERINARIO: [
      'MANAGE_CLINICAL'
    ]
  };

  constructor(database: AuthDatabase = DatabaseConnection.getInstance())
  {
    this.database = database;
  }

  /**
   * Gera o hash seguro da senha.
   */
  private hashPassword(password: string, salt: string): string {
    return crypto
      .scryptSync(password, Buffer.from(salt, 'hex'), 64)
      .toString('hex');
  }

  /**
   * Compara a senha informada com o hash armazenado.
   */
  private verifyPassword(
    password: string,
    salt: string,
    storedHash: string
  ): boolean {
    const calculatedHash = Buffer.from(
      this.hashPassword(password, salt),
      'hex'
    );

    const originalHash = Buffer.from(storedHash, 'hex');

    if (
      calculatedHash.length !== originalHash.length ||
      originalHash.length !== 64
    ) {
      return false;
    }

    return crypto.timingSafeEqual(
      calculatedHash,
      originalHash
    );
  }

  /**
   * Cria o primeiro administrador.
   * Só funciona quando ainda não existem usuários.
   */
  public registerInitialAdmin(
    nome: string,
    email: string,
    password: string
  ): AuthenticatedUser {
    const users = this.database.query<{ total: number }>(
      'SELECT COUNT(*) AS total FROM usuarios'
    );

    if (users[0].total !== 0) {
      throw new Error('O administrador inicial já foi criado.');
    }

    return this.createAccount(nome, email, password, 'ADMIN');
  }

  /**
   * Cadastra novos usuários.
   * Somente administradores podem executar esta operação.
   */
  public createUser(
    nome: string,
    email: string,
    password: string,
    role: UserRole
  ): AuthenticatedUser {
    if (!this.hasPermission('MANAGE_USERS')) {
      throw new Error('Acesso negado. Apenas ADMIN pode cadastrar usuários.');
    }

    return this.createAccount(nome, email, password, role);
  }

  /**
   * Centraliza a criação de contas.
   */
  private createAccount(
    nome: string,
    email: string,
    password: string,
    role: UserRole
  ): AuthenticatedUser {
    SecurityValidator.validateRequired(nome, 'Nome');
    SecurityValidator.validateEmail(email);
    SecurityValidator.validatePassword(password);

    if (!['ADMIN', 'VETERINARIO'].includes(role)) {
      throw new Error('Perfil de usuário inválido.');
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = this.database.query<UserRow>(
      'SELECT id FROM usuarios WHERE email = ?',
      [normalizedEmail]
    );

    if (existingUser.length > 0) {
      throw new Error('Este e-mail já está cadastrado.');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = this.hashPassword(password, salt);

    this.database.execute(
      `INSERT INTO usuarios
        (nome, email, senha_hash, senha_salt, perfil)
       VALUES (?, ?, ?, ?, ?)`,
      [
        nome.trim(),
        normalizedEmail,
        passwordHash,
        salt,
        role
      ]
    );

    const id = this.database.getLastInsertId();

    return {
      id,
      nome: nome.trim(),
      email: normalizedEmail,
      role
    };
  }

  /**
   * Realiza o login.
   */
  public login(
    email: string,
    password: string
  ): AuthenticatedUser {
    SecurityValidator.validateEmail(email);
    SecurityValidator.validateRequired(password, 'Senha');

    const normalizedEmail = email.trim().toLowerCase();

    const users = this.database.query<UserRow>(
      `SELECT id, nome, email, senha_hash, senha_salt, perfil
       FROM usuarios
       WHERE email = ?`,
      [normalizedEmail]
    );

    if (users.length === 0) {
      throw new Error('E-mail ou senha incorretos.');
    }

    const user = users[0];

    if (!this.verifyPassword(
      password,
      user.senha_salt,
      user.senha_hash
    )) {
      throw new Error('E-mail ou senha incorretos.');
    }

    this.currentUser = {
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.perfil
    };

    return { ...this.currentUser };
  }

  /**
   * Encerra a sessão atual.
   */
  public logout(): void {
    this.currentUser = null;
  }

  /**
   * Retorna o usuário autenticado.
   */
  public getCurrentUser(): AuthenticatedUser | null {
    return this.currentUser
      ? { ...this.currentUser }
      : null;
  }

  /**
   * Verifica se o usuário possui determinada permissão.
   */
  public hasPermission(permission: Permission): boolean {
    if (!this.currentUser) {
      return false;
    }

    return this.permissions[this.currentUser.role]
      .includes(permission);
  }
}
