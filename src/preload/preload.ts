import { contextBridge, ipcRenderer } from 'electron';

import type {
  AuthenticatedUser,
  Permission
} from '../shared/auth-types';

import type {
  UserRole,
  Tutor,
  Pet,
  Veterinario, 
  Consulta,
   PrescricaoAplicacao,
   ProdutoEstoque,
   Bula

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
type VeterinarioData = Omit<Veterinario, 'id'>;
type ConsultaData = Omit<Consulta, 'id'>;
type PrescricaoData = Omit<PrescricaoAplicacao, 'id'>;

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
      ipcRenderer.invoke('clinical:delete-pet', id),

        listVeterinarios: (): Promise<Veterinario[]> =>
      ipcRenderer.invoke('clinical:list-veterinarios'),

    getVeterinario: (id: number): Promise<Veterinario | null> =>
      ipcRenderer.invoke('clinical:get-veterinario', id),

    createVeterinario: (data: VeterinarioData): Promise<number> =>
      ipcRenderer.invoke('clinical:create-veterinario', data),

    updateVeterinario: (id: number, data: VeterinarioData): Promise<boolean> =>
      ipcRenderer.invoke('clinical:update-veterinario', id, data),

    deleteVeterinario: (id: number): Promise<boolean> =>
      ipcRenderer.invoke('clinical:delete-veterinario', id),

    listConsultas: (): Promise<Consulta[]> =>
      ipcRenderer.invoke('clinical:list-consultas'),

    getConsulta: (id: number): Promise<Consulta | null> =>
      ipcRenderer.invoke('clinical:get-consulta', id),

    listProntuarioByPet: (petId: number): Promise<Consulta[]> =>
      ipcRenderer.invoke('clinical:list-prontuario-pet', petId),

    createConsulta: (data: ConsultaData): Promise<number> =>
      ipcRenderer.invoke('clinical:create-consulta', data),

    updateConsulta: (id: number, data: ConsultaData): Promise<boolean> =>
      ipcRenderer.invoke('clinical:update-consulta', id, data),

    deleteConsulta: (id: number): Promise<boolean> =>
      ipcRenderer.invoke('clinical:delete-consulta', id),

     listProdutos: (): Promise<ProdutoEstoque[]> =>
      ipcRenderer.invoke('clinical:list-produtos'),

    listPrescricoesByConsulta: (
      consultaId: number
    ): Promise<PrescricaoAplicacao[]> =>
      ipcRenderer.invoke('clinical:list-prescricoes-by-consulta', consultaId),

    createPrescricao: (
      data: PrescricaoData
    ): Promise<{ id: number; estoqueBaixo: boolean }> =>
      ipcRenderer.invoke('clinical:create-prescricao', data),

    deletePrescricao: (id: number): Promise<boolean> =>
      ipcRenderer.invoke('clinical:delete-prescricao', id),

    buscarBula: (nome: string): Promise<Bula> =>
      ipcRenderer.invoke('clinical:buscar-bula', nome),

    salvarBulaProduto: (produtoId: number, nome: string): Promise<Bula> =>
      ipcRenderer.invoke('clinical:salvar-bula-produto', produtoId, nome)
    
  },

  notificacoes: {
    buscarVacinasPendentes: (): Promise<VacinaPendente[]> =>
      ipcRenderer.invoke('notificacoes:buscar-vacinas-pendentes'),

    enviarNotificacoes: (): Promise<ResultadoNotificacoes> =>
      ipcRenderer.invoke('notificacoes:enviar')
  }
};

contextBridge.exposeInMainWorld('vetcare', vetcareAPI);