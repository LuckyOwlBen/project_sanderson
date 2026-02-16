/**
 * CombatModuleRepository - MODULE 10: COMBAT
 * Handles combat stance and attack system
 */

import { BaseModuleRepository, SaveResult } from './base-module-repository';

export class CombatModuleRepository extends BaseModuleRepository {
  /**
   * Save combat module
   * @param characterId - Character ID
   * @param activeStanceId - Currently active stance ID or null
   */
  async save(characterId: string, activeStanceId: string | null): Promise<SaveResult> {
    return await this.updateCharacterModule(characterId, { activeStanceId });
  }

  /**
   * Load combat module data
   * @param characterId - Character ID
   * @returns Combat data or null
   */
  async load(characterId: string): Promise<{ activeStanceId: string | null } | null> {
    const char = await this.loadCharacterData(characterId);
    if (!char) return null;
    return {
      activeStanceId: char.activeStanceId || null,
    };
  }
}
