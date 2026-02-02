/**
 * SingerFormsModuleRepository - MODULE 9: SINGER FORMS
 * Handles symbiotic form tracking and activation
 */

import { BaseModuleRepository, SaveResult } from './base-module-repository';

export class SingerFormsModuleRepository extends BaseModuleRepository {
  /**
   * Save Singer Forms module
   * @param characterId - Character ID
   * @param unlockedForms - Array of unlocked form IDs
   * @param activeForm - Currently active form ID
   */
  async save(
    characterId: string,
    unlockedForms: string[],
    activeForm?: string
  ): Promise<SaveResult> {
    return await this.updateCharacterModule(characterId, {
      unlockedSingerForms: unlockedForms,
      activeForm
    });
  }

  /**
   * Load Singer Forms module data
   * @param characterId - Character ID
   * @returns Singer Forms data or null
   */
  async load(characterId: string): Promise<{
    unlockedSingerForms: string[];
    activeForm?: string;
  } | null> {
    const char = await this.loadCharacterData(characterId);
    if (!char) return null;
    return {
      unlockedSingerForms: char.unlockedSingerForms || [],
      activeForm: char.activeForm
    };
  }
}
