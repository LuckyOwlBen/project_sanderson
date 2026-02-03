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

/**
 * Register paths routes
 * @param app Express app instance
 */
export default function createPathsRoute(app: Express): void {
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
  app.post('/api/characters/:id/paths', setPaths);
}
