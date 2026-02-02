import { Express } from 'express';
import { getName, setName } from '../controllers/name-controller';

/**
 * Register name routes
 * @param app Express app instance
 */
export default function createNameRoute(app: Express): void {
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
  app.post('/api/characters/:id/name', setName);
}
