/**
 * Skill Calculations Routes
 * 
 * REST endpoints for skill total calculations.
 * Provides the single source of truth for all skill calculations.
 * 
 * GET /api/characters/:id/calculations/skills/single/:skillName
 * POST /api/characters/:id/calculations/skills/single
 * GET /api/characters/:id/calculations/skills/all
 * POST /api/characters/:id/calculations/skills/all
 * GET /api/characters/:id/calculations/skills/by-attribute/:attribute
 * GET /api/characters/:id/calculations/skills/surge-only
 * GET /api/characters/:id/calculations/skills/non-surge-only
 */

import { skillCalculationsService } from '../services/skill-calculations';

function createSkillCalculationsRoutes(app) {
  console.log('[Routes] Registering skill calculations routes...');

  /**
   * GET /api/characters/:id/calculations/skills/single/:skillName
   * 
   * Calculate total for a single skill
   * 
   * Query params:
   *   rank: number (default 0)
   *   strength: number
   *   quickness: number
   *   intellect: number
   *   awareness: number
   *   willpower: number
   *   presence: number
   * 
   * Response:
   * {
   *   skillName: string,
   *   rank: number,
   *   attributeModifier: number,
   *   total: number,
   *   associatedAttribute: string
   * }
   */
  app.get('/api/characters/:id/calculations/skills/single/:skillName', (req, res) => {
    try {
      const { skillName } = req.params;
      const { rank, strength, quickness, intellect, awareness, willpower, presence } = req.query;

      const skillRank = rank ? parseInt(rank as string, 10) : 0;
      const attrs = {
        strength: strength ? parseInt(strength as string, 10) : undefined,
        quickness: quickness ? parseInt(quickness as string, 10) : undefined,
        intellect: intellect ? parseInt(intellect as string, 10) : undefined,
        awareness: awareness ? parseInt(awareness as string, 10) : undefined,
        willpower: willpower ? parseInt(willpower as string, 10) : undefined,
        presence: presence ? parseInt(presence as string, 10) : undefined
      };

      const validation = skillCalculationsService.validateAttributes(attrs);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }

      const rankValidation = skillCalculationsService.validateSkillRank(skillRank);
      if (!rankValidation.valid) {
        return res.status(400).json({
          success: false,
          error: rankValidation.error
        });
      }

      const result = skillCalculationsService.calculateSkillTotal(skillName, skillRank, attrs);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[Routes] Error calculating single skill:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to calculate skill total'
      });
    }
  });

  /**
   * POST /api/characters/:id/calculations/skills/single
   * 
   * Calculate total for a single skill (preferred method)
   * 
   * Request body:
   * {
   *   skillName: string,
   *   rank: number,
   *   attributes: {strength?, quickness?, ...}
   * }
   */
  app.post('/api/characters/:id/calculations/skills/single', (req, res) => {
    try {
      const { skillName, rank, attributes } = req.body;

      if (!skillName) {
        return res.status(400).json({
          success: false,
          error: 'skillName required'
        });
      }

      const validation = skillCalculationsService.validateAttributes(attributes || {});
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }

      const result = skillCalculationsService.calculateSkillTotal(skillName, rank || 0, attributes || {});

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[Routes] Error calculating single skill:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to calculate skill total'
      });
    }
  });

  /**
   * GET /api/characters/:id/calculations/skills/all
   * 
   * Calculate totals for all skills
   * 
   * Query params:
   *   strength: number
   *   quickness: number
   *   intellect: number
   *   awareness: number
   *   willpower: number
   *   presence: number
   *   skills: JSON string with {skillName: rank}
   * 
   * Response: {skillName: SkillTotal}
   */
  app.get('/api/characters/:id/calculations/skills/all', (req, res) => {
    try {
      const { strength, quickness, intellect, awareness, willpower, presence, skills } = req.query;

      const attrs = {
        strength: strength ? parseInt(strength as string, 10) : undefined,
        quickness: quickness ? parseInt(quickness as string, 10) : undefined,
        intellect: intellect ? parseInt(intellect as string, 10) : undefined,
        awareness: awareness ? parseInt(awareness as string, 10) : undefined,
        willpower: willpower ? parseInt(willpower as string, 10) : undefined,
        presence: presence ? parseInt(presence as string, 10) : undefined
      };

      let skillRanks = {};
      if (skills && typeof skills === 'string') {
        try {
          skillRanks = JSON.parse(skills);
        } catch (e) {
          return res.status(400).json({
            success: false,
            error: 'Invalid skills JSON'
          });
        }
      }

      const validation = skillCalculationsService.validateAttributes(attrs);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }

      const results = skillCalculationsService.calculateAllSkillTotals(skillRanks, attrs);

      res.json({
        success: true,
        data: results
      });
    } catch (error: any) {
      console.error('[Routes] Error calculating all skills:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate all skill totals'
      });
    }
  });

  /**
   * POST /api/characters/:id/calculations/skills/all
   * 
   * Calculate totals for all skills (preferred method)
   * 
   * Request body:
   * {
   *   attributes: {strength?, quickness?, ...},
   *   skillRanks: {skillName: rank}
   * }
   */
  app.post('/api/characters/:id/calculations/skills/all', (req, res) => {
    try {
      const { attributes, skillRanks } = req.body;

      const validation = skillCalculationsService.validateAttributes(attributes || {});
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }

      const results = skillCalculationsService.calculateAllSkillTotals(skillRanks || {}, attributes || {});

      res.json({
        success: true,
        data: results
      });
    } catch (error: any) {
      console.error('[Routes] Error calculating all skills:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate all skill totals'
      });
    }
  });

  /**
   * GET /api/characters/:id/calculations/skills/by-attribute/:attribute
   * 
   * Get all skills for a specific attribute
   * 
   * Query params:
   *   strength, quickness, intellect, awareness, willpower, presence
   *   skills: JSON string
   */
  app.get('/api/characters/:id/calculations/skills/by-attribute/:attribute', (req, res) => {
    try {
      const { attribute } = req.params;
      const { strength, quickness, intellect, awareness, willpower, presence, skills } = req.query;

      const attrs = {
        strength: strength ? parseInt(strength as string, 10) : undefined,
        quickness: quickness ? parseInt(quickness as string, 10) : undefined,
        intellect: intellect ? parseInt(intellect as string, 10) : undefined,
        awareness: awareness ? parseInt(awareness as string, 10) : undefined,
        willpower: willpower ? parseInt(willpower as string, 10) : undefined,
        presence: presence ? parseInt(presence as string, 10) : undefined
      };

      let skillRanks = {};
      if (skills && typeof skills === 'string') {
        try {
          skillRanks = JSON.parse(skills);
        } catch (e) {
          return res.status(400).json({
            success: false,
            error: 'Invalid skills JSON'
          });
        }
      }

      const validation = skillCalculationsService.validateAttributes(attrs);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }

      const results = skillCalculationsService.calculateSkillsByAttribute(
        attribute as keyof typeof attrs,
        skillRanks,
        attrs
      );

      res.json({
        success: true,
        data: results
      });
    } catch (error: any) {
      console.error('[Routes] Error calculating skills by attribute:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate skills'
      });
    }
  });

  /**
   * GET /api/characters/:id/calculations/skills/surge-only
   * 
   * Get only surge skill totals
   * 
   * Query params: same as /all
   */
  app.get('/api/characters/:id/calculations/skills/surge-only', (req, res) => {
    try {
      const { strength, quickness, intellect, awareness, willpower, presence, skills } = req.query;

      const attrs = {
        strength: strength ? parseInt(strength as string, 10) : undefined,
        quickness: quickness ? parseInt(quickness as string, 10) : undefined,
        intellect: intellect ? parseInt(intellect as string, 10) : undefined,
        awareness: awareness ? parseInt(awareness as string, 10) : undefined,
        willpower: willpower ? parseInt(willpower as string, 10) : undefined,
        presence: presence ? parseInt(presence as string, 10) : undefined
      };

      let skillRanks = {};
      if (skills && typeof skills === 'string') {
        try {
          skillRanks = JSON.parse(skills);
        } catch (e) {
          return res.status(400).json({
            success: false,
            error: 'Invalid skills JSON'
          });
        }
      }

      const validation = skillCalculationsService.validateAttributes(attrs);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }

      const results = skillCalculationsService.calculateSurgeSkillTotals(skillRanks, attrs);

      res.json({
        success: true,
        data: results
      });
    } catch (error: any) {
      console.error('[Routes] Error calculating surge skills:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate surge skill totals'
      });
    }
  });

  /**
   * GET /api/characters/:id/calculations/skills/non-surge-only
   * 
   * Get only non-surge skill totals
   * 
   * Query params: same as /all
   */
  app.get('/api/characters/:id/calculations/skills/non-surge-only', (req, res) => {
    try {
      const { strength, quickness, intellect, awareness, willpower, presence, skills } = req.query;

      const attrs = {
        strength: strength ? parseInt(strength as string, 10) : undefined,
        quickness: quickness ? parseInt(quickness as string, 10) : undefined,
        intellect: intellect ? parseInt(intellect as string, 10) : undefined,
        awareness: awareness ? parseInt(awareness as string, 10) : undefined,
        willpower: willpower ? parseInt(willpower as string, 10) : undefined,
        presence: presence ? parseInt(presence as string, 10) : undefined
      };

      let skillRanks = {};
      if (skills && typeof skills === 'string') {
        try {
          skillRanks = JSON.parse(skills);
        } catch (e) {
          return res.status(400).json({
            success: false,
            error: 'Invalid skills JSON'
          });
        }
      }

      const validation = skillCalculationsService.validateAttributes(attrs);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }

      const results = skillCalculationsService.calculateNonSurgeSkillTotals(skillRanks, attrs);

      res.json({
        success: true,
        data: results
      });
    } catch (error: any) {
      console.error('[Routes] Error calculating non-surge skills:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate non-surge skill totals'
      });
    }
  });
}

module.exports = createSkillCalculationsRoutes;
