import { CharacterRepo } from "../repositories/characterRepo";
export class CharacterService {
    constructor() {
        this.charactersRepo = new CharacterRepo();
    }
    private charactersRepo: CharacterRepo;

    async createCharacter() {
        return this.charactersRepo.createCharacter();
    }
}