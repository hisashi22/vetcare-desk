import { contextBridge, ipcRenderer } from 'electron';

import type {
  AuthenticatedUser,
  Permission
} from '../shared/auth-types';

import type {
  UserRole,
  Tutor,
  Pet,
  Fornecedor,
  ProdutoEstoque
} from '../shared/types';

import type {
  VacinaPendente,
  ResultadoNotificacoes
} from '../shared/notification-types';

type LoginData = {
  email: string;
  password: string;
};

type RegisterUserData = {
  nome: string;
  email: string;
  password: string;
  role: UserRole;
};

type RegisterAdminData = {
  nome: string;
  email: string;
  password: string;
};

type TutorData = Omit<Tutor, 'id'>;
type PetData = Omit<Pet, 'id'>;
type FornecedorData = Omit<Fornecedor, 'id'>;
type ProdutoEstoqueData = Omit<ProdutoEstoque, 'id'>;

const vetcareAPI = {
  auth: {
    login: (data: LoginData): Promise<AuthenticatedUser> =>
      ipcRenderer.invoke('auth:login', data),

    logout: (): Promise<boolean> =>
      ipcRenderer.invoke('auth:logout'),

    getCurrentUser: (): Promise<AuthenticatedUser | null> =>
      ipcRenderer.invoke('auth:get-current-user'),

    hasPermission: (permission: Permission): Promise<boolean> =>
      ipcRenderer.invoke('auth:has-permission', permission),

    createUser: (data: RegisterUserData): Promise<AuthenticatedUser> =>
      ipcRenderer.invoke('auth:create-user', data),

    registerInitialAdmin: (
      data: RegisterAdminData
    ): Promise<AuthenticatedUser> =>
      ipcRenderer.invoke('auth:register-initial-admin', data)
  },

  clinical: {
    listTutors: (): Promise<Tutor[]> =>
      ipcRenderer.invoke('clinical:list-tutors'),

    getTutor: (id: number): Promise<Tutor | null> =>
      ipcRenderer.invoke('clinical:get-tutor', id),

    getTutorByCpf: (cpf: string): Promise<Tutor | null> =>
      ipcRenderer.invoke('clinical:get-tutor-by-cpf', cpf),

    createTutor: (data: TutorData): Promise<number> =>
      ipcRenderer.invoke('clinical:create-tutor', data),

    updateTutor: (id: number, data: TutorData): Promise<boolean> =>
      ipcRenderer.invoke('clinical:update-tutor', id, data),

    deleteTutor: (id: number): Promise<boolean> =>
      ipcRenderer.invoke('clinical:delete-tutor', id),

    buscarCep: (cep: string) =>
      ipcRenderer.invoke('clinical:buscar-cep', cep),

    listPets: (): Promise<Pet[]> =>
      ipcRenderer.invoke('clinical:list-pets'),

    getPet: (id: number): Promise<Pet | null> =>
      ipcRenderer.invoke('clinical:get-pet', id),

    listPetsByTutor: (tutorId: number): Promise<Pet[]> =>
      ipcRenderer.invoke('clinical:list-pets-by-tutor', tutorId),

    createPet: (data: PetData): Promise<number> =>
      ipcRenderer.invoke('clinical:create-pet', data),

    updatePet: (id: number, data: PetData): Promise<boolean> =>
      ipcRenderer.invoke('clinical:update-pet', id, data),

    deletePet: (id: number): Promise<boolean> =>
      ipcRenderer.invoke('clinical:delete-pet', id)
  },

  stock: {
    listSuppliers: (): Promise<Fornecedor[]> =>
      ipcRenderer.invoke('stock:list-suppliers'),

    getSupplier: (id: number): Promise<Fornecedor | null> =>
      ipcRenderer.invoke('stock:get-supplier', id),

    createSupplier: (data: FornecedorData): Promise<number> =>
      ipcRenderer.invoke('stock:create-supplier', data),

    updateSupplier: (id: number, data: FornecedorData): Promise<boolean> =>
      ipcRenderer.invoke('stock:update-supplier', id, data),

    deleteSupplier: (id: number): Promise<boolean> =>
      ipcRenderer.invoke('stock:delete-supplier', id),

    listProducts: (): Promise<ProdutoEstoque[]> =>
      ipcRenderer.invoke('stock:list-products'),

    getProduct: (id: number): Promise<ProdutoEstoque | null> =>
      ipcRenderer.invoke('stock:get-product', id),

    listCriticalProducts: (): Promise<ProdutoEstoque[]> =>
      ipcRenderer.invoke('stock:list-critical-products'),

    createProduct: (data: ProdutoEstoqueData): Promise<number> =>
      ipcRenderer.invoke('stock:create-product', data),

    updateProduct: (id: number, data: ProdutoEstoqueData): Promise<boolean> =>
      ipcRenderer.invoke('stock:update-product', id, data),

    deleteProduct: (id: number): Promise<boolean> =>
      ipcRenderer.invoke('stock:delete-product', id),

    getUsdRate: () =>
      ipcRenderer.invoke('stock:get-usd-rate')
  },

  notificacoes: {
    buscarVacinasPendentes: (): Promise<VacinaPendente[]> =>
      ipcRenderer.invoke('notificacoes:buscar-vacinas-pendentes'),

    enviarNotificacoes: (): Promise<ResultadoNotificacoes> =>
      ipcRenderer.invoke('notificacoes:enviar')
  }
};

contextBridge.exposeInMainWorld('vetcare', vetcareAPI);
