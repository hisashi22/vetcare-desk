import { SecurityValidator } from '../security/SecurityValidator';

export interface EnderecoViaCep {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
}

interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean | string;
}

export class CepService {
  private readonly baseUrl = 'https://viacep.com.br/ws';

  private formatarCep(cep: string): string {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) {
      return cep.trim();
    }
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }

  public async buscarEnderecoPorCep(cep: string): Promise<EnderecoViaCep> {
    SecurityValidator.validateCEP(cep);
    const digits = cep.replace(/\D/g, '');

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/${digits}/json/`, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });
    } catch {
      throw new Error('Não foi possível conectar ao ViaCEP. Verifique sua conexão.');
    }

    if (!response.ok) {
      throw new Error(`Falha ao consultar ViaCEP (HTTP ${response.status}).`);
    }

    const data = (await response.json()) as ViaCepResponse;

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