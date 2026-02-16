/**
 * ProgressionModuleRepository - MODULE 2: PROGRESSION
 * Handles experience and level tracking (level, pendingLevelPoints, pendingLevel)
 */

import { BaseModuleRepository, SaveResult } from './base-module-repository';

export class ProgressionModuleRepository extends BaseModuleRepository {
  /**
   * Save progression module (level, pendingLevelPoints, pendingLevel)
   * @param characterId - Character ID
   * @param level - Current level
   * @param pendingLevelPoints - Points awaiting allocation
   * @param pendingLevel - Flag indicating user needs to complete level-up flow
   */
  async save(
    characterId: string,
    level: number,
    pendingLevelPoints: number,
    pendingLevel: boolean
  ): Promise<SaveResult> {
    return await this.updateCharacterModule(characterId, {
      level,
      pendingLevelPoints,
      pendingLevel,
    });
  }

  /**
   * Load progression module data
   * @param characterId - Character ID
   * @returns Progression data or null
   */
  async load(
    characterId: string
  ): Promise<{ level: number; pendingLevelPoints: number; pendingLevel: boolean } | null> {
    const char = await this.loadCharacterData(characterId);
    if (!char) return null;
    return {
      level: char.level,
      pendingLevelPoints: char.pendingLevelPoints,
      pendingLevel: char.pendingLevel ?? false,
    };
  }
}
