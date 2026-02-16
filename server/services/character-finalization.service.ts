/**
 * Character Finalization Service
 * 
 * Orchestrates the finalization of all character creation sections.
 * Validates that all point allocation sections are complete and ready for finalization,
 * then finalizes all sections in sequence.
 */

import { attributesFinalizationService } from './attributes-finalization';
import { finalizeSkillsForCharacter } from './skills-service';
import TalentService from './talent-service';
import { finalizeExpertisesForCharacter } from './expertise-service';
import { characterRepository } from '../repositories/character-repository';

export class CharacterFinalizationService {
  private talentService: TalentService;

  constructor() {
    this.talentService = new TalentService();
  }

  /**
   * Finalize character creation
   * Calls finalize methods for all four allocation sections:
   * - Attributes
   * - Skills
   * - Talents
   * - Expertises
   * 
   * Each finalize method validates pointsRemaining === 0 before proceeding.
   * If any section fails validation, the entire finalization is aborted.
   * 
   * @param characterId - The character to finalize
   * @returns Success object
   * @throws Error if any section has unspent points or validation fails
   */
  async finalizeCharacterCreation(characterId: string): Promise<{ success: true }> {
    console.log(`[CharacterFinalization] Starting finalization for character: ${characterId}`);

    try {
      // Finalize all sections
      // Each method validates pointsRemaining === 0 and moves spent to total
      
      await attributesFinalizationService.finalizeAttributesForCharacter(characterId);
      console.log(`[CharacterFinalization] ✓ Attributes finalized`);

      await finalizeSkillsForCharacter(characterId);
      console.log(`[CharacterFinalization] ✓ Skills finalized`);

      await this.talentService.finalizeTalentsForCharacter(characterId);
      console.log(`[CharacterFinalization] ✓ Talents finalized`);

      await finalizeExpertisesForCharacter(characterId);
      console.log(`[CharacterFinalization] ✓ Expertises finalized`);

      // Clear the pending level flag and points on finalization
      const character = await characterRepository.load(characterId);
      if (character) {
        character.pendingLevel = false;
        character.pendingLevelPoints = 0;
        await characterRepository.save(character);
        console.log(`[CharacterFinalization] ✓ Cleared pendingLevel flag and pendingLevelPoints`);
      }

      console.log(`[CharacterFinalization] ✅ Character ${characterId} finalized successfully`);
      
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[CharacterFinalization] ❌ Finalization failed for ${characterId}:`, message);
      throw error; // Re-throw to let the controller handle the error response
    }
  }
}

// Singleton export
export const characterFinalizationService = new CharacterFinalizationService();
