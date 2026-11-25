"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const vetcareAPI = {
    auth: {
        login: (data) => electron_1.ipcRenderer.invoke('auth:login', data),
        logout: () => electron_1.ipcRenderer.invoke('auth:logout'),
        getCurrentUser: () => electron_1.ipcRenderer.invoke('auth:get-current-user'),
        hasPermission: (permission) => electron_1.ipcRenderer.invoke('auth:has-permission', permission),
        createUser: (data) => electron_1.ipcRenderer.invoke('auth:create-user', data),
        registerInitialAdmin: (data) => electron_1.ipcRenderer.invoke('auth:register-initial-admin', data)
    },
    clinical: {
        listTutors: () => electron_1.ipcRenderer.invoke('clinical:list-tutors'),
        getTutor: (id) => electron_1.ipcRenderer.invoke('clinical:get-tutor', id),
        getTutorByCpf: (cpf) => electron_1.ipcRenderer.invoke('clinical:get-tutor-by-cpf', cpf),
        createTutor: (data) => electron_1.ipcRenderer.invoke('clinical:create-tutor', data),
        updateTutor: (id, data) => electron_1.ipcRenderer.invoke('clinical:update-tutor', id, data),
        deleteTutor: (id) => electron_1.ipcRenderer.invoke('clinical:delete-tutor', id),
        buscarCep: (cep) => electron_1.ipcRenderer.invoke('clinical:buscar-cep', cep),
        listPets: () => electron_1.ipcRenderer.invoke('clinical:list-pets'),
        getPet: (id) => electron_1.ipcRenderer.invoke('clinical:get-pet', id),
        listPetsByTutor: (tutorId) => electron_1.ipcRenderer.invoke('clinical:list-pets-by-tutor', tutorId),
        createPet: (data) => electron_1.ipcRenderer.invoke('clinical:create-pet', data),
        updatePet: (id, data) => electron_1.ipcRenderer.invoke('clinical:update-pet', id, data),
        deletePet: (id) => electron_1.ipcRenderer.invoke('clinical:delete-pet', id),
        listVeterinarios: () => electron_1.ipcRenderer.invoke('clinical:list-veterinarios'),
        getVeterinario: (id) => electron_1.ipcRenderer.invoke('clinical:get-veterinario', id),
        createVeterinario: (data) => electron_1.ipcRenderer.invoke('clinical:create-veterinario', data),
        updateVeterinario: (id, data) => electron_1.ipcRenderer.invoke('clinical:update-veterinario', id, data),
        deleteVeterinario: (id) => electron_1.ipcRenderer.invoke('clinical:delete-veterinario', id),
        listConsultas: () => electron_1.ipcRenderer.invoke('clinical:list-consultas'),
        getConsulta: (id) => electron_1.ipcRenderer.invoke('clinical:get-consulta', id),
        listProntuarioByPet: (petId) => electron_1.ipcRenderer.invoke('clinical:list-prontuario-pet', petId),
        createConsulta: (data) => electron_1.ipcRenderer.invoke('clinical:create-consulta', data),
        updateConsulta: (id, data) => electron_1.ipcRenderer.invoke('clinical:update-consulta', id, data),
        deleteConsulta: (id) => electron_1.ipcRenderer.invoke('clinical:delete-consulta', id),
        listProdutos: () => electron_1.ipcRenderer.invoke('clinical:list-produtos'),
        listPrescricoesByConsulta: (consultaId) => electron_1.ipcRenderer.invoke('clinical:list-prescricoes-by-consulta', consultaId),
        createPrescricao: (data) => electron_1.ipcRenderer.invoke('clinical:create-prescricao', data),
        deletePrescricao: (id) => electron_1.ipcRenderer.invoke('clinical:delete-prescricao', id),
        buscarBula: (nome) => electron_1.ipcRenderer.invoke('clinical:buscar-bula', nome),
        salvarBulaProduto: (produtoId, nome) => electron_1.ipcRenderer.invoke('clinical:salvar-bula-produto', produtoId, nome)
    },
    notificacoes: {
        buscarVacinasPendentes: () => electron_1.ipcRenderer.invoke('notificacoes:buscar-vacinas-pendentes'),
        enviarNotificacoes: () => electron_1.ipcRenderer.invoke('notificacoes:enviar')
    }
};
electron_1.contextBridge.exposeInMainWorld('vetcare', vetcareAPI);
