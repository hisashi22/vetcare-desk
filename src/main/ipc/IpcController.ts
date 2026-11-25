import { SecurityValidator } from '../security/SecurityValidator';
import { NotificacaoVacinaService } from '../services/NotificacaoVacinaService';
import { AuthService, Permission } from '../security/AuthService';
import { ClinicaService } from '../services/ClinicaService';
import { CepService } from '../services/ApiServices';

import type {
  UserRole,
  Tutor,
  Pet,
  Veterinario,
  Consulta,
  PrescricaoAplicacao
} from '../../shared/types';

import type {
  IpcMain,
  IpcMainInvokeEvent,
  BrowserWindow
} from 'electron';

type TutorData = Omit<Tutor, 'id'>;
type PetData = Omit<Pet, 'id'>;
type VeterinarioData = Omit<Veterinario, 'id'>;
type ConsultaData = Omit<Consulta, 'id'>;
type PrescricaoData = Omit<PrescricaoAplicacao, 'id'>;

export class IpcController {
  private readonly authService: AuthService;
  private readonly clinicaService: ClinicaService;
  private readonly notificacaoVacinaService: NotificacaoVacinaService;
  private readonly cepService: CepService;
  private readonly getMainWindow: () => BrowserWindow | null;
  private readonly ipcMain: IpcMain;
  private registered = false;

  private readonly channels = [
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

  constructor(
    authService: AuthService,
    getMainWindow: () => BrowserWindow | null,
    ipcMain: IpcMain,
    clinicaService: ClinicaService = new ClinicaService(),
    notificacaoVacinaService: NotificacaoVacinaService = new NotificacaoVacinaService(),
    cepService: CepService = new CepService()
  ) {
    this.authService = authService;
    this.getMainWindow = getMainWindow;
    this.ipcMain = ipcMain;
    this.clinicaService = clinicaService;
    this.notificacaoVacinaService = notificacaoVacinaService;
    this.cepService = cepService;
  }

  private validateSender(event: IpcMainInvokeEvent): void {
    const mainWindow = this.getMainWindow();

    if (
      !mainWindow ||
      mainWindow.isDestroyed() ||
      event.sender !== mainWindow.webContents ||
      event.senderFrame !== mainWindow.webContents.mainFrame
    ) {
      throw new Error('Origem da chamada IPC não autorizada.');
    }
  }

  private validateClinicalAccess(): void {
    const usuario = this.authService.getCurrentUser();

    if (
      !usuario ||
      !this.authService.hasPermission('MANAGE_CLINICAL')
    ) {
      throw new Error('Acesso não autorizado ao módulo clínico.');
    }
  }

  private validateLoginData(data: unknown): void {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('Dados de login inválidos.');
    }

    const payload = data as Record<string, unknown>;

    if (
      typeof payload.email !== 'string' ||
      typeof payload.password !== 'string'
    ) {
      throw new Error('Dados de login inválidos.');
    }

    SecurityValidator.validateEmail(payload.email);
    SecurityValidator.validateRequired(payload.password, 'Senha');
  }

  private validateRegisterData(data: unknown): void {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('Dados de cadastro inválidos.');
    }

    const payload = data as Record<string, unknown>;

    if (
      typeof payload.nome !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.password !== 'string'
    ) {
      throw new Error('Dados de cadastro inválidos.');
    }

