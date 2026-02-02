import { Express } from 'express';
import { getAncestry, setAncestry } from '../controllers/ancestry-controller';

/**
 * Register ancestry routes
 * @param app Express app instance
 */
export default function createAncestryRoute(app: Express): void {
  /**
   * GET /api/characters/:id/ancestry
   * Load ancestry for a character
   *
   * @returns { success: boolean, ancestry: string | null }
   */
  app.get('/api/characters/:id/ancestry', getAncestry);

  /**
   * POST /api/characters/:id/ancestry
   * Save ancestry for a character
   *
   * @returns { success: boolean, ancestry: string | null }
   */
  app.post('/api/characters/:id/ancestry', setAncestry);
}
