/**
 * Character Finalization Controller
 * 
 * Handles HTTP endpoints for finalizing character creation.
 */

import { Request, Response } from 'express';
import { characterFinalizationService } from '../services/character-finalization.service';

/**
 * POST /api/characters/:id/finalize
 * Finalize character creation
 * 
 * Validates all sections are complete and finalizes all point allocations.
 * 
 * @param req.params.id - Character ID
 * @returns { success: boolean } - Success indicator
 * @throws 400 if any section has unspent points
 */
export async function finalizeCharacter(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    console.log(`[FinalizeController] Finalize request for character: ${id}`);

    // Call orchestration service to finalize all sections
    const result = await characterFinalizationService.finalizeCharacterCreation(id);

    console.log(`[FinalizeController] ✅ Character ${id} finalized successfully`);
    
    res.json({
      success: true
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[FinalizeController] ❌ Finalization error:', message);
    
    // Return 400 for validation errors (unspent points)
    const statusCode = message.includes('points remaining') ? 400 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: message
    });
  }
}
