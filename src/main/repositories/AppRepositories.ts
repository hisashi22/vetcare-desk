
import { TutorRepository } from './TutorRepository';
import { PetRepository } from './PetRepository';
import { VeterinarioRepository } from './VeterinarioRepository';
import { ConsultaRepository } from './ConsultaRepository'; 
import { PrescricaoRepository } from './PrescricaoRepository'; 
import { ProdutoRepository } from './ProdutoRepository';

export class AppRepositories {
  public readonly tutores: TutorRepository;
  public readonly pets: PetRepository;
  public readonly veterinarios: VeterinarioRepository;
  public readonly consultas: ConsultaRepository;  
  public readonly prescricoes: PrescricaoRepository;
  public readonly produtos: ProdutoRepository;    

  constructor() {
    this.tutores = new TutorRepository();
    this.pets = new PetRepository();
    this.veterinarios = new VeterinarioRepository();
    this.consultas = new ConsultaRepository(); 
    this.prescricoes = new PrescricaoRepository(); 
    this.produtos = new ProdutoRepository();
  }
}