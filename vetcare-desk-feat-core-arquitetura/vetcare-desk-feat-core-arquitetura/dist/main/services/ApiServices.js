"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CepService = void 0;
const SecurityValidator_1 = require("../security/SecurityValidator");
class CepService {
    baseUrl = 'https://viacep.com.br/ws';
    formatarCep(cep) {
        const digits = cep.replace(/\D/g, '');
        if (digits.length !== 8) {
            return cep.trim();
        }
        return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
    async buscarEnderecoPorCep(cep) {
        SecurityValidator_1.SecurityValidator.validateCEP(cep);
        const digits = cep.replace(/\D/g, '');
        let response;
        try {
            response = await fetch(`${this.baseUrl}/${digits}/json/`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                },
                signal: AbortSignal.timeout(10000)
            });
        }
        catch {
            throw new Error('Não foi possível conectar ao ViaCEP. Verifique sua conexão.');
        }
        if (!response.ok) {
            throw new Error(`Falha ao consultar ViaCEP (HTTP ${response.status}).`);
        }
        const data = (await response.json());
        if (data.erro === true || data.erro === 'true') {
            throw new Error('CEP não encontrado na base do ViaCEP.');
        }
        return {
            cep: this.formatarCep(data.cep ?? digits),
            logradouro: (data.logradouro ?? '').trim(),
            bairro: (data.bairro ?? '').trim(),
            cidade: (data.localidade ?? '').trim(),
            uf: (data.uf ?? '').trim().toUpperCase()
        };
    }
}
exports.CepService = CepService;
