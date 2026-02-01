import { Router } from "express";
import { AttributesController } from "../controllers/attributesController";
import { AttributesService } from "../services/attributeService";

const service = new AttributesService();

export function createAttributeRouter(controller: AttributesController) { 
    const router = Router();

    router.get('/attributes/:characterId', (req, res) => controller.getAttributes(req, res));
    router.put('/attributes/:characterId', (req, res) => controller.updateAttributes(req, res));

    return router;
}