    SecurityValidator.validateRequired(payload.nome, 'Nome');
    SecurityValidator.validateEmail(payload.email);
    SecurityValidator.validatePassword(payload.password);
  }

  private validateId(id: unknown): number {
    if (
      typeof id !== 'number' ||
      !Number.isInteger(id) ||
      id <= 0
    ) {
      throw new Error('Identificador inválido.');
    }

    return id;
  }

  private validateTutorData(data: unknown): TutorData {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('Dados do tutor inválidos.');
    }

    const payload = data as Record<string, unknown>;

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
      nome: payload.nome as string,
      cpf: payload.cpf as string,
      telefone: payload.telefone as string,
      email: payload.email as string,
      cep: payload.cep as string,
      logradouro: payload.logradouro as string,
      bairro: payload.bairro as string,
      cidade: payload.cidade as string,
      uf: payload.uf as string
    };
  }

  private validatePetData(data: unknown): PetData {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('Dados do pet inválidos.');
    }

    const payload = data as Record<string, unknown>;

    if (
      typeof payload.tutorId !== 'number' ||
      typeof payload.nome !== 'string' ||
      (payload.especie !== 'CACHORRO' && payload.especie !== 'GATO') ||
      typeof payload.raca !== 'string' ||
      typeof payload.idade !== 'number' ||
      typeof payload.peso !== 'number' ||
      typeof payload.observacoes !== 'string'
    ) {
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

    private validateVeterinarioData(data: unknown): VeterinarioData {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('Dados do veterinário inválidos.');
    }

    const payload = data as Record<string, unknown>;

    if (
      typeof payload.usuarioId !== 'number' ||
      typeof payload.crmv !== 'string' ||
      typeof payload.especialidade !== 'string' ||
      typeof payload.telefone !== 'string'
    ) {
      throw new Error('Dados do veterinário inválidos.');
    }

    return {
      usuarioId: payload.usuarioId,
      crmv: payload.crmv,
      especialidade: payload.especialidade,
      telefone: payload.telefone
    };
  }

  private validateConsultaData(data: unknown): ConsultaData {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('Dados da consulta inválidos.');
    }

    const payload = data as Record<string, unknown>;

    if (
      typeof payload.petId !== 'number' ||
      typeof payload.veterinarioId !== 'number' ||
      typeof payload.data !== 'string' ||
      typeof payload.diagnostico !== 'string'
    ) {
      throw new Error('Dados da consulta inválidos.');
    }

    return {
      petId: payload.petId,
      veterinarioId: payload.veterinarioId,
      data: payload.data,
      diagnostico: payload.diagnostico
    };
  }

  private validatePrescricaoData(data: unknown): PrescricaoData {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('Dados da prescrição inválidos.');
    }

    const payload = data as Record<string, unknown>;
    const dataReforco = payload.dataReforco ?? null;

    if (
      typeof payload.consultaId !== 'number' ||
      typeof payload.produtoId !== 'number' ||
      (payload.tipo !== 'PRESCRICAO' && payload.tipo !== 'APLICACAO') ||
      typeof payload.descricao !== 'string' ||
      typeof payload.quantidade !== 'number' ||
      typeof payload.dataAplicacao !== 'string' ||
      (dataReforco !== null && typeof dataReforco !== 'string')
    ) {
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

  private authorizeClinical(event: IpcMainInvokeEvent): void {
    this.validateSender(event);
    this.validateClinicalAccess();
  }

  public registerHandlers(): void {
    if (this.registered) {
      throw new Error('Os canais IPC já foram registrados.');
    }

    // AUTENTICAÇÃO
    this.ipcMain.handle(
      'auth:register-initial-admin',
      (event: IpcMainInvokeEvent, data: unknown) => {
        this.validateSender(event);
        this.validateRegisterData(data);

        const payload = data as {
          nome: string;
          email: string;
          password: string;
        };

        return this.authService.registerInitialAdmin(
          payload.nome,
          payload.email,
          payload.password
        );
      }
    );

    this.ipcMain.handle(
      'auth:login',
      (event: IpcMainInvokeEvent, data: unknown) => {
        this.validateSender(event);
        this.validateLoginData(data);

        const payload = data as {
          email: string;
          password: string;
        };

        return this.authService.login(
          payload.email,
          payload.password
        );
      }
    );

    this.ipcMain.handle(
      'auth:logout',
      (event: IpcMainInvokeEvent) => {
        this.validateSender(event);
        this.authService.logout();
        return true;
      }
    );

    this.ipcMain.handle(
      'auth:get-current-user',
      (event: IpcMainInvokeEvent) => {
        this.validateSender(event);
        return this.authService.getCurrentUser();
      }
    );

    this.ipcMain.handle(
      'auth:has-permission',
      (event: IpcMainInvokeEvent, permission: unknown) => {
        this.validateSender(event);

        const validPermissions: Permission[] = [
          'MANAGE_USERS',
          'MANAGE_SUPPLIERS',
          'MANAGE_STOCK',
          'MANAGE_FINANCES',
          'MANAGE_CLINICAL',
          'DELETE_CRITICAL'
        ];

        if (
          typeof permission !== 'string' ||
          !validPermissions.includes(permission as Permission)
        ) {
          throw new Error('Permissão inválida.');
        }

        return this.authService.hasPermission(permission as Permission);
      }
    );

    this.ipcMain.handle(
      'auth:create-user',
      (event: IpcMainInvokeEvent, data: unknown) => {
        this.validateSender(event);
        this.validateRegisterData(data);

        if (!data || typeof data !== 'object' || Array.isArray(data)) {
          throw new Error('Dados de cadastro inválidos.');
        }

        const payload = data as {
          nome: string;
          email: string;
          password: string;
          role: unknown;
        };

        if (
          payload.role !== 'ADMIN' &&
          payload.role !== 'VETERINARIO'
        ) {
          throw new Error('Perfil de usuário inválido.');
        }

        return this.authService.createUser(
          payload.nome,
          payload.email,
          payload.password,
          payload.role as UserRole
        );
      }
    );

    // TUTORES & VIACEP
    this.ipcMain.handle(
      'clinical:list-tutors',
      (event: IpcMainInvokeEvent) => {
        this.authorizeClinical(event);
        return this.clinicaService.listarTutores();
      }
    );

    this.ipcMain.handle(
      'clinical:get-tutor',
      (event: IpcMainInvokeEvent, id: unknown) => {
        this.authorizeClinical(event);
        return this.clinicaService.buscarTutor(this.validateId(id));
      }
    );

    this.ipcMain.handle(
      'clinical:get-tutor-by-cpf',
      (event: IpcMainInvokeEvent, cpf: unknown) => {
        this.authorizeClinical(event);

        if (typeof cpf !== 'string') {
          throw new Error('CPF inválido.');
        }

        return this.clinicaService.buscarTutorPorCpf(cpf);
      }
    );

    this.ipcMain.handle(
      'clinical:create-tutor',
      (event: IpcMainInvokeEvent, data: unknown) => {
        this.authorizeClinical(event);
        return this.clinicaService.cadastrarTutor(
          this.validateTutorData(data)
        );
      }
    );

    this.ipcMain.handle(
      'clinical:update-tutor',
      (event: IpcMainInvokeEvent, id: unknown, data: unknown) => {
        this.authorizeClinical(event);

        return this.clinicaService.atualizarTutor(
          this.validateId(id),
          this.validateTutorData(data)
        );
      }
    );

    this.ipcMain.handle(
      'clinical:delete-tutor',
      (event: IpcMainInvokeEvent, id: unknown) => {
        this.authorizeClinical(event);
        return this.clinicaService.excluirTutor(this.validateId(id));
      }
    );

    this.ipcMain.handle(
      'clinical:buscar-cep',
      async (event: IpcMainInvokeEvent, cep: unknown) => {
        this.authorizeClinical(event);

        if (typeof cep !== 'string') {
          throw new Error('CEP inválido.');
        }

        return this.cepService.buscarEnderecoPorCep(cep);
      }
    );

    // PETS
    this.ipcMain.handle(
      'clinical:list-pets',
      (event: IpcMainInvokeEvent) => {
        this.authorizeClinical(event);
        return this.clinicaService.listarPets();
      }
    );

    this.ipcMain.handle(
      'clinical:get-pet',
      (event: IpcMainInvokeEvent, id: unknown) => {
        this.authorizeClinical(event);
        return this.clinicaService.buscarPet(this.validateId(id));
      }
    );

    this.ipcMain.handle(
      'clinical:list-pets-by-tutor',
      (event: IpcMainInvokeEvent, tutorId: unknown) => {
        this.authorizeClinical(event);

        return this.clinicaService.listarPetsDoTutor(
          this.validateId(tutorId)
        );
      }
    );

    this.ipcMain.handle(
      'clinical:create-pet',
      (event: IpcMainInvokeEvent, data: unknown) => {
        this.authorizeClinical(event);
        return this.clinicaService.cadastrarPet(
          this.validatePetData(data)
        );
      }
    );

    this.ipcMain.handle(
      'clinical:update-pet',
      (event: IpcMainInvokeEvent, id: unknown, data: unknown) => {
        this.authorizeClinical(event);

        return this.clinicaService.atualizarPet(
          this.validateId(id),
          this.validatePetData(data)
        );
      }
    );

    this.ipcMain.handle(
      'clinical:delete-pet',
      (event: IpcMainInvokeEvent, id: unknown) => {
        this.authorizeClinical(event);
        return this.clinicaService.excluirPet(this.validateId(id));
      }
    );

       // VETERINÁRIOS
    this.ipcMain.handle(
      'clinical:list-veterinarios',
      (event: IpcMainInvokeEvent) => {
        this.authorizeClinical(event);
        return this.clinicaService.listarVeterinarios();
      }
    );

    this.ipcMain.handle(
      'clinical:get-veterinario',
      (event: IpcMainInvokeEvent, id: unknown) => {
        this.authorizeClinical(event);
        return this.clinicaService.buscarVeterinario(this.validateId(id));
      }
    );

    this.ipcMain.handle(
      'clinical:create-veterinario',
      (event: IpcMainInvokeEvent, data: unknown) => {
        this.authorizeClinical(event);
        return this.clinicaService.cadastrarVeterinario(
          this.validateVeterinarioData(data)
        );
      }
    );

    this.ipcMain.handle(
      'clinical:update-veterinario',
      (event: IpcMainInvokeEvent, id: unknown, data: unknown) => {
        this.authorizeClinical(event);
        return this.clinicaService.atualizarVeterinario(
          this.validateId(id),
          this.validateVeterinarioData(data)
        );
      }
    );

    this.ipcMain.handle(
      'clinical:delete-veterinario',
      (event: IpcMainInvokeEvent, id: unknown) => {
        this.authorizeClinical(event);
        return this.clinicaService.excluirVeterinario(this.validateId(id));
      }
    );

    // CONSULTAS / PRONTUÁRIO
    this.ipcMain.handle(
      'clinical:list-consultas',
      (event: IpcMainInvokeEvent) => {
        this.authorizeClinical(event);
        return this.clinicaService.listarConsultas();
      }
    );

    this.ipcMain.handle(
      'clinical:get-consulta',
      (event: IpcMainInvokeEvent, id: unknown) => {
        this.authorizeClinical(event);
        return this.clinicaService.buscarConsulta(this.validateId(id));
      }
    );

    this.ipcMain.handle(
      'clinical:list-prontuario-pet',
      (event: IpcMainInvokeEvent, petId: unknown) => {
        this.authorizeClinical(event);
        return this.clinicaService.listarProntuarioDoPet(
          this.validateId(petId)
        );
      }
    );

    this.ipcMain.handle(
      'clinical:create-consulta',
      (event: IpcMainInvokeEvent, data: unknown) => {
        this.authorizeClinical(event);
        return this.clinicaService.registrarConsulta(
          this.validateConsultaData(data)
        );
      }
    );

    this.ipcMain.handle(
      'clinical:update-consulta',
      (event: IpcMainInvokeEvent, id: unknown, data: unknown) => {
        this.authorizeClinical(event);
        return this.clinicaService.atualizarConsulta(
          this.validateId(id),
          this.validateConsultaData(data)
        );
      }
    );

    this.ipcMain.handle(
      'clinical:delete-consulta',
      (event: IpcMainInvokeEvent, id: unknown) => {
        this.authorizeClinical(event);
        return this.clinicaService.excluirConsulta(this.validateId(id));
      }
    );

    // PRESCRIÇÕES (baixa/estorno de estoque)
    this.ipcMain.handle(
      'clinical:list-prescricoes-by-consulta',
      (event: IpcMainInvokeEvent, consultaId: unknown) => {
        this.authorizeClinical(event);
        return this.clinicaService.listarPrescricoesDaConsulta(
          this.validateId(consultaId)
        );
      }
    );

    this.ipcMain.handle(
      'clinical:create-prescricao',
      (event: IpcMainInvokeEvent, data: unknown) => {
        this.authorizeClinical(event);
        return this.clinicaService.registrarPrescricao(
          this.validatePrescricaoData(data)
        );
      }
    );

    this.ipcMain.handle(
      'clinical:delete-prescricao',
      (event: IpcMainInvokeEvent, id: unknown) => {
        this.authorizeClinical(event);
        return this.clinicaService.excluirPrescricao(this.validateId(id));
      }
    );

    // BULAS (OpenFDA)
    this.ipcMain.handle(
      'clinical:buscar-bula',
      async (event: IpcMainInvokeEvent, nome: unknown) => {
        this.authorizeClinical(event);

        if (typeof nome !== 'string') {
          throw new Error('Nome do medicamento inválido.');
        }

        return this.clinicaService.buscarBula(nome);
      }
    );

    this.ipcMain.handle(
      'clinical:salvar-bula-produto',
      async (event: IpcMainInvokeEvent, produtoId: unknown, nome: unknown) => {
        this.authorizeClinical(event);

        if (typeof nome !== 'string') {
          throw new Error('Nome do medicamento inválido.');
        }

        return this.clinicaService.salvarBulaDoProduto(
          this.validateId(produtoId),
          nome
        );
      }
    );
       
      this.ipcMain.handle(
      'clinical:list-produtos',
      (event: IpcMainInvokeEvent) => {
        this.authorizeClinical(event);
        return this.clinicaService.listarProdutos();
      }
    );  

    // NOTIFICAÇÕES BREVO
    this.ipcMain.handle(
      'notificacoes:buscar-vacinas-pendentes',
      (event: IpcMainInvokeEvent) => {
        this.authorizeClinical(event);
        return this.notificacaoVacinaService.buscarVacinasPendentes();
      }
    );

    this.ipcMain.handle(
      'notificacoes:enviar',
      async (event: IpcMainInvokeEvent) => {
        this.authorizeClinical(event);
        return this.notificacaoVacinaService.enviarNotificacoes();
      }
    );

    this.registered = true;
  }

  public removeHandlers(): void {
    for (const channel of this.channels) {
      this.ipcMain.removeHandler(channel);
    }

    this.registered = false;
  }
}