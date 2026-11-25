"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const SecurityValidator_1 = require("./SecurityValidator");
(0, node_test_1.default)('deve aceitar e-mail válido', () => {
    strict_1.default.doesNotThrow(() => SecurityValidator_1.SecurityValidator.validateEmail('teste@email.com'));
});
(0, node_test_1.default)('deve rejeitar e-mail inválido', () => {
    strict_1.default.throws(() => SecurityValidator_1.SecurityValidator.validateEmail('email-invalido'));
});
(0, node_test_1.default)('deve aceitar CPF válido', () => {
    strict_1.default.doesNotThrow(() => SecurityValidator_1.SecurityValidator.validateCPF('529.982.247-25'));
});
(0, node_test_1.default)('deve rejeitar CPF inválido', () => {
    strict_1.default.throws(() => SecurityValidator_1.SecurityValidator.validateCPF('111.111.111-11'));
});
(0, node_test_1.default)('deve aceitar CEP válido', () => {
    strict_1.default.doesNotThrow(() => SecurityValidator_1.SecurityValidator.validateCEP('13000-000'));
});
(0, node_test_1.default)('deve rejeitar CEP inválido', () => {
    strict_1.default.throws(() => SecurityValidator_1.SecurityValidator.validateCEP('123'));
});
(0, node_test_1.default)('deve rejeitar campo obrigatório vazio', () => {
    strict_1.default.throws(() => SecurityValidator_1.SecurityValidator.validateRequired('', 'Nome'));
});
(0, node_test_1.default)('deve aceitar campo obrigatório preenchido', () => {
    strict_1.default.doesNotThrow(() => SecurityValidator_1.SecurityValidator.validateRequired('Hisashi', 'Nome'));
});
(0, node_test_1.default)('deve aceitar senha com 8 caracteres', () => {
    strict_1.default.doesNotThrow(() => SecurityValidator_1.SecurityValidator.validatePassword('12345678'));
});
(0, node_test_1.default)('deve rejeitar senha com menos de 8 caracteres', () => {
    strict_1.default.throws(() => SecurityValidator_1.SecurityValidator.validatePassword('1234567'));
});
(0, node_test_1.default)('deve aceitar número válido', () => {
    strict_1.default.doesNotThrow(() => SecurityValidator_1.SecurityValidator.validateNumber(10, 'Preço', 0));
});
(0, node_test_1.default)('deve rejeitar número abaixo do mínimo', () => {
    strict_1.default.throws(() => SecurityValidator_1.SecurityValidator.validateNumber(-1, 'Preço', 0));
});
(0, node_test_1.default)('deve aceitar número inteiro', () => {
    strict_1.default.doesNotThrow(() => SecurityValidator_1.SecurityValidator.validateInteger(10, 'Quantidade', 0));
});
(0, node_test_1.default)('deve rejeitar número decimal como inteiro', () => {
    strict_1.default.throws(() => SecurityValidator_1.SecurityValidator.validateInteger(2.5, 'Quantidade', 0));
});
