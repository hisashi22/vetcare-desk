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
        deletePet: (id) => electron_1.ipcRenderer.invoke('clinical:delete-pet', id)
    },
    stock: {
        listSuppliers: () => electron_1.ipcRenderer.invoke('stock:list-suppliers'),
        getSupplier: (id) => electron_1.ipcRenderer.invoke('stock:get-supplier', id),
        createSupplier: (data) => electron_1.ipcRenderer.invoke('stock:create-supplier', data),
        updateSupplier: (id, data) => electron_1.ipcRenderer.invoke('stock:update-supplier', id, data),
        deleteSupplier: (id) => electron_1.ipcRenderer.invoke('stock:delete-supplier', id),
        listProducts: () => electron_1.ipcRenderer.invoke('stock:list-products'),
        getProduct: (id) => electron_1.ipcRenderer.invoke('stock:get-product', id),
        listCriticalProducts: () => electron_1.ipcRenderer.invoke('stock:list-critical-products'),
        createProduct: (data) => electron_1.ipcRenderer.invoke('stock:create-product', data),
        updateProduct: (id, data) => electron_1.ipcRenderer.invoke('stock:update-product', id, data),
        deleteProduct: (id) => electron_1.ipcRenderer.invoke('stock:delete-product', id),
        getUsdRate: () => electron_1.ipcRenderer.invoke('stock:get-usd-rate')
    },
    notificacoes: {
        buscarVacinasPendentes: () => electron_1.ipcRenderer.invoke('notificacoes:buscar-vacinas-pendentes'),
        enviarNotificacoes: () => electron_1.ipcRenderer.invoke('notificacoes:enviar')
    }
};
electron_1.contextBridge.exposeInMainWorld('vetcare', vetcareAPI);
