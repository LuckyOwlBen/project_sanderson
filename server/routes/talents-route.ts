import { Express } from 'express';
import { getTalents, setTalents } from '../controllers/talents-controller';
import { SocketBroadcaster } from '../socket-broadcaster';

/**
 * Register talents routes
 * @param app Express app instance
 * @param broadcaster Socket broadcaster for character updates
 */
export default function createTalentsRoute(app: Express, broadcaster: SocketBroadcaster): void {
  console.log('[Routes] Registering talents routes...');

  /**
   * GET /api/characters/:id/talents
   * Load talents for a character
   *
   * @returns { success: boolean, data: TalentsStateDTO }
   */
  app.get('/api/characters/:id/talents', getTalents);

  /**
   * POST /api/characters/:id/talents
   * Save talents for a character
   *
   * @returns { success: boolean, data: TalentsStateDTO }
   */
  app.post('/api/characters/:id/talents', (req, res) => setTalents(req, res, broadcaster));
}
