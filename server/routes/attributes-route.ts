import { Express } from 'express';
import { getAttributes, setAttributes, finalizeAttributes } from '../controllers/attributes-controller';

/**
 * Register attributes routes
 * @param app Express app instance
 */
export default function createAttributesRoute(app: Express): void {
  console.log('[Routes] Registering attributes routes...');

  /**
   * GET /api/characters/:id/attributes
   * Load attributes for a character
   *
   * @returns { success: boolean, data: AttributesDTO }
   */
  app.get('/api/characters/:id/attributes', getAttributes);

  /**
   * POST /api/characters/:id/attributes
   * Save attributes for a character
   *
   * @returns { success: boolean, data: AttributesDTO }
   */
  app.post('/api/characters/:id/attributes', setAttributes);

  /**
   * POST /api/characters/:id/attributes/finalize
   * Finalize attributes for a character
   *
   * @returns { success: boolean, data: { characterId: string, finalized: boolean } }
   */
  app.post('/api/characters/:id/attributes/finalize', finalizeAttributes);
}
