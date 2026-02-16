/**
 * Paths Routes
 *
 * REST API endpoints for character path selection.
 *
 * Endpoints:
 * - GET /api/characters/:id/paths - Get current path selections
 * - POST /api/characters/:id/paths - Save path selections
 */

import { Express } from 'express';
import { getPaths, setPaths } from '../controllers/paths-controller';
import { SocketBroadcaster } from '../socket-broadcaster';

/**
 * Register paths routes
 * @param app Express app instance
 * @param broadcaster Socket broadcaster for character updates
 */
export default function createPathsRoute(app: Express, broadcaster: SocketBroadcaster): void {
  /**
   * GET /api/characters/:id/paths
   * Load path selections for a character
   *
   * @returns { success: boolean, type: string | null, sub: string | null }
   */
  app.get('/api/characters/:id/paths', getPaths);

  /**
   * POST /api/characters/:id/paths
   * Save path selections for a character
   *
   * @returns { success: boolean, type: string, sub: string }
   */
  app.post('/api/characters/:id/paths', (req, res) => setPaths(req, res, broadcaster));
}
