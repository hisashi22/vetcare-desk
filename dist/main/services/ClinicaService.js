"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicaService = void 0;
const AppRepositories_1 = require("../repositories/AppRepositories");
const ApiServices_1 = require("./ApiServices");
class ClinicaService {
    repositories;
    cambioService;
    constructor(repositories = new AppRepositories_1.AppRepositories(), cambioService = new ApiServices_1.CambioService()) {
        this.repositories = repositories;
        this.cambioService = cambioService;
    }
    validateId(id) {
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error('Identificador inválido.');
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
    validateFornecedor(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Dados do fornecedor inválidos.');
        }
        if (typeof data.nome !== 'string' || !data.nome.trim()) {
            throw new Error('Nome do fornecedor é obrigatório.');
        }
        if (typeof data.documento !== 'string' ||
            typeof data.email !== 'string' ||
            typeof data.telefone !== 'string' ||
            typeof data.pais !== 'string') {
            throw new Error('Dados complementares do fornecedor inválidos.');
        }
        if (data.email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            throw new Error('E-mail do fornecedor inválido.');
        }
        if (data.moeda !== 'BRL' && data.moeda !== 'USD') {
            throw new Error('Moeda do fornecedor deve ser BRL ou USD.');
        }
    }
    validateProdutoEstoque(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Dados do produto inválidos.');
        }
        this.validateId(data.fornecedorId);
        const fornecedor = this.repositories.fornecedores.findById(data.fornecedorId);
        if (!fornecedor) {
            throw new Error('Fornecedor vinculado não encontrado.');
        }
        if (typeof data.nome !== 'string' || !data.nome.trim()) {
            throw new Error('Nome do produto é obrigatório.');
        }
        if (typeof data.categoria !== 'string' || !data.categoria.trim()) {
            throw new Error('Categoria do produto é obrigatória.');
        }
        if (typeof data.lote !== 'string' ||
            typeof data.validade !== 'string' ||
            typeof data.bula !== 'string') {
            throw new Error('Dados complementares do produto inválidos.');
        }
        if (!Number.isInteger(data.quantidade) || data.quantidade < 0) {
            throw new Error('Quantidade em estoque inválida.');
        }
        if (!Number.isInteger(data.estoqueMinimo) || data.estoqueMinimo < 0) {
            throw new Error('Estoque mínimo inválido.');
        }
        if (typeof data.custo !== 'number' || !Number.isFinite(data.custo) || data.custo < 0) {
            throw new Error('Custo do produto inválido.');
        }
        return fornecedor;
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
    // FORNECEDORES
    // =========================
    listarFornecedores() {
        return this.repositories.fornecedores.findAll();
    }
    buscarFornecedor(id) {
        this.validateId(id);
        return this.repositories.fornecedores.findById(id);
    }
    cadastrarFornecedor(data) {
        this.validateFornecedor(data);
        return this.repositories.fornecedores.createFornecedor({
            ...data,
            nome: data.nome.trim(),
            documento: data.documento.trim(),
            email: data.email.trim(),
            telefone: data.telefone.trim(),
            pais: data.pais.trim() || (data.moeda === 'USD' ? 'Exterior' : 'Brasil')
        });
    }
    atualizarFornecedor(id, data) {
        this.validateId(id);
        this.validateFornecedor(data);
        if (!this.repositories.fornecedores.findById(id)) {
            return false;
        }
        return this.repositories.fornecedores.updateFornecedor(id, {
            ...data,
            nome: data.nome.trim(),
            documento: data.documento.trim(),
            email: data.email.trim(),
            telefone: data.telefone.trim(),
            pais: data.pais.trim() || (data.moeda === 'USD' ? 'Exterior' : 'Brasil')
        });
    }
    excluirFornecedor(id) {
        this.validateId(id);
        if (this.repositories.produtosEstoque.findByFornecedorId(id).length > 0) {
            throw new Error('Não é possível excluir um fornecedor que possui produtos vinculados no estoque.');
        }
        return this.repositories.fornecedores.deleteFornecedor(id);
    }
    // =========================
    // ESTOQUE & CÂMBIO USD/BRL
    // =========================
    listarProdutosEstoque() {
        return this.repositories.produtosEstoque.findAll();
    }
    buscarProdutoEstoque(id) {
        this.validateId(id);
        return this.repositories.produtosEstoque.findById(id);
    }
    listarProdutosEstoqueCritico() {
        return this.repositories.produtosEstoque.findEstoqueCritico();
    }
    async cadastrarProdutoEstoque(data) {
        const fornecedor = this.validateProdutoEstoque(data);
        let custoFinalBrl = Number(data.custo.toFixed(2));
        if (fornecedor.moeda === 'USD' && data.custo > 0) {
            const conversao = await this.cambioService.converterUsdParaBrl(data.custo);
            custoFinalBrl = conversao.valorBrl;
        }
        return this.repositories.produtosEstoque.createProduto({
            ...data,
            nome: data.nome.trim(),
            categoria: data.categoria.trim(),
            lote: data.lote.trim(),
            validade: data.validade.trim(),
            bula: data.bula.trim(),
            custo: custoFinalBrl
        });
    }
    async atualizarProdutoEstoque(id, data) {
        this.validateId(id);
        const fornecedor = this.validateProdutoEstoque(data);
        if (!this.repositories.produtosEstoque.findById(id)) {
            return false;
        }
        let custoFinalBrl = Number(data.custo.toFixed(2));
        if (fornecedor.moeda === 'USD' && data.custo > 0) {
            const conversao = await this.cambioService.converterUsdParaBrl(data.custo);
            custoFinalBrl = conversao.valorBrl;
        }
        return this.repositories.produtosEstoque.updateProduto(id, {
            ...data,
            nome: data.nome.trim(),
            categoria: data.categoria.trim(),
            lote: data.lote.trim(),
            validade: data.validade.trim(),
            bula: data.bula.trim(),
            custo: custoFinalBrl
        });
    }
    excluirProdutoEstoque(id) {
        this.validateId(id);
        return this.repositories.produtosEstoque.deleteProduto(id);
    }
}
exports.ClinicaService = ClinicaService;
