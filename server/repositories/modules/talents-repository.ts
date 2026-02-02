/**
 * TalentsModuleRepository - MODULE 6: TALENTS
 * Handles talent selection and tracking
 */

import { BaseModuleRepository, SaveResult } from './base-module-repository';

export class TalentsModuleRepository extends BaseModuleRepository {
  /**
   * Save talents module (unlockedTalents, baselineUnlockedTalents)
   * @param characterId - Character ID
   * @param unlockedTalents - Array of unlocked talent IDs
   * @param baselineUnlockedTalents - Optional baseline talents
   */
  async save(
    characterId: string,
    unlockedTalents: string[],
    baselineUnlockedTalents?: string[]
  ): Promise<SaveResult> {
    return await this.updateCharacterModule(characterId, {
      unlockedTalents,
      baselineUnlockedTalents
    });
  }

  /**
   * Load talents module data
   * @param characterId - Character ID
   * @returns Talents data or null
   */
  async load(characterId: string): Promise<{
    unlockedTalents: string[];
    baselineUnlockedTalents?: string[];
  } | null> {
    const char = await this.loadCharacterData(characterId);
    if (!char) return null;
    return {
      unlockedTalents: char.unlockedTalents || [],
      baselineUnlockedTalents: char.baselineUnlockedTalents
    };
  }
}
