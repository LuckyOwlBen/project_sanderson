import { Express } from 'express';
import { getTalents, setTalents } from '../controllers/talents-controller';

/**
 * Register talents routes
 * @param app Express app instance
 */
export default function createTalentsRoute(app: Express): void {
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
  app.post('/api/characters/:id/talents', setTalents);
}
