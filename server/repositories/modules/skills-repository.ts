/**
 * SkillsModuleRepository - MODULE 5: SKILLS
 * Handles skill rankings and management
 */

import { BaseModuleRepository, SaveResult } from './base-module-repository';

export class SkillsModuleRepository extends BaseModuleRepository {
  /**
   * Save skills module
   * @param characterId - Character ID
   * @param skills - Skills map
   */
  async save(
    characterId: string,
    skills: Record<string, number>
  ): Promise<SaveResult> {
    return await this.updateCharacterModule(characterId, { skills });
  }

  /**
   * Load skills module data
   * @param characterId - Character ID
   * @returns Skills data or null
   */
  async load(characterId: string): Promise<Record<string, number> | null> {
    const char = await this.loadCharacterData(characterId);
    if (!char) return null;
    return char.skills || {};
  }
}
