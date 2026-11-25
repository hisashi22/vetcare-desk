"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppRepositories = void 0;
const TutorRepository_1 = require("./TutorRepository");
const PetRepository_1 = require("./PetRepository");
const VeterinarioRepository_1 = require("./VeterinarioRepository");
const ConsultaRepository_1 = require("./ConsultaRepository");
const PrescricaoRepository_1 = require("./PrescricaoRepository");
const ProdutoRepository_1 = require("./ProdutoRepository");
class AppRepositories {
    tutores;
    pets;
    veterinarios;
    consultas;
    prescricoes;
    produtos;
    constructor() {
        this.tutores = new TutorRepository_1.TutorRepository();
        this.pets = new PetRepository_1.PetRepository();
        this.veterinarios = new VeterinarioRepository_1.VeterinarioRepository();
        this.consultas = new ConsultaRepository_1.ConsultaRepository();
        this.prescricoes = new PrescricaoRepository_1.PrescricaoRepository();
        this.produtos = new ProdutoRepository_1.ProdutoRepository();
    }
}
exports.AppRepositories = AppRepositories;
