/**
 * ExpertisesModuleRepository - MODULE 7: EXPERTISES
 * Handles specialized knowledge domains
 */

import { BaseModuleRepository, SaveResult } from './base-module-repository';

export interface ExpertiseSourceDTO {
  name: string;
  source: string;
  sourceId?: string;
}

export class ExpertisesModuleRepository extends BaseModuleRepository {
  /**
   * Save expertises module
   * @param characterId - Character ID
   * @param expertises - Array of expertise source DTOs
   */
  async save(characterId: string, expertises: ExpertiseSourceDTO[]): Promise<SaveResult> {
    return await this.updateCharacterModule(characterId, {
      selectedExpertises: expertises,
    });
  }

  /**
   * Load expertises module data
   * @param characterId - Character ID
   * @returns Expertises data or null
   */
  async load(characterId: string): Promise<ExpertiseSourceDTO[] | null> {
    const char = await this.loadCharacterData(characterId);
    if (!char) return null;
    return char.selectedExpertises || [];
  }
}
