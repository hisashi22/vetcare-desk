
import test from 'node:test';
import assert from 'node:assert/strict';
import { SecurityValidator } from './SecurityValidator';

test('deve aceitar e-mail válido', () => {
  assert.doesNotThrow(() =>
    SecurityValidator.validateEmail('teste@email.com')
  );
});

test('deve rejeitar e-mail inválido', () => {
  assert.throws(() =>
    SecurityValidator.validateEmail('email-invalido')
  );
});

test('deve aceitar CPF válido', () => {
  assert.doesNotThrow(() =>
    SecurityValidator.validateCPF('529.982.247-25')
  );
});

test('deve rejeitar CPF inválido', () => {
  assert.throws(() =>
    SecurityValidator.validateCPF('111.111.111-11')
  );
});

test('deve aceitar CEP válido', () => {
  assert.doesNotThrow(() =>
    SecurityValidator.validateCEP('13000-000')
  );
});

test('deve rejeitar CEP inválido', () => {
  assert.throws(() =>
    SecurityValidator.validateCEP('123')
  );
});

test('deve rejeitar campo obrigatório vazio', () => {
  assert.throws(() =>
    SecurityValidator.validateRequired('', 'Nome')
  );
});

test('deve aceitar campo obrigatório preenchido', () => {
  assert.doesNotThrow(() =>
    SecurityValidator.validateRequired('Hisashi', 'Nome')
  );
});

test('deve aceitar senha com 8 caracteres', () => {
  assert.doesNotThrow(() =>
    SecurityValidator.validatePassword('12345678')
  );
});

test('deve rejeitar senha com menos de 8 caracteres', () => {
  assert.throws(() =>
    SecurityValidator.validatePassword('1234567')
  );
});

test('deve aceitar número válido', () => {
  assert.doesNotThrow(() =>
    SecurityValidator.validateNumber(10, 'Preço', 0)
  );
});

test('deve rejeitar número abaixo do mínimo', () => {
  assert.throws(() =>
    SecurityValidator.validateNumber(-1, 'Preço', 0)
  );
});

test('deve aceitar número inteiro', () => {
  assert.doesNotThrow(() =>
    SecurityValidator.validateInteger(10, 'Quantidade', 0)
  );
});

test('deve rejeitar número decimal como inteiro', () => {
  assert.throws(() =>
    SecurityValidator.validateInteger(2.5, 'Quantidade', 0)
  );
});
