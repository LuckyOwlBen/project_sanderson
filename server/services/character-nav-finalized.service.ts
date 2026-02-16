/**
 * Character Navigation Finalized Service
 *
 * Provides finalized status for character creation/level-up steps.
 * This service is the single source of truth for what steps are locked down
 * in a character's progression. Used by frontend to display nav button colors.
 */

import {
  getAttributesRecord,
  getSkillsStateRecord,
  getTalentsStateRecord,
  getExpertiseStateRecord,
  loadCharacter,
} from '../database';

export interface NavigationFinalizedStatus {
  ancestry: boolean;
  culture: boolean;
  name: boolean;
  attributes: boolean;
  expertises: boolean;
  skills: boolean;
  paths: boolean;
  talents: boolean;
  equipment: boolean;
}

export class CharacterNavFinalizedService {
  /**
   * Get navigation finalized status for a character
   * Queries each step's finalized property from the database
   *
   * @param characterId - Character to query
   * @returns Navigation finalized status object
   */
  async getNavigationFinalized(characterId: string): Promise<NavigationFinalizedStatus> {
    try {
      // Load basic character data for early-step info
      const character = await loadCharacter(characterId);
      if (!character) {
        throw new Error(`Character ${characterId} not found`);
      }

      // Load state records for each step
      const attrs = await getAttributesRecord(characterId);
      const skills = await getSkillsStateRecord(characterId);
      const talents = await getTalentsStateRecord(characterId);
      const expertise = await getExpertiseStateRecord(characterId);

      // Early steps are finalized if they have been chosen and lock happens on creation finalize
      // For now, we'll check if they have values (true) as a proxy until we add explicit finalized columns
      // At finalization, we'll update all these flags together
      const hasAncestry = !!character.ancestry;
      const hasCulture = (character.cultures?.length ?? 0) > 0;
      const hasName =
        !!(character.name && character.name.length > 0) && character.name !== 'Unnamed';
      const hasPath = (character.paths?.length ?? 0) > 0;

      return {
        ancestry: hasAncestry,
        culture: hasCulture,
        name: hasName,
        attributes: attrs?.finalized ?? false,
        expertises: expertise?.finalized ?? false,
        skills: skills?.finalized ?? false,
        paths: hasPath,
        talents: talents?.finalized ?? false,
        equipment: true, // Equipment is always available/finalizable
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(
        `[CharacterNavFinalized] Error getting navigation status for ${characterId}:`,
        message
      );
      throw error;
    }
  }

  /**
   * Get finalized status for a specific step
   *
   * @param characterId - Character to query
   * @param step - Step name: ancestry, culture, name, attributes, skills, talents, expertises, paths, equipment
   * @returns Boolean indicating if step is finalized
   */
  async getStepFinalized(characterId: string, step: string): Promise<boolean> {
    const status = await this.getNavigationFinalized(characterId);
    return (status as any)[step] ?? false;
  }
}

// Singleton export
export const characterNavFinalizedService = new CharacterNavFinalizedService();
