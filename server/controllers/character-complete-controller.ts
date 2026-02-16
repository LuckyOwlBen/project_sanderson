/**
 * Character Complete View Controller
 *
 * Handles HTTP endpoint for retrieving a flattened complete character view.
 */

import { Request, Response } from 'express';
import { getCompleteCharacterView } from '../services/character-complete-view.service';

/**
 * GET /api/characters/:id/complete
 * Get a flattened view of a complete character for review
 *
 * @param req.params.id - Character ID
 * @returns { success: boolean, character: CompleteCharacterView }
 */
export async function getCompleteCharacter(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    console.log(`[CompleteCharacterController] GET complete character: ${id}`);

    const character = await getCompleteCharacterView(id);

    res.json({
      success: true,
      character,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[CompleteCharacterController] Error:', message);

    const statusCode = message.includes('not found') ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
}
