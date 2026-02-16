/**
 * Character Navigation Finalized Route
 *
 * API endpoint for frontend to get navigation finalization status
 */

import { Express, Request, Response } from 'express';
import { characterNavFinalizedService } from '../services/character-nav-finalized.service';

/**
 * Register character navigation finalized routes
 * @param app Express app instance
 */
export default function createCharacterNavFinalizedRoute(app: Express): void {
  /**
   * GET /api/character/:id/isNavFinalized
   * Get navigation finalization status for a character
   *
   * Returns which creation steps are finalized for the character.
   * Green buttons = finalized, Gold buttons = not finalized.
   *
   * @returns {
   *   ancestry: boolean,
   *   culture: boolean,
   *   name: boolean,
   *   attributes: boolean,
   *   expertises: boolean,
   *   skills: boolean,
   *   paths: boolean,
   *   talents: boolean,
   *   equipment: boolean
   * }
   */
  app.get('/api/character/:id/isNavFinalized', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      console.log(`[NavFinalizedRoute] Getting finalized status for character: ${id}`);

      const status = await characterNavFinalizedService.getNavigationFinalized(id);

      res.json(status);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[NavFinalizedRoute] Error getting finalized status:', message);

      res.status(500).json({
        success: false,
        error: message,
      });
    }
  });
}
