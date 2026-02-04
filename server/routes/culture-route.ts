import { Express } from 'express';
import { getCultures, setCultures } from '../controllers/culture-controller';
import { SocketBroadcaster } from '../socket-broadcaster';

/**
 * Register culture routes
 * @param app Express app instance
 * @param broadcaster Socket broadcaster for character updates
 */
export default function createCultureRoute(app: Express, broadcaster: SocketBroadcaster): void {
  console.log('[Routes] Registering culture routes...');
  /**
   * GET /api/characters/:id/cultures
   * Load cultures for a character
   *
   * @returns { success: boolean, cultures: string[] }
   */
  app.get('/api/characters/:id/cultures', getCultures);

  /**
   * POST /api/characters/:id/cultures
   * Save cultures for a character
   *
   * @returns { success: boolean, cultures: string[] }
   */
  app.post('/api/characters/:id/cultures', (req, res) => setCultures(req, res, broadcaster));
}
