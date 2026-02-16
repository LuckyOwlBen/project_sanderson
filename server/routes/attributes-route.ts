import { Express } from 'express';
import {
  getAttributes,
  setAttributes,
  finalizeAttributes,
} from '../controllers/attributes-controller';
import { SocketBroadcaster } from '../socket-broadcaster';

/**
 * Register attributes routes
 * @param app Express app instance
 * @param broadcaster Socket broadcaster for character updates
 */
export default function createAttributesRoute(app: Express, broadcaster: SocketBroadcaster): void {
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
  app.post('/api/characters/:id/attributes', (req, res) => setAttributes(req, res, broadcaster));

  /**
   * POST /api/characters/:id/attributes/finalize
   * Finalize attributes for a character
   *
   * @returns { success: boolean, data: { characterId: string, finalized: boolean } }
   */
  app.post('/api/characters/:id/attributes/finalize', (req, res) =>
    finalizeAttributes(req, res, broadcaster)
  );
}
