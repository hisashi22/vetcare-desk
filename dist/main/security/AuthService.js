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
exports.AuthService = void 0;
const crypto = __importStar(require("crypto"));
const DatabaseConnection_1 = require("../database/DatabaseConnection");
const SecurityValidator_1 = require("./SecurityValidator");
class AuthService {
    database;
    currentUser = null;
    permissions = {
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
    constructor(database = DatabaseConnection_1.DatabaseConnection.getInstance()) {
        this.database = database;
    }
    /**
     * Gera o hash seguro da senha.
     */
    hashPassword(password, salt) {
        return crypto
            .scryptSync(password, Buffer.from(salt, 'hex'), 64)
            .toString('hex');
    }
    /**
     * Compara a senha informada com o hash armazenado.
     */
    verifyPassword(password, salt, storedHash) {
        const calculatedHash = Buffer.from(this.hashPassword(password, salt), 'hex');
        const originalHash = Buffer.from(storedHash, 'hex');
        if (calculatedHash.length !== originalHash.length ||
            originalHash.length !== 64) {
            return false;
        }
        return crypto.timingSafeEqual(calculatedHash, originalHash);
    }
    /**
     * Cria o primeiro administrador.
     * Só funciona quando ainda não existem usuários.
     */
    registerInitialAdmin(nome, email, password) {
        const users = this.database.query('SELECT COUNT(*) AS total FROM usuarios');
        if (users[0].total !== 0) {
            throw new Error('O administrador inicial já foi criado.');
        }
        const admin = this.createAccount(nome, email, password, 'ADMIN');
        this.currentUser = { ...admin };
        return { ...this.currentUser };
    }
    /**
     * Cadastra novos usuários.
     * Somente administradores podem executar esta operação.
     */
    createUser(nome, email, password, role) {
        if (!this.hasPermission('MANAGE_USERS')) {
            throw new Error('Acesso negado. Apenas ADMIN pode cadastrar usuários.');
        }
        return this.createAccount(nome, email, password, role);
    }
    /**
     * Centraliza a criação de contas.
     */
    createAccount(nome, email, password, role) {
        SecurityValidator_1.SecurityValidator.validateRequired(nome, 'Nome');
        SecurityValidator_1.SecurityValidator.validateEmail(email);
        SecurityValidator_1.SecurityValidator.validatePassword(password);
        if (!['ADMIN', 'VETERINARIO'].includes(role)) {
            throw new Error('Perfil de usuário inválido.');
        }
        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = this.database.query('SELECT id FROM usuarios WHERE email = ?', [normalizedEmail]);
        if (existingUser.length > 0) {
            throw new Error('Este e-mail já está cadastrado.');
        }
        const salt = crypto.randomBytes(16).toString('hex');
        const passwordHash = this.hashPassword(password, salt);
        this.database.execute(`INSERT INTO usuarios
        (nome, email, senha_hash, senha_salt, perfil)
       VALUES (?, ?, ?, ?, ?)`, [
            nome.trim(),
            normalizedEmail,
            passwordHash,
            salt,
            role
        ]);
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
    login(email, password) {
        SecurityValidator_1.SecurityValidator.validateEmail(email);
        SecurityValidator_1.SecurityValidator.validateRequired(password, 'Senha');
        const normalizedEmail = email.trim().toLowerCase();
        const users = this.database.query(`SELECT id, nome, email, senha_hash, senha_salt, perfil
       FROM usuarios
       WHERE email = ?`, [normalizedEmail]);
        if (users.length === 0) {
            throw new Error('E-mail ou senha incorretos.');
        }
        const user = users[0];
        if (!this.verifyPassword(password, user.senha_salt, user.senha_hash)) {
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
    logout() {
        this.currentUser = null;
    }
    /**
     * Retorna o usuário autenticado.
     */
    getCurrentUser() {
        return this.currentUser
            ? { ...this.currentUser }
            : null;
    }
    /**
     * Verifica se o usuário possui determinada permissão.
     */
    hasPermission(permission) {
        if (!this.currentUser) {
            return false;
        }
        return this.permissions[this.currentUser.role]
            .includes(permission);
    }
}
exports.AuthService = AuthService;
