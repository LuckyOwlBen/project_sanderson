
import { Request, Response } from "express";
import { AttributesService } from "../services/attributeService";

export class AttributesController {
    constructor(private attributesService: AttributesService) { }

    async getAttributes(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.characterId);
        const attrs = await this.attributesService.getAttributes(id);
        res.json(attrs);
    }

    async updateAttributes(req: Request, res: Response): Promise<void> {
        const characterId = parseInt(req.params.characterId, 10);
        const attributes = req.body;
        await this.attributesService.updateAttributes(characterId, attributes);
        res.status(204).send();
    }
}
