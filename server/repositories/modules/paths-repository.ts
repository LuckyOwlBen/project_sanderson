/**
 * PathsModuleRepository - MODULE: PATHS
 * Handles character path selection (type + specialization)
 */

import { BaseModuleRepository, SaveResult } from './base-module-repository';

export class PathsModuleRepository extends BaseModuleRepository {
  /**
   * Save path selections
   * @param characterId - Character ID
   * @param type - Main path type (e.g., "warrior")
   * @param sub - Specialization (e.g., "Soldier")
   * @param tier0TalentId - The tier 0 talent ID for the main path
   */
  async save(
    characterId: string,
    type: string,
    sub: string,
    tier0TalentId: string | null = null
  ): Promise<SaveResult> {
    return await this.updateCharacterModule(characterId, {
      paths: [type, sub],
      mainPathTier0TalentId: tier0TalentId,
    });
  }

  /**
   * Load path selections
   * @param characterId - Character ID
   * @returns Path data or null
   */
  async load(characterId: string): Promise<{
    type: string | null;
    sub: string | null;
  } | null> {
    const char = await this.loadCharacterData(characterId);
    if (!char) return null;

    const paths = char.paths || [];
    return {
      type: paths[0] ?? null,
      sub: paths[1] ?? null,
    };
  }
}
