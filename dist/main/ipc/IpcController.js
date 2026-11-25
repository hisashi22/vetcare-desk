"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpcController = void 0;
const SecurityValidator_1 = require("../security/SecurityValidator");
const NotificacaoVacinaService_1 = require("../services/NotificacaoVacinaService");
const ClinicaService_1 = require("../services/ClinicaService");
const ApiServices_1 = require("../services/ApiServices");
class IpcController {
    authService;
    clinicaService;
    notificacaoVacinaService;
    cepService;
    cambioService;
    getMainWindow;
    ipcMain;
    registered = false;
    channels = [
        'auth:register-initial-admin',
        'auth:login',
        'auth:logout',
        'auth:get-current-user',
        'auth:has-permission',
        'auth:create-user',
        'clinical:list-tutors',
        'clinical:get-tutor',
        'clinical:get-tutor-by-cpf',
        'clinical:create-tutor',
        'clinical:update-tutor',
        'clinical:delete-tutor',
        'clinical:buscar-cep',
        'clinical:list-pets',
        'clinical:get-pet',
        'clinical:list-pets-by-tutor',
        'clinical:create-pet',
        'clinical:update-pet',
        'clinical:delete-pet',
        'stock:list-suppliers',
        'stock:get-supplier',
        'stock:create-supplier',
        'stock:update-supplier',
        'stock:delete-supplier',
        'stock:list-products',
        'stock:get-product',
        'stock:list-critical-products',
        'stock:create-product',
        'stock:update-product',
        'stock:delete-product',
        'stock:get-usd-rate',
        'notificacoes:buscar-vacinas-pendentes',
        'notificacoes:enviar'
    ];
    constructor(authService, getMainWindow, ipcMain, clinicaService = new ClinicaService_1.ClinicaService(), notificacaoVacinaService = new NotificacaoVacinaService_1.NotificacaoVacinaService(), cepService = new ApiServices_1.CepService(), cambioService = new ApiServices_1.CambioService()) {
        this.authService = authService;
        this.getMainWindow = getMainWindow;
        this.ipcMain = ipcMain;
        this.clinicaService = clinicaService;
        this.notificacaoVacinaService = notificacaoVacinaService;
        this.cepService = cepService;
        this.cambioService = cambioService;
    }
    validateSender(event) {
        const mainWindow = this.getMainWindow();
        if (!mainWindow ||
            mainWindow.isDestroyed() ||
            event.sender !== mainWindow.webContents ||
            event.senderFrame !== mainWindow.webContents.mainFrame) {
            throw new Error('Origem da chamada IPC não autorizada.');
        }
    }
    validateAuthenticated() {
        const usuario = this.authService.getCurrentUser();
        if (!usuario) {
            throw new Error('Usuário não autenticado.');
        }
    }
    validatePermission(permission, message) {
        const usuario = this.authService.getCurrentUser();
        if (!usuario || !this.authService.hasPermission(permission)) {
            throw new Error(message);
        }
    }
    validateClinicalAccess() {
        this.validatePermission('MANAGE_CLINICAL', 'Acesso não autorizado ao módulo clínico.');
    }
    validateLoginData(data) {
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw new Error('Dados de login inválidos.');
        }
        const payload = data;
        if (typeof payload.email !== 'string' ||
            typeof payload.password !== 'string') {
            throw new Error('Dados de login inválidos.');
        }
        SecurityValidator_1.SecurityValidator.validateEmail(payload.email);
        SecurityValidator_1.SecurityValidator.validateRequired(payload.password, 'Senha');
    }
    validateRegisterData(data) {
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw new Error('Dados de cadastro inválidos.');
        }
        const payload = data;
        if (typeof payload.nome !== 'string' ||
            typeof payload.email !== 'string' ||
            typeof payload.password !== 'string') {
            throw new Error('Dados de cadastro inválidos.');
        }
        SecurityValidator_1.SecurityValidator.validateRequired(payload.nome, 'Nome');
        SecurityValidator_1.SecurityValidator.validateEmail(payload.email);
        SecurityValidator_1.SecurityValidator.validatePassword(payload.password);
    }
    validateId(id) {
        if (typeof id !== 'number' ||
            !Number.isInteger(id) ||
            id <= 0) {
            throw new Error('Identificador inválido.');
        }
        return id;
    }
    validateTutorData(data) {
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw new Error('Dados do tutor inválidos.');
        }
        const payload = data;
        const fields = [
            'nome',
            'cpf',
            'telefone',
            'email',
            'cep',
            'logradouro',
            'bairro',
            'cidade',
            'uf'
        ];
        for (const field of fields) {
            if (typeof payload[field] !== 'string') {
                throw new Error(`Campo ${field} inválido.`);
            }
        }
        return {
            nome: payload.nome,
            cpf: payload.cpf,
            telefone: payload.telefone,
            email: payload.email,
            cep: payload.cep,
            logradouro: payload.logradouro,
            bairro: payload.bairro,
            cidade: payload.cidade,
            uf: payload.uf
        };
    }
    validatePetData(data) {
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw new Error('Dados do pet inválidos.');
        }
        const payload = data;
        if (typeof payload.tutorId !== 'number' ||
            typeof payload.nome !== 'string' ||
            (payload.especie !== 'CACHORRO' && payload.especie !== 'GATO') ||
            typeof payload.raca !== 'string' ||
            typeof payload.idade !== 'number' ||
            typeof payload.peso !== 'number' ||
            typeof payload.observacoes !== 'string') {
            throw new Error('Dados do pet inválidos.');
        }
        return {
            tutorId: payload.tutorId,
            nome: payload.nome,
            especie: payload.especie,
            raca: payload.raca,
            idade: payload.idade,
            peso: payload.peso,
            observacoes: payload.observacoes
        };
    }
    validateFornecedorData(data) {
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw new Error('Dados do fornecedor inválidos.');
        }
        const payload = data;
        if (typeof payload.nome !== 'string' ||
            typeof payload.documento !== 'string' ||
            typeof payload.email !== 'string' ||
            typeof payload.telefone !== 'string' ||
            typeof payload.pais !== 'string' ||
            (payload.moeda !== 'BRL' && payload.moeda !== 'USD')) {
            throw new Error('Dados do fornecedor inválidos.');
        }
        return {
            nome: payload.nome,
            documento: payload.documento,
            email: payload.email,
            telefone: payload.telefone,
            pais: payload.pais,
            moeda: payload.moeda
        };
    }
    validateProdutoEstoqueData(data) {
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw new Error('Dados do produto inválidos.');
        }
        const payload = data;
        if (typeof payload.fornecedorId !== 'number' ||
            typeof payload.nome !== 'string' ||
            typeof payload.categoria !== 'string' ||
            typeof payload.lote !== 'string' ||
            typeof payload.validade !== 'string' ||
            typeof payload.quantidade !== 'number' ||
            typeof payload.estoqueMinimo !== 'number' ||
            typeof payload.bula !== 'string' ||
            typeof payload.custo !== 'number') {
            throw new Error('Dados do produto inválidos.');
        }
        return {
            fornecedorId: payload.fornecedorId,
            nome: payload.nome,
            categoria: payload.categoria,
            lote: payload.lote,
            validade: payload.validade,
            quantidade: payload.quantidade,
            estoqueMinimo: payload.estoqueMinimo,
            bula: payload.bula,
            custo: payload.custo
        };
    }
    authorizeClinical(event) {
        this.validateSender(event);
        this.validateClinicalAccess();
    }
    registerHandlers() {
        if (this.registered) {
            throw new Error('Os canais IPC já foram registrados.');
        }
        // AUTENTICAÇÃO
        this.ipcMain.handle('auth:register-initial-admin', (event, data) => {
            this.validateSender(event);
            this.validateRegisterData(data);
            const payload = data;
            return this.authService.registerInitialAdmin(payload.nome, payload.email, payload.password);
        });
        this.ipcMain.handle('auth:login', (event, data) => {
            this.validateSender(event);
            this.validateLoginData(data);
            const payload = data;
            return this.authService.login(payload.email, payload.password);
        });
        this.ipcMain.handle('auth:logout', (event) => {
            this.validateSender(event);
            this.authService.logout();
            return true;
        });
        this.ipcMain.handle('auth:get-current-user', (event) => {
            this.validateSender(event);
            return this.authService.getCurrentUser();
        });
        this.ipcMain.handle('auth:has-permission', (event, permission) => {
            this.validateSender(event);
            const validPermissions = [
                'MANAGE_USERS',
                'MANAGE_SUPPLIERS',
                'MANAGE_STOCK',
                'MANAGE_FINANCES',
                'MANAGE_CLINICAL',
                'DELETE_CRITICAL'
            ];
            if (typeof permission !== 'string' ||
                !validPermissions.includes(permission)) {
                throw new Error('Permissão inválida.');
            }
            return this.authService.hasPermission(permission);
        });
        this.ipcMain.handle('auth:create-user', (event, data) => {
            this.validateSender(event);
            this.validateRegisterData(data);
            if (!data || typeof data !== 'object' || Array.isArray(data)) {
                throw new Error('Dados de cadastro inválidos.');
            }
            const payload = data;
            if (payload.role !== 'ADMIN' &&
                payload.role !== 'VETERINARIO') {
                throw new Error('Perfil de usuário inválido.');
            }
            return this.authService.createUser(payload.nome, payload.email, payload.password, payload.role);
        });
        // TUTORES & VIACEP
        this.ipcMain.handle('clinical:list-tutors', (event) => {
            this.authorizeClinical(event);
            return this.clinicaService.listarTutores();
        });
        this.ipcMain.handle('clinical:get-tutor', (event, id) => {
            this.authorizeClinical(event);
            return this.clinicaService.buscarTutor(this.validateId(id));
        });
        this.ipcMain.handle('clinical:get-tutor-by-cpf', (event, cpf) => {
            this.authorizeClinical(event);
            if (typeof cpf !== 'string') {
                throw new Error('CPF inválido.');
            }
            return this.clinicaService.buscarTutorPorCpf(cpf);
        });
        this.ipcMain.handle('clinical:create-tutor', (event, data) => {
            this.authorizeClinical(event);
            return this.clinicaService.cadastrarTutor(this.validateTutorData(data));
        });
        this.ipcMain.handle('clinical:update-tutor', (event, id, data) => {
            this.authorizeClinical(event);
            return this.clinicaService.atualizarTutor(this.validateId(id), this.validateTutorData(data));
        });
        this.ipcMain.handle('clinical:delete-tutor', (event, id) => {
            this.authorizeClinical(event);
            return this.clinicaService.excluirTutor(this.validateId(id));
        });
        this.ipcMain.handle('clinical:buscar-cep', async (event, cep) => {
            this.authorizeClinical(event);
            if (typeof cep !== 'string') {
                throw new Error('CEP inválido.');
            }
            return this.cepService.buscarEnderecoPorCep(cep);
        });
        // PETS
        this.ipcMain.handle('clinical:list-pets', (event) => {
            this.authorizeClinical(event);
            return this.clinicaService.listarPets();
        });
        this.ipcMain.handle('clinical:get-pet', (event, id) => {
            this.authorizeClinical(event);
            return this.clinicaService.buscarPet(this.validateId(id));
        });
        this.ipcMain.handle('clinical:list-pets-by-tutor', (event, tutorId) => {
            this.authorizeClinical(event);
            return this.clinicaService.listarPetsDoTutor(this.validateId(tutorId));
        });
        this.ipcMain.handle('clinical:create-pet', (event, data) => {
            this.authorizeClinical(event);
            return this.clinicaService.cadastrarPet(this.validatePetData(data));
        });
        this.ipcMain.handle('clinical:update-pet', (event, id, data) => {
            this.authorizeClinical(event);
            return this.clinicaService.atualizarPet(this.validateId(id), this.validatePetData(data));
        });
        this.ipcMain.handle('clinical:delete-pet', (event, id) => {
            this.authorizeClinical(event);
            return this.clinicaService.excluirPet(this.validateId(id));
        });
        // FORNECEDORES
        this.ipcMain.handle('stock:list-suppliers', (event) => {
            this.validateSender(event);
            this.validateAuthenticated();
            return this.clinicaService.listarFornecedores();
        });
        this.ipcMain.handle('stock:get-supplier', (event, id) => {
            this.validateSender(event);
            this.validateAuthenticated();
            return this.clinicaService.buscarFornecedor(this.validateId(id));
        });
        this.ipcMain.handle('stock:create-supplier', (event, data) => {
            this.validateSender(event);
            this.validatePermission('MANAGE_SUPPLIERS', 'Apenas administradores podem cadastrar fornecedores.');
            return this.clinicaService.cadastrarFornecedor(this.validateFornecedorData(data));
        });
        this.ipcMain.handle('stock:update-supplier', (event, id, data) => {
            this.validateSender(event);
            this.validatePermission('MANAGE_SUPPLIERS', 'Apenas administradores podem editar fornecedores.');
            return this.clinicaService.atualizarFornecedor(this.validateId(id), this.validateFornecedorData(data));
        });
        this.ipcMain.handle('stock:delete-supplier', (event, id) => {
            this.validateSender(event);
            this.validatePermission('DELETE_CRITICAL', 'Apenas administradores podem excluir fornecedores.');
            return this.clinicaService.excluirFornecedor(this.validateId(id));
        });
        // ESTOQUE & CÂMBIO USD/BRL
        this.ipcMain.handle('stock:list-products', (event) => {
            this.validateSender(event);
            this.validateAuthenticated();
            return this.clinicaService.listarProdutosEstoque();
        });
        this.ipcMain.handle('stock:get-product', (event, id) => {
            this.validateSender(event);
            this.validateAuthenticated();
            return this.clinicaService.buscarProdutoEstoque(this.validateId(id));
        });
        this.ipcMain.handle('stock:list-critical-products', (event) => {
            this.validateSender(event);
            this.validateAuthenticated();
            return this.clinicaService.listarProdutosEstoqueCritico();
        });
        this.ipcMain.handle('stock:create-product', async (event, data) => {
            this.validateSender(event);
            this.validatePermission('MANAGE_STOCK', 'Acesso não autorizado para gerenciar estoque.');
            return this.clinicaService.cadastrarProdutoEstoque(this.validateProdutoEstoqueData(data));
        });
        this.ipcMain.handle('stock:update-product', async (event, id, data) => {
            this.validateSender(event);
            this.validatePermission('MANAGE_STOCK', 'Acesso não autorizado para gerenciar estoque.');
            return this.clinicaService.atualizarProdutoEstoque(this.validateId(id), this.validateProdutoEstoqueData(data));
        });
        this.ipcMain.handle('stock:delete-product', (event, id) => {
            this.validateSender(event);
            this.validatePermission('DELETE_CRITICAL', 'Apenas administradores podem excluir itens do estoque.');
            return this.clinicaService.excluirProdutoEstoque(this.validateId(id));
        });
        this.ipcMain.handle('stock:get-usd-rate', async (event) => {
            this.validateSender(event);
            this.validateAuthenticated();
            return this.cambioService.obterCotacaoDolar();
        });
        // NOTIFICAÇÕES BREVO
        this.ipcMain.handle('notificacoes:buscar-vacinas-pendentes', (event) => {
            this.authorizeClinical(event);
            return this.notificacaoVacinaService.buscarVacinasPendentes();
        });
        this.ipcMain.handle('notificacoes:enviar', async (event) => {
            this.authorizeClinical(event);
            return this.notificacaoVacinaService.enviarNotificacoes();
        });
        this.registered = true;
    }
    removeHandlers() {
        for (const channel of this.channels) {
            this.ipcMain.removeHandler(channel);
        }
        this.registered = false;
    }
}
exports.IpcController = IpcController;
