
import type {
  AuthenticatedUser,
  Permission
} from './auth-types';

import type {
  UserRole,
  Tutor,
  Pet
} from './types';

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

    listPets(): Promise<Pet[]>;
    getPet(id: number): Promise<Pet | null>;
    listPetsByTutor(tutorId: number): Promise<Pet[]>;
    createPet(data: PetData): Promise<number>;
    updatePet(id: number, data: PetData): Promise<boolean>;
    deletePet(id: number): Promise<boolean>;
  };
}

declare global {
  interface Window {
    vetcare: VetCareAPI;
  }
}

export {};
