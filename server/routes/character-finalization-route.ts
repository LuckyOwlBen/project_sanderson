import { Express } from 'express';
import { finalizeCharacter } from '../controllers/character-finalization-controller';
import { getCompleteCharacter } from '../controllers/character-complete-controller';

/**
 * Register character finalization route
 * @param app Express app instance
 */
export default function createCharacterFinalizationRoute(app: Express): void {
  console.log('[Routes] Registering character finalization route...');

  /**
   * GET /api/characters/:id/complete
   * Get a flattened view of a complete character for review
   * 
   * Returns display-friendly data without deep nesting.
   * Used by the review page before finalization.
   *
   * @returns { success: boolean, character: CompleteCharacterView }
   */
  app.get('/api/characters/:id/complete', getCompleteCharacter);

  /**
   * POST /api/characters/:id/finalize
   * Finalize character creation
   * 
   * Validates all sections (attributes, skills, talents, expertises) are complete
   * and finalizes all point allocations. Once finalized, the character is locked
   * for level 1 until level-up occurs.
   *
   * @returns { success: boolean }
   * @throws 400 if any section has unspent points
   */
  app.post('/api/characters/:id/finalize', finalizeCharacter);
}
