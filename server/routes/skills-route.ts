import { Express } from 'express';
import { getAvailableSkills, getSkills, setSkills } from '../controllers/skills-controller';
import { SocketBroadcaster } from '../socket-broadcaster';

/**
 * Register skills routes
 * @param app Express app instance
 * @param broadcaster Socket broadcaster for character updates
 */
export default function createSkillsRoute(app: Express, broadcaster: SocketBroadcaster): void {
  console.log('[Routes] Registering skills routes...');
  /**
   * GET /api/skills/available
   * Load available skills by category
   *
   * @returns { success: boolean, data: { physical: string[], mental: string[], social: string[] } }
   */
  app.get('/api/skills/available', getAvailableSkills);

  /**
   * GET /api/characters/:id/skills
   * Load skills for a character
   *
   * @returns { success: boolean, data: SkillsStateDTO }
   */
  app.get('/api/characters/:id/skills', getSkills);

  /**
   * POST /api/characters/:id/skills
   * Save skills for a character
   *
   * @returns { success: boolean, data: SkillsStateDTO }
   */
  app.post('/api/characters/:id/skills', (req, res) => setSkills(req, res, broadcaster));
}
