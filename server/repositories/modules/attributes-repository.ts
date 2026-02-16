/**
 * AttributesModuleRepository - MODULE 4: ATTRIBUTES
 * Handles core character statistics
 */

import { BaseModuleRepository, SaveResult } from './base-module-repository';

export class AttributesModuleRepository extends BaseModuleRepository {
  /**
   * Save attributes module
   * @param characterId - Character ID
   * @param attributes - Attributes object
   */
  async save(
    characterId: string,
    attributes: Record<string, number>
  ): Promise<SaveResult> {
    return await this.updateCharacterModule(characterId, { attributes });
  }

  /**
   * Load attributes module data
   * @param characterId - Character ID
   * @returns Attributes data or null
   */
  async load(characterId: string): Promise<Record<string, number> | null> {
    const char = await this.loadCharacterData(characterId);
    if (!char) return null;
    return char.attributes || {};
  }
}
