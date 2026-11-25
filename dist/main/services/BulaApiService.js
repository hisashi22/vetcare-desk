"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulaApiService = void 0;
class BulaApiService {
    baseUrl = 'https://api.fda.gov/drug/label.json';
    maxCharsPorSecao = 2000;
    async buscarBula(nome) {
        const termo = this.limparTermo(nome);
        const search = `(openfda.generic_name:"${termo}"+OR+openfda.brand_name:"${termo}")`;
        let response;
        try {
            response = await fetch(`${this.baseUrl}?search=${search}&limit=1`, {
                method: 'GET',
                headers: { Accept: 'application/json' },
                signal: AbortSignal.timeout(10000)
            });
        }
        catch {
            throw new Error('Não foi possível conectar à OpenFDA. Verifique sua conexão.');
        }
        if (response.status === 404) {
            throw new Error(`Nenhuma bula encontrada para "${termo}".`);
        }
        if (response.status === 429) {
            throw new Error('Muitas consultas à OpenFDA. Aguarde um minuto e tente de novo.');
        }
        if (!response.ok) {
            throw new Error(`Falha ao consultar a OpenFDA (HTTP ${response.status}).`);
        }
        const data = (await response.json());
        const label = data.results?.[0];
        if (!label) {
            throw new Error(`Nenhuma bula encontrada para "${termo}".`);
        }
        return {
            nomeMarca: label.openfda?.brand_name?.[0] ?? '',
            principioAtivo: label.openfda?.generic_name?.[0] ?? '',
            indicacoes: this.extrairTexto(label.indications_and_usage),
            posologia: this.extrairTexto(label.dosage_and_administration),
            contraindicacoes: this.extrairTexto(label.contraindications),
            avisos: this.extrairTexto(label.warnings ?? label.warnings_and_cautions),
            reacoesAdversas: this.extrairTexto(label.adverse_reactions),
            fonte: 'OpenFDA'
        };
    }
    formatarTexto(bula) {
        const secoes = [
            ['Indicações', bula.indicacoes],
            ['Posologia', bula.posologia],
            ['Contraindicações', bula.contraindicacoes],
            ['Avisos', bula.avisos],
            ['Reações adversas', bula.reacoesAdversas]
        ];
        const corpo = secoes
            .filter(([, texto]) => texto)
            .map(([titulo, texto]) => `${titulo}:\n${texto}`)
            .join('\n\n');
        return `${bula.nomeMarca || bula.principioAtivo} (fonte: ${bula.fonte})\n\n${corpo}`;
    }
    limparTermo(nome) {
        const termo = nome.replace(/["\\]/g, '').trim();
        if (termo.length < 2 || termo.length > 80) {
            throw new Error('Informe o nome do medicamento (entre 2 e 80 caracteres).');
        }
        return encodeURIComponent(termo);
    }
    extrairTexto(campo) {
        const texto = (campo ?? []).join(' ').replace(/\s+/g, ' ').trim();
        return texto.length > this.maxCharsPorSecao
            ? `${texto.slice(0, this.maxCharsPorSecao)}…`
            : texto;
    }
}
exports.BulaApiService = BulaApiService;
