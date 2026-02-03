import { Express } from 'express';
import { getAvailableExpertise, getExpertise, setExpertise } from '../controllers/expertise-controller';

/**
 * Register expertise routes
 * @param app Express app instance
 */
export default function createExpertiseRoute(app: Express): void {
  console.log('[Routes] Registering expertise routes...');
  /**
   * GET /api/expertise/available
   * Load available expertise by category
   *
   * @returns { success: boolean, data: { categories: Record<string, string[]> } }
   */
  app.get('/api/expertise/available', getAvailableExpertise);

  /**
   * GET /api/characters/:id/expertise
   * Load expertise for a character
   *
   * @returns { success: boolean, data: ExpertiseStateDTO }
   */
  app.get('/api/characters/:id/expertise', getExpertise);

  /**
   * POST /api/characters/:id/expertise
   * Save expertise for a character (full replacement)
   *
   * @returns { success: boolean, data: ExpertiseStateDTO }
   */
  app.post('/api/characters/:id/expertise', setExpertise);
}
