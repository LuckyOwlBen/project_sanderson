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
   */
  async save(
    characterId: string,
    type: string,
    sub: string
  ): Promise<SaveResult> {
    return await this.updateCharacterModule(characterId, {
      paths: [type, sub]
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
      sub: paths[1] ?? null
    };
  }
}
