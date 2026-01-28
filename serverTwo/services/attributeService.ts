import { AttributesResponse } from "../dtos/responses/attributesResponse";
import { AttributesRepo } from "../repositories/attributesRepo";
import { DerivedAttributesManager } from "../managers/derivedAttributes/derivedAttributesManager";
import { ResourceManager } from "../managers/resources/resourceManager";
import { ResourceDao } from "../dao/resourceDao";

    
export class AttributesService {

    constructor() {
        this.attributesRepo = new AttributesRepo();
        this.derivedAttributesManager = new DerivedAttributesManager();
        this.resourceManager = new ResourceManager();
    }
    private attributesRepo: AttributesRepo;
    private derivedAttributesManager: DerivedAttributesManager;
    private resourceManager: ResourceManager;

    async getAttributes(characterId: number): Promise<AttributesResponse | null> {
        const attributesFetch = this.attributesRepo.getAttributesByCharacterId(characterId);
        const attributesDao = await attributesFetch;
        if (attributesDao) {
            const derivedAttributes = this.derivedAttributesManager.getDerivedAttributes(attributesDao);
            const resources = this.resourceManager.recalculateMaxValues(attributesDao);
            const attributesResponse = new AttributesResponse(attributesDao, derivedAttributes, resources);
            return attributesResponse;
        }
        return null;
    }

    async updateAttributes(characterId: number, attributes: any) {
        return this.attributesRepo.updateAttributes(characterId, attributes);
    }
}