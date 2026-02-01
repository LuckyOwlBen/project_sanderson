import { Request, Response } from "express";
import { CharacterService } from "../services/characterService";

export class CharacterController {
    constructor(private characterService: CharacterService) { }

    async newCharacter(res: Response): Promise<void> {
        const newChar = await this.characterService.createCharacter();
        res.status(201).json(newChar);
    }
}