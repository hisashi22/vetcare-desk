
import { AppRepositories } from '../repositories/AppRepositories';
import { BulaApiService } from './BulaApiService';
import {
  Tutor,
  Pet,
  Veterinario,
  Consulta,
  PrescricaoAplicacao,
  ProdutoEstoque,
  Bula
} from '../../shared/types';

export class ClinicaService {
  private readonly repositories: AppRepositories;
  private readonly bulaService: BulaApiService;

  constructor(
    repositories = new AppRepositories(),
    bulaService = new BulaApiService()
  ) {
    this.repositories = repositories;
    this.bulaService = bulaService;
  }

  private validateId(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('Identificador inválido.');
    }
  }

    private hoje(): string {
    return new Date().toLocaleDateString('sv-SE'); 
  }

  private validateDate(value: unknown, campo: string): void {
    if (
      typeof value !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}/.test(value.trim()) ||
      Number.isNaN(Date.parse(value.trim()))
    ) {
      throw new Error(`${campo} inválida (use AAAA-MM-DD).`);
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

     // =========================
  // VETERINÁRIOS
  // =========================

  private validateVeterinario(
    data: Omit<Veterinario, 'id'>,
    idAtual?: number
  ): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Dados do veterinário inválidos.');
    }

    this.validateId(data.usuarioId);

    if (typeof data.crmv !== 'string' || !data.crmv.trim()) {
      throw new Error('O CRMV é obrigatório.');
    }

    if (
      typeof data.especialidade !== 'string' ||
      typeof data.telefone !== 'string'
    ) {
      throw new Error('Dados complementares do veterinário inválidos.');
    }

    if (!this.repositories.veterinarios.usuarioEhVeterinario(data.usuarioId)) {
      throw new Error('Usuário não encontrado ou sem perfil de veterinário.');
    }

    const porCrmv = this.repositories.veterinarios.findByCrmv(data.crmv.trim());
    if (porCrmv && porCrmv.id !== idAtual) {
      throw new Error('Este CRMV já está cadastrado.');
    }

    const porUsuario = this.repositories.veterinarios.findByUsuarioId(
      data.usuarioId
    );
    if (porUsuario && porUsuario.id !== idAtual) {
      throw new Error('Este usuário já está vinculado a um veterinário.');
    }
  }

  public listarVeterinarios(): Veterinario[] {
    return this.repositories.veterinarios.findAll();
  }

  public buscarVeterinario(id: number): Veterinario | null {
    this.validateId(id);
    return this.repositories.veterinarios.findById(id);
  }

  public cadastrarVeterinario(data: Omit<Veterinario, 'id'>): number {
    this.validateVeterinario(data);

    return this.repositories.veterinarios.createVeterinario({
      ...data,
      crmv: data.crmv.trim()
    });
  }

  public atualizarVeterinario(
    id: number,
    data: Omit<Veterinario, 'id'>
  ): boolean {
    this.validateId(id);

    if (!this.repositories.veterinarios.findById(id)) {
      return false;
    }

    this.validateVeterinario(data, id);

    return this.repositories.veterinarios.updateVeterinario(id, {
      ...data,
      crmv: data.crmv.trim()
    });
  }

  public excluirVeterinario(id: number): boolean {
    this.validateId(id);

    if (this.repositories.consultas.findByVeterinarioId(id).length > 0) {
      throw new Error(
        'Não é possível excluir um veterinário que possui consultas registradas.'
      );
    }

    return this.repositories.veterinarios.delete(id);
  }

  // =========================
  // CONSULTAS / PRONTUÁRIO
  // =========================

  private validateConsulta(data: Omit<Consulta, 'id'>): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Dados da consulta inválidos.');
    }

    this.validateId(data.petId);
    this.validateId(data.veterinarioId);

    if (!this.repositories.pets.findById(data.petId)) {
      throw new Error('Pet não encontrado.');
    }

    if (!this.repositories.veterinarios.findById(data.veterinarioId)) {
      throw new Error('Veterinário não encontrado.');
    }

    this.validateDate(data.data, 'Data da consulta');

    if (typeof data.diagnostico !== 'string') {
      throw new Error('Diagnóstico inválido.');
    }
  }

  public listarConsultas(): Consulta[] {
    return this.repositories.consultas.findAll();
  }

  public buscarConsulta(id: number): Consulta | null {
    this.validateId(id);
    return this.repositories.consultas.findById(id);
  }


  public listarProntuarioDoPet(petId: number): Consulta[] {
    this.validateId(petId);

    if (!this.repositories.pets.findById(petId)) {
      throw new Error('Pet não encontrado.');
    }

    return this.repositories.consultas.findByPetId(petId);
  }

  public registrarConsulta(data: Omit<Consulta, 'id'>): number {
    this.validateConsulta(data);

    return this.repositories.consultas.createConsulta({
      ...data,
      data: data.data.trim(),
      diagnostico: data.diagnostico.trim()
    });
  }

  public atualizarConsulta(
    id: number,
    data: Omit<Consulta, 'id'>
  ): boolean {
    this.validateId(id);

    if (!this.repositories.consultas.findById(id)) {
      return false;
    }

    this.validateConsulta(data);

    return this.repositories.consultas.updateConsulta(id, {
      ...data,
      data: data.data.trim(),
      diagnostico: data.diagnostico.trim()
    });
  }

  public excluirConsulta(id: number): boolean {
    this.validateId(id);

    if (this.repositories.prescricoes.findByConsultaId(id).length > 0) {
      throw new Error(
        'Exclua primeiro as prescrições desta consulta (o estoque será estornado).'
      );
    }

    return this.repositories.consultas.delete(id);
  }

  // =========================
  // PRESCRIÇÕES (baixa/estorno de estoque)
  // =========================

  public listarPrescricoesDaConsulta(
    consultaId: number
  ): PrescricaoAplicacao[] {
    this.validateId(consultaId);

    if (!this.repositories.consultas.findById(consultaId)) {
      throw new Error('Consulta não encontrada.');
    }

    return this.repositories.prescricoes.findByConsultaId(consultaId);
  }

  public registrarPrescricao(
    data: Omit<PrescricaoAplicacao, 'id'>
  ): { id: number; estoqueBaixo: boolean } {
    if (!data || typeof data !== 'object') {
      throw new Error('Dados da prescrição inválidos.');
    }

    this.validateId(data.consultaId);
    this.validateId(data.produtoId);

    if (!Number.isInteger(data.quantidade) || data.quantidade <= 0) {
      throw new Error('A quantidade deve ser um inteiro maior que zero.');
    }

    if (!this.repositories.consultas.findById(data.consultaId)) {
      throw new Error('Consulta não encontrada.');
    }

    const produto = this.repositories.produtos.findById(data.produtoId);

    if (!produto) {
      throw new Error('Produto não encontrado.');
    }

    if (produto.validade && produto.validade < this.hoje()) {
      throw new Error(`O produto "${produto.nome}" está vencido.`);
    }

    if (produto.quantidade < data.quantidade) {
      throw new Error(
        `Estoque insuficiente de "${produto.nome}" (disponível: ${produto.quantidade}).`
      );
    }

    const dataAplicacao = (data.dataAplicacao ?? '').trim() || this.hoje();
    this.validateDate(dataAplicacao, 'Data de aplicação');

    const dataReforco = (data.dataReforco ?? '').trim() || null;

    if (dataReforco) {
      this.validateDate(dataReforco, 'Data do reforço');

      if (dataReforco < dataAplicacao) {
        throw new Error('A data do reforço não pode ser anterior à aplicação.');
      }
    }

    
    const id = this.repositories.prescricoes.createPrescricao({
      ...data,
      descricao: (data.descricao ?? '').trim(),
      dataAplicacao,
      dataReforco
    });

    const novaQuantidade = produto.quantidade - data.quantidade;

    try {
      this.repositories.produtos.updateQuantidade(produto.id, novaQuantidade);
    } catch (error) {
      this.repositories.prescricoes.delete(id);
      throw error;
    }

    return { id, estoqueBaixo: novaQuantidade <= produto.estoqueMinimo };
  }

  public excluirPrescricao(id: number): boolean {
    this.validateId(id);

    const prescricao = this.repositories.prescricoes.findById(id);

    if (!prescricao) {
      return false;
    }

    const produto = this.repositories.produtos.findById(prescricao.produtoId);

   
    if (produto) {
      this.repositories.produtos.updateQuantidade(
        produto.id,
        produto.quantidade + prescricao.quantidade
      );
    }

    try {
      return this.repositories.prescricoes.delete(id);
    } catch (error) {
      if (produto) {
        this.repositories.produtos.updateQuantidade(
          produto.id,
          produto.quantidade
        );
      }
      throw error;
    }
  }

  // =========================
  // BULAS
  // =========================

  public buscarBula(nome: string): Promise<Bula> {
    return this.bulaService.buscarBula(nome);
  }

  public async salvarBulaDoProduto(
    produtoId: number,
    nomeBusca: string
  ): Promise<Bula> {
    this.validateId(produtoId);

    if (!this.repositories.produtos.findById(produtoId)) {
      throw new Error('Produto não encontrado.');
    }

    const bula = await this.bulaService.buscarBula(nomeBusca);

    this.repositories.produtos.updateBula(
      produtoId,
      this.bulaService.formatarTexto(bula)
    );

    return bula;
  }
     
 // =========================
  // PRODUTOS 
  // =========================

  public listarProdutos(): ProdutoEstoque[] {
    return this.repositories.produtos.findAll();
  }


}
