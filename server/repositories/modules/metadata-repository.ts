/**
 * MetadataModuleRepository - MODULE 15: METADATA
 * Handles session and modification tracking
 */

import { BaseModuleRepository, SaveResult } from './base-module-repository';

export class MetadataModuleRepository extends BaseModuleRepository {
  /**
   * Save metadata module (sessionNotes, lastModified)
   * @param characterId - Character ID
   * @param sessionNotes - Session notes
   */
  async save(characterId: string, sessionNotes: string): Promise<SaveResult> {
    return await this.updateCharacterModule(characterId, { sessionNotes });
  }

  /**
   * Load metadata module data
   * @param characterId - Character ID
   * @returns Metadata data or null
   */
  async load(characterId: string): Promise<{
    sessionNotes: string;
    lastModified: string;
  } | null> {
    const char = await this.loadCharacterData(characterId);
    if (!char) return null;
    return {
      sessionNotes: char.sessionNotes || '',
      lastModified: char.lastModified,
    };
  }
}
