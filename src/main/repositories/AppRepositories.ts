
import { TutorRepository } from './TutorRepository';
import { PetRepository } from './PetRepository';

export class AppRepositories {
  public readonly tutores: TutorRepository;
  public readonly pets: PetRepository;

  constructor() {
    this.tutores = new TutorRepository();
    this.pets = new PetRepository();
  }
}
