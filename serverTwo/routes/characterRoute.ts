import { Router } from "express";
import { CharacterController } from "../controllers/characterController";
import { CharacterService } from "../services/characterService";

const service = new CharacterService();
const controller = new CharacterController(service);

export function createCharacterRouter(controller: CharacterController) {
    const router = Router();

    router.get('/character/newCharacter', (res) => controller.newCharacter(res));

    return router;
}