/**
 * Point Allocation Routes
 * 
 * REST endpoints for getting and validating point allocations.
 * These are used during character creation and level-up to ensure accuracy.
 * 
 * GET /api/characters/:id/allocations/attributes/level/:level
 * GET /api/characters/:id/allocations/skills/level/:level
 * GET /api/characters/:id/allocations/talents/level/:level
 * POST /api/characters/:id/allocations/attributes/validate
 * POST /api/characters/:id/allocations/skills/validate
 * POST /api/characters/:id/allocations/talents/validate
 */

import { pointAllocationService } from '../services/point-allocation-service';

function createAllocationRoutes(app, CHARACTERS_DIR) {
  console.log('[Routes] Registering allocation routes...');

  /**
   * GET /api/characters/:id/allocations/attributes/level/:level
   * 
   * Get attribute allocation state for a specific level
   * Returns current allocations and available points
   * 
   * Response:
   * {
   *   currentLevel: number,
   *   isCreation: boolean,
   *   currentAllocations: {str, qck, int, awr, wil, prs},
   *   pointsAvailable: number,
   *   pointsSpent: number,
   *   pointsTotal: number,
   *   canProceed: boolean,
   *   validation: {valid: boolean, message: string}
   * }
   */
  app.get('/api/characters/:id/allocations/attributes/level/:level', async (req, res) => {
    try {
      const { id, level } = req.params;
      const levelNum = parseInt(level, 10);

      if (isNaN(levelNum) || levelNum < 1 || levelNum > 21) {
        return res.status(400).json({
          success: false,
          error: 'Invalid level: must be 1-21'
        });
      }

      // In a real implementation, this would fetch from database
      // For now, return the slice structure without current data
      const slice = pointAllocationService.getAttributeSlice(levelNum, {}, levelNum === 1);

      res.json({
        success: true,
        data: slice
      });
    } catch (error) {
      console.error('[Routes] Error getting attribute slice:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get attribute allocation state'
      });
    }
  });

  /**
   * GET /api/characters/:id/allocations/skills/level/:level
   * 
   * Get skill allocation state for a specific level
   */
  app.get('/api/characters/:id/allocations/skills/level/:level', async (req, res) => {
    try {
      const { id, level } = req.params;
      const levelNum = parseInt(level, 10);

      if (isNaN(levelNum) || levelNum < 1 || levelNum > 21) {
        return res.status(400).json({
          success: false,
          error: 'Invalid level: must be 1-21'
        });
      }

      const slice = pointAllocationService.getSkillSlice(levelNum, {}, {}, levelNum === 1);

      res.json({
        success: true,
        data: slice
      });
    } catch (error) {
      console.error('[Routes] Error getting skill slice:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get skill allocation state'
      });
    }
  });

  /**
   * GET /api/characters/:id/allocations/talents/level/:level
   * 
   * Get talent allocation state for a specific level
   * 
   * Query params:
   *   tier0TalentId: string (optional) - the tier 0 talent id for this character
   */
  app.get('/api/characters/:id/allocations/talents/level/:level', async (req, res) => {
    try {
      const { id, level } = req.params;
      const { tier0TalentId } = req.query;
      const levelNum = parseInt(level, 10);

      if (isNaN(levelNum) || levelNum < 1 || levelNum > 21) {
        return res.status(400).json({
          success: false,
          error: 'Invalid level: must be 1-21'
        });
      }

      const slice = pointAllocationService.getTalentSlice(
        levelNum,
        {},
        {},
        tier0TalentId as string | undefined,
        levelNum === 1
      );

      res.json({
        success: true,
        data: slice
      });
    } catch (error) {
      console.error('[Routes] Error getting talent slice:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get talent allocation state'
      });
    }
  });

  /**
   * POST /api/characters/:id/allocations/attributes/validate
   * 
   * Validate an attribute allocation
   * 
   * Request body:
   * {
   *   level: number,
   *   attributes: {str, qck, int, awr, wil, prs},
   *   previousAttributes: {str, qck, int, awr, wil, prs} (optional)
   * }
   * 
   * Response:
   * {
   *   valid: boolean,
   *   message: string,
   *   pointsRemaining?: number
   * }
   */
  app.post('/api/characters/:id/allocations/attributes/validate', (req, res) => {
    try {
      const { level, attributes, previousAttributes } = req.body;

      if (!level || !attributes) {
        return res.status(400).json({
          success: false,
          error: 'level and attributes are required'
        });
      }

      const validation = pointAllocationService.validateAttributeAllocation(
        level,
        attributes,
        previousAttributes || {}
      );

      res.json({
        success: true,
        data: validation
      });
    } catch (error) {
      console.error('[Routes] Error validating attributes:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate attribute allocation'
      });
    }
  });

  /**
   * POST /api/characters/:id/allocations/skills/validate
   * 
   * Validate a skill allocation
   * 
   * Request body:
   * {
   *   level: number,
   *   skills: {skillName: rank},
   *   previousSkills: {skillName: rank} (optional)
   * }
   */
  app.post('/api/characters/:id/allocations/skills/validate', (req, res) => {
    try {
      const { level, skills, previousSkills } = req.body;

      if (!level || !skills) {
        return res.status(400).json({
          success: false,
          error: 'level and skills are required'
        });
      }

      const validation = pointAllocationService.validateSkillAllocation(
        level,
        skills,
        previousSkills || {}
      );

      res.json({
        success: true,
        data: validation
      });
    } catch (error) {
      console.error('[Routes] Error validating skills:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate skill allocation'
      });
    }
  });

  /**
   * POST /api/characters/:id/allocations/talents/validate
   * 
   * Validate a talent allocation
   * 
   * Request body:
   * {
   *   level: number,
   *   talents: {talentId: boolean},
   *   previousTalents: {talentId: boolean} (optional),
   *   tier0TalentId: string (optional)
   * }
   */
  app.post('/api/characters/:id/allocations/talents/validate', (req, res) => {
    try {
      const { level, talents, previousTalents, tier0TalentId } = req.body;

      if (!level || !talents) {
        return res.status(400).json({
          success: false,
          error: 'level and talents are required'
        });
      }

      const validation = pointAllocationService.validateTalentAllocation(
        level,
        talents,
        previousTalents || {},
        tier0TalentId
      );

      res.json({
        success: true,
        data: validation
      });
    } catch (error) {
      console.error('[Routes] Error validating talents:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate talent allocation'
      });
    }
  });
}

module.exports = createAllocationRoutes;
