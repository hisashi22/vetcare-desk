import { TutorRepository } from './TutorRepository';
import { PetRepository } from './PetRepository';
import { FornecedorRepository } from './FornecedorRepository';
import { ProdutoEstoqueRepository } from './ProdutoEstoqueRepository';

export class AppRepositories {
  public readonly tutores: TutorRepository;
  public readonly pets: PetRepository;
  public readonly fornecedores: FornecedorRepository;
  public readonly produtosEstoque: ProdutoEstoqueRepository;

  constructor() {
    this.tutores = new TutorRepository();
    this.pets = new PetRepository();
    this.fornecedores = new FornecedorRepository();
    this.produtosEstoque = new ProdutoEstoqueRepository();
  }
}
