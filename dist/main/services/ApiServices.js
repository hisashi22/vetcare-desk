"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CambioService = exports.CepService = void 0;
const SecurityValidator_1 = require("../security/SecurityValidator");
class CepService {
    baseUrl = 'https://viacep.com.br';
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
class CambioService {
    baseUrl = 'https://awesomeapi.com.br';
    async obterCotacaoDolar() {
        let response;
        try {
            response = await fetch(this.baseUrl, {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                },
                signal: AbortSignal.timeout(10000)
            });
        }
        catch {
            throw new Error('Não foi possível conectar à AwesomeAPI para obter a cotação do dólar.');
        }
        if (!response.ok) {
            throw new Error(`Falha ao consultar cotação USD/BRL (HTTP ${response.status}).`);
        }
        const data = (await response.json());
        const bidStr = data.USDBRL?.bid;
        if (!bidStr) {
            throw new Error('Resposta inválida da AwesomeAPI ao consultar o dólar.');
        }
        const valorCompra = Number.parseFloat(bidStr);
        if (!Number.isFinite(valorCompra) || valorCompra <= 0) {
            throw new Error('Valor de cotação USD/BRL inválido.');
        }
        return {
            moedaOrigem: 'USD',
            moedaDestino: 'BRL',
            valorCompra,
            atualizadoEm: data.USDBRL?.create_date ?? new Date().toISOString()
        };
    }
    async converterUsdParaBrl(valorUsd) {
        if (typeof valorUsd !== 'number' || !Number.isFinite(valorUsd) || valorUsd < 0) {
            throw new Error('Valor em dólar inválido para conversão.');
        }
        const cotacaoInfo = await this.obterCotacaoDolar();
        const valorBrl = Number((valorUsd * cotacaoInfo.valorCompra).toFixed(2));
        return {
            valorUsd,
            cotacao: cotacaoInfo.valorCompra,
            valorBrl,
            atualizadoEm: cotacaoInfo.atualizadoEm
        };
    }
}
exports.CambioService = CambioService;
