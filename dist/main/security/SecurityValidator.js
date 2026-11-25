"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityValidator = void 0;
class SecurityValidator {
    // Valida formato de e-mail
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            throw new Error('E-mail inválido.');
        }
    }
    // Valida CPF e seus dígitos verificadores
    static validateCPF(cpf) {
        const digits = cpf.replace(/\D/g, '');
        if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) {
            throw new Error('CPF inválido.');
        }
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += Number(digits[i]) * (10 - i);
        }
        let remainder = (sum * 10) % 11;
        if (remainder === 10)
            remainder = 0;
        if (remainder !== Number(digits[9])) {
            throw new Error('CPF inválido.');
        }
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += Number(digits[i]) * (11 - i);
        }
        remainder = (sum * 10) % 11;
        if (remainder === 10)
            remainder = 0;
        if (remainder !== Number(digits[10])) {
            throw new Error('CPF inválido.');
        }
    }
    // Valida CEP brasileiro
    static validateCEP(cep) {
        const digits = cep.replace(/\D/g, '');
        if (!/^\d{8}$/.test(digits)) {
            throw new Error('CEP inválido.');
        }
    }
    // Verifica campos obrigatórios
    static validateRequired(value, fieldName) {
        if (value === null ||
            value === undefined ||
            (typeof value === 'string' && value.trim() === '')) {
            throw new Error(`O campo ${fieldName} é obrigatório.`);
        }
    }
    // Valida tamanho mínimo da senha
    static validatePassword(password) {
        if (password.length < 8) {
            throw new Error('A senha deve possuir pelo menos 8 caracteres.');
        }
    }
    // Valida valores numéricos
    static validateNumber(value, fieldName, min) {
        if (!Number.isFinite(value)) {
            throw new Error(`${fieldName} deve ser um número válido.`);
        }
        if (min !== undefined && value < min) {
            throw new Error(`${fieldName} deve ser maior ou igual a ${min}.`);
        }
    }
    // Valida valores que precisam ser números inteiros
    static validateInteger(value, fieldName, min) {
        if (!Number.isInteger(value)) {
            throw new Error(`${fieldName} deve ser um número inteiro.`);
        }
        if (min !== undefined && value < min) {
            throw new Error(`${fieldName} deve ser maior ou igual a ${min}.`);
        }
    }
}
exports.SecurityValidator = SecurityValidator;
