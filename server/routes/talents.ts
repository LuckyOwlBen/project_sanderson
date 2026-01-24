/**
 * Talent System Routes
 * 
 * REST API endpoints for talent management.
 * All endpoints use dependency-injected TalentService for business logic.
 * 
 * Endpoints:
 * - GET /api/characters/:id/talents/forLevel - Get available talents & points for a level
 * - GET /api/characters/:id/level/talents - Get talent data for level-up (includes slice info)
 * - PATCH /api/characters/:id/level/talents - Save talent selections
 */

import express, { Router, Request, Response } from 'express';
import TalentService from '../services/talent-service.js';

export function createTalentRoutes(talentService: TalentService): Router {
  const router = express.Router();

  /**
   * GET /api/characters/:id/talents/forLevel?isCreationMode=true|false
   * 
   * Get available talent points and selection state for a character's current level.
   * Used for both character creation and level-up talent selection.
   * 
   * Query params:
   * - isCreationMode (boolean): If true, uses cumulative points. If false, uses level-specific points.
   * 
   * Response includes:
   * - talentPoints: Number of points available to spend
   * - previouslySelectedTalents: Talents from previous levels (locked during level-up)
   * - unlockedTalents: All currently unlocked talents
   * - spentPoints: Tracking of how many points spent per level
   * - lockedTalents: Talents that cannot be removed (non-empty only in level-up)
   * - requiresSingerSelection: Whether character must select from Singer tree
   * - tier0TalentId: The free tier 0 talent for this character's path
   */
  router.get('/characters/:id/talents/forLevel', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const isCreationMode = req.query.isCreationMode === 'true';

      // Get character to determine level
      const character = require('../database.js').loadCharacter(id);
      if (!character) {
        return res.status(404).json({ error: 'Character not found' });
      }

      // Get talent selection state
      const state = talentService.getTalentSelectionState(id, character.level, isCreationMode);

      return res.json({
        talentPoints: state.talentPoints,
        previouslySelectedTalents: state.previouslySelectedTalents,
        unlockedTalents: state.unlockedTalents,
        spentPoints: state.spentPoints,
        lockedTalents: state.lockedTalents,
        requiresSingerSelection: state.requiresSingerSelection,
        tier0TalentId: state.tier0TalentId
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[TalentRoutes] Error in GET /talents/forLevel:', message);
      return res.status(500).json({ error: message });
    }
  });

  /**
   * GET /api/characters/:id/level/talents
   * 
   * Get talent slice information for a character's level-up flow.
   * This endpoint is READ-ONLY and does not modify server state.
   * 
   * Response includes talent availability data specific to level-up progression.
   */
  router.get('/characters/:id/level/talents', (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Load character and get current level
      const character = require('../database.js').loadCharacter(id);
      if (!character) {
        return res.status(404).json({ error: 'Character not found' });
      }

      // Get talent state for level-up mode (not creation)
      const state = talentService.getTalentSelectionState(id, character.level, false);

      return res.json({
        level: character.level,
        talentPoints: state.talentPoints,
        previouslySelectedTalents: state.previouslySelectedTalents,
        unlockedTalents: state.unlockedTalents,
        spentPoints: state.spentPoints,
        lockedTalents: state.lockedTalents,
        requiresSingerSelection: state.requiresSingerSelection,
        tier0TalentId: state.tier0TalentId,
        isLevelUp: true
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[TalentRoutes] Error in GET /level/talents:', message);
      return res.status(500).json({ error: message });
    }
  });

  /**
   * PATCH /api/characters/:id/level/talents
   * 
   * Save talent selections for the current level.
   * Server validates that point allocation doesn't exceed available.
   * Tracks spending to prevent re-allocation on revisit.
   * 
   * Body:
   * {
   *   unlockedTalents: string[] - All talents to unlock (server calculates new ones)
   *   level?: number - Optional level override (defaults to character.level)
   * }
   * 
   * Response:
   * {
   *   success: boolean,
   *   unlockedTalents: string[] - Updated list of all unlocked talents,
   *   spentPoints: { talents: { [level]: count } },
   *   error?: string - If success is false
   * }
   */
  router.patch('/characters/:id/level/talents', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { unlockedTalents, level: overrideLevel } = req.body;

      if (!Array.isArray(unlockedTalents)) {
        return res.status(400).json({ error: 'unlockedTalents must be an array' });
      }

      // Load character
      const db = require('../database.js');
      const character = db.loadCharacter(id);
      if (!character) {
        return res.status(404).json({ error: 'Character not found' });
      }

      const level = overrideLevel ?? character.level;
      const mainPath = character.paths?.[0] || null;

      // Save selections (validates internally)
      const result = talentService.saveTalentSelections(id, unlockedTalents, level, mainPath);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      // Get updated character state
      const updated = db.loadCharacter(id);
      const spentTalents: Record<string, number> = {};
      for (let i = 1; i <= level; i++) {
        const spent = db.getSpentPoints(id, 'talents', i) || 0;
        spentTalents[i] = spent;
      }

      return res.json({
        success: true,
        id,
        unlockedTalents: updated?.unlockedTalents || [],
        spentPoints: { talents: spentTalents }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[TalentRoutes] Error in PATCH /level/talents:', message);
      return res.status(500).json({ error: message });
    }
  });

  return router;
}

export default createTalentRoutes;
