import { Express } from 'express';
import { getTalents, setTalents, getTalentParent, getBonusClasses, finalizeTalents, getTalentUI } from '../controllers/talents-controller';
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
   * GET /api/characters/:id/talents/ui
   * Load minimal talent UI response (keywords, points, unlocked talents only)
   * Frontend uses this for display and input collection
   *
   * @returns { success: boolean, data: TalentUIResponse }
   */
  app.get('/api/characters/:id/talents/ui', getTalentUI);

  /**
   * POST /api/characters/:id/talents
   * Save talents for a character
   *
   * @returns { success: boolean, data: TalentsStateDTO }
   */
  app.post('/api/characters/:id/talents', (req, res) => setTalents(req, res, broadcaster));

  /**
   * GET /api/talents/parent/:treeId
   * Find the parent core path for a specialization tree
   * e.g., /api/talents/parent/duelist => { parent: 'warrior' }
   */
  app.get('/api/talents/parent/:treeId', getTalentParent);

  /**
   * GET /api/talents/bonus-classes
   * Get available bonus class core paths (all 6 core except main and specialty)
   * Query params: mainPath, specialty
   */
  app.get('/api/talents/bonus-classes', getBonusClasses);

  /**
   * POST /api/characters/:id/talents/finalize
   * Finalize talents for a character (merge pending to total)
   * Called during character finalization step
   */
  app.post('/api/characters/:id/talents/finalize', (req, res) => finalizeTalents(req, res, broadcaster));
}
