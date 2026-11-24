
/**
 * VetCare Desktop
 * Tipos compartilhados do sistema.
 */

// Perfis de acesso
export type UserRole = 'ADMIN' | 'VETERINARIO';

// Moedas utilizadas pelos fornecedores
export type Currency = 'BRL' | 'USD';

// Espécies atendidas
export type PetSpecies = 'CACHORRO' | 'GATO';

// Tipos de registro clínico
export type PrescricaoTipo = 'PRESCRICAO' | 'APLICACAO';

// Usuários
export interface Usuario {
  id: number;
  email: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
}

// Veterinários
export interface Veterinario {
  id: number;
  usuarioId: number;
  crmv: string;
  especialidade: string;
  telefone: string;
  nome?: string; 
}

// Tutores
export interface Tutor {
  id: number;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
}

// Pets
export interface Pet {
  id: number;
  tutorId: number;
  nome: string;
  especie: PetSpecies;
  raca: string;
  idade: number;
  peso: number;
  observacoes: string;
}

// Fornecedores
export interface Fornecedor {
  id: number;
  nome: string;
  moeda: Currency;
}

// Produtos em estoque
export interface ProdutoEstoque {
  id: number;
  fornecedorId: number;
  nome: string;
  lote: string;
  validade: string;
  quantidade: number;
  estoqueMinimo: number;
  bula: string;
  custo: number;
}

// Consultas
export interface Consulta {
  id: number;
  petId: number;
  veterinarioId: number;
  data: string;
  diagnostico: string;
}

// Prescrições e aplicações
export interface PrescricaoAplicacao {
  id: number;
  consultaId: number;
  produtoId: number;
  tipo: PrescricaoTipo;
  descricao: string;
  quantidade: number;
  dataAplicacao: string;
  dataReforco: string | null; // coluna proxima_dose
}

// Bula de medicamento (OpenFDA)
export interface Bula {
  nomeMarca: string;
  principioAtivo: string;
  indicacoes: string;
  posologia: string;
  contraindicacoes: string;
  avisos: string;
  reacoesAdversas: string;
  fonte: string;
}