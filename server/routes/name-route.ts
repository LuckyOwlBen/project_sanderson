import { Express } from 'express';
import { getName, setName } from '../controllers/name-controller';
import { SocketBroadcaster } from '../socket-broadcaster';

/**
 * Register name routes
 * @param app Express app instance
 * @param broadcaster Socket broadcaster for character updates
 */
export default function createNameRoute(app: Express, broadcaster: SocketBroadcaster): void {
  /**
   * GET /api/characters/:id/name
   * Load name and level for a character
   *
   * @returns { success: boolean, name: string, level: number }
   */
  app.get('/api/characters/:id/name', getName);

  /**
   * POST /api/characters/:id/name
   * Save name and level for a character
   *
   * @returns { success: boolean, name: string, level: number }
   */
  app.post('/api/characters/:id/name', (req, res) => setName(req, res, broadcaster));
}
