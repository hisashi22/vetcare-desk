import type {
  AuthenticatedUser,
  Permission
} from './auth-types';

import type {
  UserRole,
  Tutor,
  Pet,
  Fornecedor,
  ProdutoEstoque
} from './types';

import type {
  VacinaPendente,
  ResultadoNotificacoes
} from './notification-types';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterUserData {
  nome: string;
  email: string;
  password: string;
  role: UserRole;
}

interface RegisterAdminData {
  nome: string;
  email: string;
  password: string;
}

type TutorData = Omit<Tutor, 'id'>;
type PetData = Omit<Pet, 'id'>;
type FornecedorData = Omit<Fornecedor, 'id'>;
type ProdutoEstoqueData = Omit<ProdutoEstoque, 'id'>;

interface EnderecoViaCep {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
}

interface CotacaoDolar {
  moedaOrigem: 'USD';
  moedaDestino: 'BRL';
  valorCompra: number;
  atualizadoEm: string;
}

interface VetCareAPI {
  auth: {
    login(data: LoginData): Promise<AuthenticatedUser>;
    logout(): Promise<boolean>;
    getCurrentUser(): Promise<AuthenticatedUser | null>;
    hasPermission(permission: Permission): Promise<boolean>;
    createUser(data: RegisterUserData): Promise<AuthenticatedUser>;
    registerInitialAdmin(data: RegisterAdminData): Promise<AuthenticatedUser>;
  };

  clinical: {
    listTutors(): Promise<Tutor[]>;
    getTutor(id: number): Promise<Tutor | null>;
    getTutorByCpf(cpf: string): Promise<Tutor | null>;
    createTutor(data: TutorData): Promise<number>;
    updateTutor(id: number, data: TutorData): Promise<boolean>;
    deleteTutor(id: number): Promise<boolean>;
    buscarCep(cep: string): Promise<EnderecoViaCep>;

    listPets(): Promise<Pet[]>;
    getPet(id: number): Promise<Pet | null>;
    listPetsByTutor(tutorId: number): Promise<Pet[]>;
    createPet(data: PetData): Promise<number>;
    updatePet(id: number, data: PetData): Promise<boolean>;
    deletePet(id: number): Promise<boolean>;
  };

  stock: {
    listSuppliers(): Promise<Fornecedor[]>;
    getSupplier(id: number): Promise<Fornecedor | null>;
    createSupplier(data: FornecedorData): Promise<number>;
    updateSupplier(id: number, data: FornecedorData): Promise<boolean>;
    deleteSupplier(id: number): Promise<boolean>;

    listProducts(): Promise<ProdutoEstoque[]>;
    getProduct(id: number): Promise<ProdutoEstoque | null>;
    listCriticalProducts(): Promise<ProdutoEstoque[]>;
    createProduct(data: ProdutoEstoqueData): Promise<number>;
    updateProduct(id: number, data: ProdutoEstoqueData): Promise<boolean>;
    deleteProduct(id: number): Promise<boolean>;
    getUsdRate(): Promise<CotacaoDolar>;
  };

  notificacoes: {
    buscarVacinasPendentes(): Promise<VacinaPendente[]>;
    enviarNotificacoes(): Promise<ResultadoNotificacoes>;
  };
}

declare global {
  interface Window {
    vetcare: VetCareAPI;
  }
}

export {};
