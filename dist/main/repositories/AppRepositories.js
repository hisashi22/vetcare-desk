"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppRepositories = void 0;
const TutorRepository_1 = require("./TutorRepository");
const PetRepository_1 = require("./PetRepository");
const FornecedorRepository_1 = require("./FornecedorRepository");
const ProdutoEstoqueRepository_1 = require("./ProdutoEstoqueRepository");
class AppRepositories {
    tutores;
    pets;
    fornecedores;
    produtosEstoque;
    constructor() {
        this.tutores = new TutorRepository_1.TutorRepository();
        this.pets = new PetRepository_1.PetRepository();
        this.fornecedores = new FornecedorRepository_1.FornecedorRepository();
        this.produtosEstoque = new ProdutoEstoqueRepository_1.ProdutoEstoqueRepository();
    }
}
exports.AppRepositories = AppRepositories;
