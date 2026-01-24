/**
 * Path Selection Routes
 * 
 * Handles path (main class) selection for characters.
 * Integrates with TalentService to auto-unlock tier 0 talent.
 * 
 * Endpoints:
 * - POST /api/characters/:id/paths - Select character path
 */

import express, { Router, Request, Response } from 'express';
import TalentService from '../services/talent-service.js';

export function createPathRoutes(talentService: TalentService): Router {
  const router = express.Router();

  /**
   * POST /api/characters/:id/paths
   * 
   * Set character's main path (class) and auto-unlock tier 0 talent.
   * 
   * This is the SINGLE location where tier 0 talent auto-unlock happens.
   * All other locations that previously did this have been removed.
   * 
   * Body:
   * {
   *   mainPath: string - Path identifier (warrior, scholar, hunter, etc)
   *   specialization?: string - Optional specialization
   * }
   * 
   * Response:
   * {
   *   success: boolean,
   *   unlockedTalent: string | null - The tier 0 talent that was unlocked,
   *   paths: string[] - Updated paths array,
   *   error?: string
   * }
   */
  router.post('/characters/:id/paths', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { mainPath, specialization } = req.body;

      if (!mainPath) {
        return res.status(400).json({ error: 'mainPath is required' });
      }

      // Load character
      const db = require('../database.js');
      const character = db.loadCharacter(id);
      if (!character) {
        return res.status(404).json({ error: 'Character not found' });
      }

      // Update paths
      const paths = [mainPath];
      if (specialization) {
        paths.push(specialization);
      }

      // Save character with updated paths
      const updated = {
        ...character,
        paths,
        lastModified: new Date().toISOString()
      };

      const saveResult = db.saveCharacter(updated);
      if (!saveResult.success) {
        return res.status(500).json({ error: 'Failed to save character' });
      }

      // SINGLE LOCATION: Ensure tier 0 talent is unlocked
      const unlockedTalent = talentService.ensureTier0Unlocked(id, mainPath);

      return res.json({
        success: true,
        unlockedTalent,
        paths,
        id
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[PathRoutes] Error in POST /paths:', message);
      return res.status(500).json({ error: message });
    }
  });

  return router;
}

export default createPathRoutes;
