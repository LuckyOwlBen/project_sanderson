import express from "express";
import {Request, Response} from "express";
import { AttributesService } from "../services/attributeService";
import { AttributesRequest } from "../dtos/requests/attributesRequest";
import { AttributesResponse } from "../dtos/responses/attributesResponse";


const router = express.Router();
const attributesService = new AttributesService();

export class AttributesController {
    constructor(private attributesService: AttributesService) { }

    async getAttributes() {
        router.get('/attributes/:characterId', async (
            req: Request<{ characterId: string }>, 
            res: Response<AttributesResponse | null>
        ) => {
            const characterId = parseInt(req.params.characterId, 10);
            const attributes = await this.attributesService.getAttributes(characterId);
            
            res.json(attributes);
        });
    }

    async updateAttributes() {
        router.put('/attributes/:characterId', async (req, res) => {
            const characterId = parseInt(req.params.characterId, 10);
            const attributes = req.body;
            await this.attributesService.updateAttributes(characterId, attributes);
            res.status(204).send();
        });
    }
}
export default router;
