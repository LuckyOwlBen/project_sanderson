import { getDbInstance } from '../database';
import { AttributesDao } from '../dao/attributesDao';

const db = getDbInstance();

/**
 * Repository for managing character attributes.
 */
export class AttributesRepo {
    /**
     * Fetches attributes for a given character ID.
     * @param characterId - The ID of the character.
     * @returns A promise that resolves to the character's attributes.
     */
    async getAttributesByCharacterId(characterId: number): Promise<AttributesDao | null> {
        const result = await db.get<AttributesDao>(
            'SELECT strength, speed, intellect, willpower, awareness, presence FROM attributes WHERE character_id = ?',
            [characterId]
        );
        return result || null;
    }

    /**
     * Updates attributes for a given character ID.
     * @param characterId - The ID of the character.
     * @param attributes - The new attributes to set.
     * @returns A promise that resolves when the update is complete.
     **/
    async updateAttributes(characterId: number, attributes: AttributesDao): Promise<void> {
        await db.run(
            `UPDATE attributes 
             SET strength = ?, speed = ?, intellect = ?, willpower = ?, awareness = ?, presence = ?
             WHERE character_id = ?`,
            [
                attributes.strength,
                attributes.speed,
                attributes.intellect,
                attributes.willpower,
                attributes.awareness,
                attributes.presence,
                characterId
            ]
        )
    };
}
