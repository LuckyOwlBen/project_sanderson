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
   * Get navigation status for a character
   * 
   * Returns tri-state for each creation step:
   *   'pending'   – Has unspent points or selection not made (Gold)
   *   'spent'     – All points spent / selection made, still editable (Green)
   *   'finalized' – Locked via Review page finalize, read-only (Blue)
   * 
   * @returns {
   *   ancestry: 'pending' | 'spent' | 'finalized',
   *   culture: 'pending' | 'spent' | 'finalized',
   *   name: 'pending' | 'spent' | 'finalized',
   *   attributes: 'pending' | 'spent' | 'finalized',
   *   expertises: 'pending' | 'spent' | 'finalized',
   *   skills: 'pending' | 'spent' | 'finalized',
   *   paths: 'pending' | 'spent' | 'finalized',
   *   talents: 'pending' | 'spent' | 'finalized',
   *   equipment: 'pending' | 'spent' | 'finalized'
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
        error: message
      });
    }
  });
}
