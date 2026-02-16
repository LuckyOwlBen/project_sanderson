/**
 * IdentityModuleRepository - MODULE 1: IDENTITY
 * Handles character identification (id, name)
 */

import { BaseModuleRepository, SaveResult } from './base-module-repository';

export class IdentityModuleRepository extends BaseModuleRepository {
  /**
   * Save identity module (id, name)
   * @param characterId - Character ID
   * @param name - Character name
   */
  async save(characterId: string, name: string): Promise<SaveResult> {
    return await this.updateCharacterModule(characterId, { name });
  }

  /**
   * Load identity module data
   * @param characterId - Character ID
   * @returns Identity data or null
   */
  async load(characterId: string): Promise<{ id: string; name: string } | null> {
    const char = await this.loadCharacterData(characterId);
    if (!char) return null;
    return {
      id: char.id,
      name: char.name,
    };
  }
}
