/**
 * NameModuleRepository - MODULE: CHARACTER NAME
 * Handles character name and level (character creation step 2)
 */

import { BaseModuleRepository, SaveResult } from './base-module-repository';

export class NameModuleRepository extends BaseModuleRepository {
  /**
   * Save name module (name and level)
   * @param characterId - Character ID
   * @param name - Character name
   * @param level - Character level (1-21)
   */
  async save(
    characterId: string,
    name: string,
    level: number
  ): Promise<SaveResult> {
    return await this.updateCharacterModule(characterId, {
      name,
      level
    });
  }

  /**
   * Load name module data
   * @param characterId - Character ID
   * @returns Name data or null
   */
  async load(characterId: string): Promise<{
    name: string;
    level: number;
    cultures: string[];
  } | null> {
    const char = await this.loadCharacterData(characterId);
    if (!char) return null;
    return {
      name: char.name || '',
      level: char.level || 1,
      cultures: char.cultures || []
    };
  }
}
