import { Express } from 'express';
import { getAvailableSkills, getSkills, setSkills } from '../controllers/skills-controller';

/**
 * Register skills routes
 * @param app Express app instance
 */
export default function createSkillsRoute(app: Express): void {
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
  app.post('/api/characters/:id/skills', setSkills);
}
