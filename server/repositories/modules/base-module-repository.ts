/**
 * BaseModuleRepository - Shared utilities for module repositories
 * 
 * Provides common functionality for loading and partially updating characters
 */

import { loadCharacter, saveCharacter } from '../../database';

export interface SaveResult {
  success: boolean;
  error?: string;
}

/**
 * Base class for module repositories with shared load/save logic
 */
export abstract class BaseModuleRepository {
  /**
   * Load a character from database
   * @param characterId - Character ID to load
   * @returns Character data or null if not found
   */
  protected async loadCharacterData(characterId: string): Promise<any | null> {
    return await loadCharacter(characterId);
  }

  /**
   * Save character data to database
   * @param characterData - Full character data to save
   * @returns Save result
   */
  protected async saveCharacterData(characterData: any): Promise<SaveResult> {
    try {
      await saveCharacter(characterData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update a character with new data for a specific module
   * @param characterId - Character ID
   * @param updates - Partial updates to apply
   * @returns Save result
   */
  protected async updateCharacterModule(
    characterId: string,
    updates: Record<string, any>
  ): Promise<SaveResult> {
    try {
      const char = await this.loadCharacterData(characterId);
      if (!char) {
        return { success: false, error: 'Character not found' };
      }
      
      const updated = {
        ...char,
        ...updates,
        lastModified: new Date().toISOString()
      };
      
      return await this.saveCharacterData(updated);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
