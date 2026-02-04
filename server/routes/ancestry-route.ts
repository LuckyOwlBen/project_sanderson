import { Express } from 'express';
import { getAncestry, setAncestry } from '../controllers/ancestry-controller';
import { SocketBroadcaster } from '../socket-broadcaster';

/**
 * Register ancestry routes
 * @param app Express app instance
 * @param broadcaster Socket broadcaster for character updates
 */
export default function createAncestryRoute(app: Express, broadcaster: SocketBroadcaster): void {
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
  app.post('/api/characters/:id/ancestry', (req, res) => setAncestry(req, res, broadcaster));
}
