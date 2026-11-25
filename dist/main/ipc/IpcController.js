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
        'clinical:list-veterinarios',
        'clinical:get-veterinario',
        'clinical:create-veterinario',
        'clinical:update-veterinario',
        'clinical:delete-veterinario',
        'clinical:list-consultas',
        'clinical:get-consulta',
        'clinical:list-prontuario-pet',
        'clinical:create-consulta',
        'clinical:update-consulta',
        'clinical:delete-consulta',
        'clinical:list-prescricoes-by-consulta',
        'clinical:create-prescricao',
        'clinical:delete-prescricao',
        'clinical:buscar-bula',
        'clinical:salvar-bula-produto',
        'notificacoes:buscar-vacinas-pendentes',
        'notificacoes:enviar'
    ];
    constructor(authService, getMainWindow, ipcMain, clinicaService = new ClinicaService_1.ClinicaService(), notificacaoVacinaService = new NotificacaoVacinaService_1.NotificacaoVacinaService(), cepService = new ApiServices_1.CepService()) {
        this.authService = authService;
        this.getMainWindow = getMainWindow;
        this.ipcMain = ipcMain;
        this.clinicaService = clinicaService;
        this.notificacaoVacinaService = notificacaoVacinaService;
        this.cepService = cepService;
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
    validateClinicalAccess() {
        const usuario = this.authService.getCurrentUser();
        if (!usuario ||
            !this.authService.hasPermission('MANAGE_CLINICAL')) {
            throw new Error('Acesso não autorizado ao módulo clínico.');
        }
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
    validateVeterinarioData(data) {
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw new Error('Dados do veterinário inválidos.');
        }
        const payload = data;
        if (typeof payload.usuarioId !== 'number' ||
            typeof payload.crmv !== 'string' ||
            typeof payload.especialidade !== 'string' ||
            typeof payload.telefone !== 'string') {
            throw new Error('Dados do veterinário inválidos.');
        }
        return {
            usuarioId: payload.usuarioId,
            crmv: payload.crmv,
            especialidade: payload.especialidade,
            telefone: payload.telefone
        };
    }
    validateConsultaData(data) {
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw new Error('Dados da consulta inválidos.');
        }
        const payload = data;
        if (typeof payload.petId !== 'number' ||
            typeof payload.veterinarioId !== 'number' ||
            typeof payload.data !== 'string' ||
            typeof payload.diagnostico !== 'string') {
            throw new Error('Dados da consulta inválidos.');
        }
        return {
            petId: payload.petId,
            veterinarioId: payload.veterinarioId,
            data: payload.data,
            diagnostico: payload.diagnostico
        };
    }
    validatePrescricaoData(data) {
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw new Error('Dados da prescrição inválidos.');
        }
        const payload = data;
        const dataReforco = payload.dataReforco ?? null;
        if (typeof payload.consultaId !== 'number' ||
            typeof payload.produtoId !== 'number' ||
            (payload.tipo !== 'PRESCRICAO' && payload.tipo !== 'APLICACAO') ||
            typeof payload.descricao !== 'string' ||
            typeof payload.quantidade !== 'number' ||
            typeof payload.dataAplicacao !== 'string' ||
            (dataReforco !== null && typeof dataReforco !== 'string')) {
            throw new Error('Dados da prescrição inválidos.');
        }
        return {
            consultaId: payload.consultaId,
            produtoId: payload.produtoId,
            tipo: payload.tipo,
            descricao: payload.descricao,
            quantidade: payload.quantidade,
            dataAplicacao: payload.dataAplicacao,
            dataReforco
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
        // VETERINÁRIOS
        this.ipcMain.handle('clinical:list-veterinarios', (event) => {
            this.authorizeClinical(event);
            return this.clinicaService.listarVeterinarios();
        });
        this.ipcMain.handle('clinical:get-veterinario', (event, id) => {
            this.authorizeClinical(event);
            return this.clinicaService.buscarVeterinario(this.validateId(id));
        });
        this.ipcMain.handle('clinical:create-veterinario', (event, data) => {
            this.authorizeClinical(event);
            return this.clinicaService.cadastrarVeterinario(this.validateVeterinarioData(data));
        });
        this.ipcMain.handle('clinical:update-veterinario', (event, id, data) => {
            this.authorizeClinical(event);
            return this.clinicaService.atualizarVeterinario(this.validateId(id), this.validateVeterinarioData(data));
        });
        this.ipcMain.handle('clinical:delete-veterinario', (event, id) => {
            this.authorizeClinical(event);
            return this.clinicaService.excluirVeterinario(this.validateId(id));
        });
        // CONSULTAS / PRONTUÁRIO
        this.ipcMain.handle('clinical:list-consultas', (event) => {
            this.authorizeClinical(event);
            return this.clinicaService.listarConsultas();
        });
        this.ipcMain.handle('clinical:get-consulta', (event, id) => {
            this.authorizeClinical(event);
            return this.clinicaService.buscarConsulta(this.validateId(id));
        });
        this.ipcMain.handle('clinical:list-prontuario-pet', (event, petId) => {
            this.authorizeClinical(event);
            return this.clinicaService.listarProntuarioDoPet(this.validateId(petId));
        });
        this.ipcMain.handle('clinical:create-consulta', (event, data) => {
            this.authorizeClinical(event);
            return this.clinicaService.registrarConsulta(this.validateConsultaData(data));
        });
        this.ipcMain.handle('clinical:update-consulta', (event, id, data) => {
            this.authorizeClinical(event);
            return this.clinicaService.atualizarConsulta(this.validateId(id), this.validateConsultaData(data));
        });
        this.ipcMain.handle('clinical:delete-consulta', (event, id) => {
            this.authorizeClinical(event);
            return this.clinicaService.excluirConsulta(this.validateId(id));
        });
        // PRESCRIÇÕES (baixa/estorno de estoque)
        this.ipcMain.handle('clinical:list-prescricoes-by-consulta', (event, consultaId) => {
            this.authorizeClinical(event);
            return this.clinicaService.listarPrescricoesDaConsulta(this.validateId(consultaId));
        });
        this.ipcMain.handle('clinical:create-prescricao', (event, data) => {
            this.authorizeClinical(event);
            return this.clinicaService.registrarPrescricao(this.validatePrescricaoData(data));
        });
        this.ipcMain.handle('clinical:delete-prescricao', (event, id) => {
            this.authorizeClinical(event);
            return this.clinicaService.excluirPrescricao(this.validateId(id));
        });
        // BULAS (OpenFDA)
        this.ipcMain.handle('clinical:buscar-bula', async (event, nome) => {
            this.authorizeClinical(event);
            if (typeof nome !== 'string') {
                throw new Error('Nome do medicamento inválido.');
            }
            return this.clinicaService.buscarBula(nome);
        });
        this.ipcMain.handle('clinical:salvar-bula-produto', async (event, produtoId, nome) => {
            this.authorizeClinical(event);
            if (typeof nome !== 'string') {
                throw new Error('Nome do medicamento inválido.');
            }
            return this.clinicaService.salvarBulaDoProduto(this.validateId(produtoId), nome);
        });
        this.ipcMain.handle('clinical:list-produtos', (event) => {
            this.authorizeClinical(event);
            return this.clinicaService.listarProdutos();
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
