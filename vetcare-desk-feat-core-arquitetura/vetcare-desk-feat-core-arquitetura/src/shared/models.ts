
import {
  Usuario,
  Veterinario,
  Tutor,
  Pet,
  Fornecedor,
  ProdutoEstoque,
  Consulta,
  PrescricaoAplicacao
} from './types';

export class UsuarioModel implements Usuario {
  constructor(
    public id: number,
    public email: string,
    public passwordHash: string,
    public salt: string,
    public role: Usuario['role']
  ) {}
}

export class VeterinarioModel implements Veterinario {
  constructor(
    public id: number,
    public usuarioId: number,
    public crmv: string,
    public especialidade: string,
    public telefone: string
  ) {}
}

export class TutorModel implements Tutor {
  constructor(
    public id: number,
    public nome: string,
    public cpf: string,
    public telefone: string,
    public email: string,
    public cep: string,
    public logradouro: string,
    public bairro: string,
    public cidade: string,
    public uf: string
  ) {}
}

export class PetModel implements Pet {
  constructor(
    public id: number,
    public tutorId: number,
    public nome: string,
    public especie: Pet['especie'],
    public raca: string,
    public idade: number,
    public peso: number,
    public observacoes: string
  ) {}
}

export class FornecedorModel implements Fornecedor {
  constructor(
    public id: number,
    public nome: string,
    public moeda: Fornecedor['moeda']
  ) {}
}

export class ProdutoEstoqueModel implements ProdutoEstoque {
  constructor(
    public id: number,
    public fornecedorId: number,
    public nome: string,
    public lote: string,
    public validade: string,
    public quantidade: number,
    public estoqueMinimo: number,
    public bula: string,
    public custo: number
  ) {}
}

export class ConsultaModel implements Consulta {
  constructor(
    public id: number,
    public petId: number,
    public veterinarioId: number,
    public data: string,
    public diagnostico: string
  ) {}
}

export class PrescricaoAplicacaoModel implements PrescricaoAplicacao {
  constructor(
    public id: number,
    public consultaId: number,
    public produtoId: number,
    public tipo: PrescricaoAplicacao['tipo'],
    public descricao: string,
    public quantidade: number,
    public dataAplicacao: string,
    public dataReforco: string | null
  ) {}
}
