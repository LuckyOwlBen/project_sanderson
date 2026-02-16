/**
 * AncestryModuleRepository - MODULE 3: ANCESTRY/CULTURE
 * Handles character background and heritage (ancestry, cultures, paths)
 */

import { BaseModuleRepository, SaveResult } from './base-module-repository';

export class AncestryModuleRepository extends BaseModuleRepository {
  /**
   * Save ancestry module (ancestry, cultures, paths)
   * @param characterId - Character ID
   * @param ancestry - Ancestry selection
   * @param cultures - Array of culture names/IDs
   * @param paths - Array of path names/IDs
   */
  async save(
    characterId: string,
    ancestry: string | null,
    cultures: string[],
    paths: string[]
  ): Promise<SaveResult> {
    return await this.updateCharacterModule(characterId, {
      ancestry,
      cultures,
      paths
    });
  }

  /**
   * Load ancestry module data
   * @param characterId - Character ID
   * @returns Ancestry data or null
   */
  async load(characterId: string): Promise<{
    ancestry: string | null;
    cultures: string[];
    paths: string[];
  } | null> {
    const char = await this.loadCharacterData(characterId);
    if (!char) return null;
    return {
      ancestry: char.ancestry,
      cultures: char.cultures || [],
      paths: char.paths || []
    };
  }
}
