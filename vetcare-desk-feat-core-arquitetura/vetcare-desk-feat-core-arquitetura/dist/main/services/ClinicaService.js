"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicaService = void 0;
const AppRepositories_1 = require("../repositories/AppRepositories");
const BulaApiService_1 = require("./BulaApiService");
class ClinicaService {
    repositories;
    bulaService;
    constructor(repositories = new AppRepositories_1.AppRepositories(), bulaService = new BulaApiService_1.BulaApiService()) {
        this.repositories = repositories;
        this.bulaService = bulaService;
    }
    validateId(id) {
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error('Identificador inválido.');
        }
    }
    hoje() {
        return new Date().toLocaleDateString('sv-SE');
    }
    validateDate(value, campo) {
        if (typeof value !== 'string' ||
            !/^\d{4}-\d{2}-\d{2}/.test(value.trim()) ||
            Number.isNaN(Date.parse(value.trim()))) {
            throw new Error(`${campo} inválida (use AAAA-MM-DD).`);
        }
    }
    normalizeCpf(cpf) {
        return cpf.replace(/\D/g, '');
    }
    validateCpf(cpf) {
        const digits = this.normalizeCpf(cpf);
        if (!/^\d{11}$/.test(digits)) {
            throw new Error('CPF deve conter 11 dígitos.');
        }
        if (/^(\d)\1{10}$/.test(digits)) {
            throw new Error('CPF inválido.');
        }
        const calculateDigit = (length) => {
            let sum = 0;
            for (let i = 0; i < length; i++) {
                sum += Number(digits[i]) * (length + 1 - i);
            }
            const remainder = (sum * 10) % 11;
            return remainder === 10 ? 0 : remainder;
        };
        const firstDigit = calculateDigit(9);
        const secondDigit = calculateDigit(10);
        if (firstDigit !== Number(digits[9]) ||
            secondDigit !== Number(digits[10])) {
            throw new Error('CPF inválido.');
        }
    }
    validateTutor(data) {
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
        ];
        for (const field of optionalFields) {
            if (typeof data[field] !== 'string') {
                throw new Error(`Campo ${field} inválido.`);
            }
        }
        if (data.email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            throw new Error('E-mail inválido.');
        }
        if (data.cep &&
            !/^\d{5}-?\d{3}$/.test(data.cep)) {
            throw new Error('CEP inválido.');
        }
        if (data.uf && !/^[A-Za-z]{2}$/.test(data.uf)) {
            throw new Error('UF deve conter duas letras.');
        }
    }
    validatePet(data) {
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
        if (data.especie !== 'CACHORRO' &&
            data.especie !== 'GATO') {
            throw new Error('Espécie inválida.');
        }
        if (typeof data.raca !== 'string' ||
            typeof data.observacoes !== 'string') {
            throw new Error('Dados complementares do pet inválidos.');
        }
        if (!Number.isInteger(data.idade) ||
            data.idade < 0) {
            throw new Error('Idade do pet inválida.');
        }
        if (typeof data.peso !== 'number' ||
            !Number.isFinite(data.peso) ||
            data.peso < 0) {
            throw new Error('Peso do pet inválido.');
        }
    }
    // =========================
    // TUTORES
    // =========================
    listarTutores() {
        return this.repositories.tutores.findAll();
    }
    buscarTutor(id) {
        this.validateId(id);
        return this.repositories.tutores.findById(id);
    }
    buscarTutorPorCpf(cpf) {
        this.validateCpf(cpf);
        return this.repositories.tutores.findByCpf(this.normalizeCpf(cpf));
    }
    cadastrarTutor(data) {
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
    atualizarTutor(id, data) {
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
    excluirTutor(id) {
        this.validateId(id);
        if (this.repositories.pets.findByTutorId(id).length > 0) {
            throw new Error('Não é possível excluir um tutor que possui pets cadastrados.');
        }
        return this.repositories.tutores.deleteTutor(id);
    }
    // =========================
    // PETS
    // =========================
    listarPets() {
        return this.repositories.pets.findAll();
    }
    buscarPet(id) {
        this.validateId(id);
        return this.repositories.pets.findById(id);
    }
    listarPetsDoTutor(tutorId) {
        this.validateId(tutorId);
        if (!this.repositories.tutores.findById(tutorId)) {
            throw new Error('Tutor não encontrado.');
        }
        return this.repositories.pets.findByTutorId(tutorId);
    }
    cadastrarPet(data) {
        this.validatePet(data);
        return this.repositories.pets.createPet(data);
    }
    atualizarPet(id, data) {
        this.validateId(id);
        this.validatePet(data);
        return this.repositories.pets.updatePet(id, data);
    }
    excluirPet(id) {
        this.validateId(id);
        return this.repositories.pets.deletePet(id);
    }
    // =========================
    // VETERINÁRIOS
    // =========================
    validateVeterinario(data, idAtual) {
        if (!data || typeof data !== 'object') {
            throw new Error('Dados do veterinário inválidos.');
        }
        this.validateId(data.usuarioId);
        if (typeof data.crmv !== 'string' || !data.crmv.trim()) {
            throw new Error('O CRMV é obrigatório.');
        }
        if (typeof data.especialidade !== 'string' ||
            typeof data.telefone !== 'string') {
            throw new Error('Dados complementares do veterinário inválidos.');
        }
        if (!this.repositories.veterinarios.usuarioEhVeterinario(data.usuarioId)) {
            throw new Error('Usuário não encontrado ou sem perfil de veterinário.');
        }
        const porCrmv = this.repositories.veterinarios.findByCrmv(data.crmv.trim());
        if (porCrmv && porCrmv.id !== idAtual) {
            throw new Error('Este CRMV já está cadastrado.');
        }
        const porUsuario = this.repositories.veterinarios.findByUsuarioId(data.usuarioId);
        if (porUsuario && porUsuario.id !== idAtual) {
            throw new Error('Este usuário já está vinculado a um veterinário.');
        }
    }
    listarVeterinarios() {
        return this.repositories.veterinarios.findAll();
    }
    buscarVeterinario(id) {
        this.validateId(id);
        return this.repositories.veterinarios.findById(id);
    }
    cadastrarVeterinario(data) {
        this.validateVeterinario(data);
        return this.repositories.veterinarios.createVeterinario({
            ...data,
            crmv: data.crmv.trim()
        });
    }
    atualizarVeterinario(id, data) {
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
    excluirVeterinario(id) {
        this.validateId(id);
        if (this.repositories.consultas.findByVeterinarioId(id).length > 0) {
            throw new Error('Não é possível excluir um veterinário que possui consultas registradas.');
        }
        return this.repositories.veterinarios.delete(id);
    }
    // =========================
    // CONSULTAS / PRONTUÁRIO
    // =========================
    validateConsulta(data) {
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
    listarConsultas() {
        return this.repositories.consultas.findAll();
    }
    buscarConsulta(id) {
        this.validateId(id);
        return this.repositories.consultas.findById(id);
    }
    listarProntuarioDoPet(petId) {
        this.validateId(petId);
        if (!this.repositories.pets.findById(petId)) {
            throw new Error('Pet não encontrado.');
        }
        return this.repositories.consultas.findByPetId(petId);
    }
    registrarConsulta(data) {
        this.validateConsulta(data);
        return this.repositories.consultas.createConsulta({
            ...data,
            data: data.data.trim(),
            diagnostico: data.diagnostico.trim()
        });
    }
    atualizarConsulta(id, data) {
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
    excluirConsulta(id) {
        this.validateId(id);
        if (this.repositories.prescricoes.findByConsultaId(id).length > 0) {
            throw new Error('Exclua primeiro as prescrições desta consulta (o estoque será estornado).');
        }
        return this.repositories.consultas.delete(id);
    }
    // =========================
    // PRESCRIÇÕES (baixa/estorno de estoque)
    // =========================
    listarPrescricoesDaConsulta(consultaId) {
        this.validateId(consultaId);
        if (!this.repositories.consultas.findById(consultaId)) {
            throw new Error('Consulta não encontrada.');
        }
        return this.repositories.prescricoes.findByConsultaId(consultaId);
    }
    registrarPrescricao(data) {
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
            throw new Error(`Estoque insuficiente de "${produto.nome}" (disponível: ${produto.quantidade}).`);
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
        }
        catch (error) {
            this.repositories.prescricoes.delete(id);
            throw error;
        }
        return { id, estoqueBaixo: novaQuantidade <= produto.estoqueMinimo };
    }
    excluirPrescricao(id) {
        this.validateId(id);
        const prescricao = this.repositories.prescricoes.findById(id);
        if (!prescricao) {
            return false;
        }
        const produto = this.repositories.produtos.findById(prescricao.produtoId);
        if (produto) {
            this.repositories.produtos.updateQuantidade(produto.id, produto.quantidade + prescricao.quantidade);
        }
        try {
            return this.repositories.prescricoes.delete(id);
        }
        catch (error) {
            if (produto) {
                this.repositories.produtos.updateQuantidade(produto.id, produto.quantidade);
            }
            throw error;
        }
    }
    // =========================
    // BULAS
    // =========================
    buscarBula(nome) {
        return this.bulaService.buscarBula(nome);
    }
    async salvarBulaDoProduto(produtoId, nomeBusca) {
        this.validateId(produtoId);
        if (!this.repositories.produtos.findById(produtoId)) {
            throw new Error('Produto não encontrado.');
        }
        const bula = await this.bulaService.buscarBula(nomeBusca);
        this.repositories.produtos.updateBula(produtoId, this.bulaService.formatarTexto(bula));
        return bula;
    }
    // =========================
    // PRODUTOS 
    // =========================
    listarProdutos() {
        return this.repositories.produtos.findAll();
    }
}
exports.ClinicaService = ClinicaService;
