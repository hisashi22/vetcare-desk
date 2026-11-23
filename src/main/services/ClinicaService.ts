
import { AppRepositories } from '../repositories/AppRepositories';
import { Tutor, Pet } from '../../shared/types';

export class ClinicaService {
  private readonly repositories: AppRepositories;

  constructor(repositories = new AppRepositories()) {
    this.repositories = repositories;
  }

  private validateId(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('Identificador inválido.');
    }
  }

  private normalizeCpf(cpf: string): string {
    return cpf.replace(/\D/g, '');
  }

  private validateCpf(cpf: string): void {
    const digits = this.normalizeCpf(cpf);

    if (!/^\d{11}$/.test(digits)) {
      throw new Error('CPF deve conter 11 dígitos.');
    }

    if (/^(\d)\1{10}$/.test(digits)) {
      throw new Error('CPF inválido.');
    }

    const calculateDigit = (length: number): number => {
      let sum = 0;

      for (let i = 0; i < length; i++) {
        sum += Number(digits[i]) * (length + 1 - i);
      }

      const remainder = (sum * 10) % 11;
      return remainder === 10 ? 0 : remainder;
    };

    const firstDigit = calculateDigit(9);
    const secondDigit = calculateDigit(10);

    if (
      firstDigit !== Number(digits[9]) ||
      secondDigit !== Number(digits[10])
    ) {
      throw new Error('CPF inválido.');
    }
  }

  private validateTutor(data: Omit<Tutor, 'id'>): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Dados do tutor inválidos.');
    }

    if (typeof data.nome !== 'string' || !data.nome.trim()) {
      throw new Error('Nome do tutor é obrigatório.');
    }

    if (typeof data.cpf !== 'string') {
      throw new Error('CPF inválido.');
    }

    this.validateCpf(data.cpf);

    const optionalFields = [
      'telefone',
      'email',
      'cep',
      'logradouro',
      'bairro',
      'cidade',
      'uf'
    ] as const;

    for (const field of optionalFields) {
      if (typeof data[field] !== 'string') {
        throw new Error(`Campo ${field} inválido.`);
      }
    }

    if (
      data.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
    ) {
      throw new Error('E-mail inválido.');
    }

    if (
      data.cep &&
      !/^\d{5}-?\d{3}$/.test(data.cep)
    ) {
      throw new Error('CEP inválido.');
    }

    if (data.uf && !/^[A-Za-z]{2}$/.test(data.uf)) {
      throw new Error('UF deve conter duas letras.');
    }
  }

  private validatePet(data: Omit<Pet, 'id'>): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Dados do pet inválidos.');
    }

    if (typeof data.nome !== 'string' || !data.nome.trim()) {
      throw new Error('Nome do pet é obrigatório.');
    }

    this.validateId(data.tutorId);

    if (!this.repositories.tutores.findById(data.tutorId)) {
      throw new Error('Tutor não encontrado.');
    }

    if (
      data.especie !== 'CACHORRO' &&
      data.especie !== 'GATO'
    ) {
      throw new Error('Espécie inválida.');
    }

    if (
      typeof data.raca !== 'string' ||
      typeof data.observacoes !== 'string'
    ) {
      throw new Error('Dados complementares do pet inválidos.');
    }

    if (
      !Number.isInteger(data.idade) ||
      data.idade < 0
    ) {
      throw new Error('Idade do pet inválida.');
    }

    if (
      typeof data.peso !== 'number' ||
      !Number.isFinite(data.peso) ||
      data.peso < 0
    ) {
      throw new Error('Peso do pet inválido.');
    }
  }

  // =========================
  // TUTORES
  // =========================

  public listarTutores(): Tutor[] {
    return this.repositories.tutores.findAll();
  }

  public buscarTutor(id: number): Tutor | null {
    this.validateId(id);
    return this.repositories.tutores.findById(id);
  }

  public buscarTutorPorCpf(cpf: string): Tutor | null {
    this.validateCpf(cpf);

    return this.repositories.tutores.findByCpf(
      this.normalizeCpf(cpf)
    );
  }

  public cadastrarTutor(data: Omit<Tutor, 'id'>): number {
    this.validateTutor(data);

    const cpf = this.normalizeCpf(data.cpf);

    if (this.repositories.tutores.findByCpf(cpf)) {
      throw new Error('Este CPF já está cadastrado.');
    }

    return this.repositories.tutores.createTutor({
      ...data,
      nome: data.nome.trim(),
      cpf
    });
  }

  public atualizarTutor(
    id: number,
    data: Omit<Tutor, 'id'>
  ): boolean {
    this.validateId(id);
    this.validateTutor(data);

    if (!this.repositories.tutores.findById(id)) {
      return false;
    }

    const cpf = this.normalizeCpf(data.cpf);
    const existing = this.repositories.tutores.findByCpf(cpf);

    if (existing && existing.id !== id) {
      throw new Error('Este CPF já pertence a outro tutor.');
    }

    return this.repositories.tutores.updateTutor(id, {
      ...data,
      nome: data.nome.trim(),
      cpf
    });
  }

  public excluirTutor(id: number): boolean {
    this.validateId(id);

    if (this.repositories.pets.findByTutorId(id).length > 0) {
      throw new Error(
        'Não é possível excluir um tutor que possui pets cadastrados.'
      );
    }

    return this.repositories.tutores.deleteTutor(id);
  }

  // =========================
  // PETS
  // =========================

  public listarPets(): Pet[] {
    return this.repositories.pets.findAll();
  }

  public buscarPet(id: number): Pet | null {
    this.validateId(id);
    return this.repositories.pets.findById(id);
  }

  public listarPetsDoTutor(tutorId: number): Pet[] {
    this.validateId(tutorId);

    if (!this.repositories.tutores.findById(tutorId)) {
      throw new Error('Tutor não encontrado.');
    }

    return this.repositories.pets.findByTutorId(tutorId);
  }

  public cadastrarPet(data: Omit<Pet, 'id'>): number {
    this.validatePet(data);
    return this.repositories.pets.createPet(data);
  }

  public atualizarPet(
    id: number,
    data: Omit<Pet, 'id'>
  ): boolean {
    this.validateId(id);
    this.validatePet(data);

    return this.repositories.pets.updatePet(id, data);
  }

  public excluirPet(id: number): boolean {
    this.validateId(id);
    return this.repositories.pets.deletePet(id);
  }
}
