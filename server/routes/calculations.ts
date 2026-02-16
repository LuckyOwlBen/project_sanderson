/**
 * Character Calculations Routes
 * 
 * REST endpoints for defense and derived attribute calculations.
 * These endpoints provide the single source of truth for all character stat calculations.
 * 
 * GET /api/characters/:id/calculations/defense
 * GET /api/characters/:id/calculations/derived
 * GET /api/characters/:id/calculations/all
 * POST /api/characters/:id/calculations/defense
 * POST /api/characters/:id/calculations/derived
 * POST /api/characters/:id/calculations/all
 */

import { characterCalculationsService } from '../services/character-calculations';

function createCalculationsRoutes(app) {
  console.log('[Routes] Registering calculations routes...');

  /**
   * GET /api/characters/:id/calculations/defense
   * 
   * Calculate physics defense for a character
   * 
   * Query params:
   *   strength: number (optional, default 0)
   *   quickness: number (optional, default 0)
   *   bonuses: JSON string (optional) - {source: value} map
   * 
   * Response:
   * {
   *   physicsDef: number,
   *   baseDef: number,
   *   speedBonus: number,
   *   strengthBonus: number,
   *   bonuses: number
   * }
   */
  app.get('/api/characters/:id/calculations/defense', (req, res) => {
    try {
      const { strength, quickness, bonuses } = req.query;

      const attrs = {
        strength: strength ? parseInt(strength as string, 10) : 0,
        quickness: quickness ? parseInt(quickness as string, 10) : 0
      };

      let bonusMap = {};
      if (bonuses && typeof bonuses === 'string') {
        try {
          bonusMap = JSON.parse(bonuses);
        } catch (e) {
          return res.status(400).json({
            success: false,
            error: 'Invalid bonuses JSON'
          });
        }
      }

      const validation = characterCalculationsService.validateAttributes(attrs);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }

      const defense = characterCalculationsService.calculatePhysicsDefense(attrs, bonusMap);

      res.json({
        success: true,
        data: defense
      });
    } catch (error) {
      console.error('[Routes] Error calculating defense:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate defense'
      });
    }
  });

  /**
   * POST /api/characters/:id/calculations/defense
   * 
   * Calculate defense with POST body (preferred for complex bonus objects)
   * 
   * Request body:
   * {
   *   attributes: {strength?, quickness?},
   *   bonuses: {source: value} (optional)
   * }
   */
  app.post('/api/characters/:id/calculations/defense', (req, res) => {
    try {
      const { attributes, bonuses } = req.body;

      if (!attributes) {
        return res.status(400).json({
          success: false,
          error: 'attributes required'
        });
      }

      const validation = characterCalculationsService.validateAttributes(attributes);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }

      const defense = characterCalculationsService.calculatePhysicsDefense(attributes, bonuses || {});

      res.json({
        success: true,
        data: defense
      });
    } catch (error) {
      console.error('[Routes] Error calculating defense:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate defense'
      });
    }
  });

  /**
   * GET /api/characters/:id/calculations/derived
   * 
   * Calculate derived attributes
   * 
   * Query params:
   *   strength: number (optional)
   *   quickness: number (optional)
   *   movementBonuses: number (optional)
   *   recoveryBonuses: string (optional) - like '+2' or '-1'
   */
  app.get('/api/characters/:id/calculations/derived', (req, res) => {
    try {
      const { strength, quickness, movementBonuses, recoveryBonuses } = req.query;

      const attrs = {
        strength: strength ? parseInt(strength as string, 10) : 0,
        quickness: quickness ? parseInt(quickness as string, 10) : 0
      };

      const movBonus = movementBonuses ? parseInt(movementBonuses as string, 10) : 0;
      const recBonus = recoveryBonuses ? (recoveryBonuses as string) : '';

      const validation = characterCalculationsService.validateAttributes(attrs);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }

      const derived = characterCalculationsService.getDerivedAttributes(attrs, movBonus, recBonus);

      res.json({
        success: true,
        data: derived
      });
    } catch (error) {
      console.error('[Routes] Error calculating derived attributes:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate derived attributes'
      });
    }
  });

  /**
   * POST /api/characters/:id/calculations/derived
   * 
   * Calculate derived attributes with POST body
   * 
   * Request body:
   * {
   *   attributes: {strength?, quickness?},
   *   movementBonuses: number (optional),
   *   recoveryBonuses: string (optional)
   * }
   */
  app.post('/api/characters/:id/calculations/derived', (req, res) => {
    try {
      const { attributes, movementBonuses, recoveryBonuses } = req.body;

      if (!attributes) {
        return res.status(400).json({
          success: false,
          error: 'attributes required'
        });
      }

      const validation = characterCalculationsService.validateAttributes(attributes);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }

      const derived = characterCalculationsService.getDerivedAttributes(
        attributes,
        movementBonuses || 0,
        recoveryBonuses || ''
      );

      res.json({
        success: true,
        data: derived
      });
    } catch (error) {
      console.error('[Routes] Error calculating derived attributes:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate derived attributes'
      });
    }
  });

  /**
   * GET /api/characters/:id/calculations/all
   * 
   * Calculate all character stats at once
   * 
   * Query params:
   *   strength: number
   *   quickness: number
   *   intellect: number
   *   awareness: number
   *   will: number
   *   presence: number
   *   defBonuses: JSON string (optional)
   *   movementBonuses: number (optional)
   *   recoveryBonuses: string (optional)
   */
  app.get('/api/characters/:id/calculations/all', (req, res) => {
    try {
      const { strength, quickness, intellect, awareness, will, presence, defBonuses, movementBonuses, recoveryBonuses } = req.query;

      const attrs = {
        strength: strength ? parseInt(strength as string, 10) : 0,
        quickness: quickness ? parseInt(quickness as string, 10) : 0,
        intellect: intellect ? parseInt(intellect as string, 10) : 0,
        awareness: awareness ? parseInt(awareness as string, 10) : 0,
        will: will ? parseInt(will as string, 10) : 0,
        presence: presence ? parseInt(presence as string, 10) : 0
      };

      let bonusMap = {};
      if (defBonuses && typeof defBonuses === 'string') {
        try {
          bonusMap = JSON.parse(defBonuses);
        } catch (e) {
          return res.status(400).json({
            success: false,
            error: 'Invalid defBonuses JSON'
          });
        }
      }

      const movBonus = movementBonuses ? parseInt(movementBonuses as string, 10) : 0;
      const recBonus = recoveryBonuses ? (recoveryBonuses as string) : '';

      const validation = characterCalculationsService.validateAttributes(attrs);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }

      const calculations = characterCalculationsService.calculateAll(attrs, bonusMap, movBonus, recBonus);

      res.json({
        success: true,
        data: calculations
      });
    } catch (error) {
      console.error('[Routes] Error calculating all stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate all stats'
      });
    }
  });

  /**
   * POST /api/characters/:id/calculations/all
   * 
   * Calculate all character stats with POST body (preferred)
   * 
   * Request body:
   * {
   *   attributes: {strength?, quickness?, ...},
   *   defBonuses: {source: value} (optional),
   *   movementBonuses: number (optional),
   *   recoveryBonuses: string (optional)
   * }
   */
  app.post('/api/characters/:id/calculations/all', (req, res) => {
    try {
      const { attributes, defBonuses, movementBonuses, recoveryBonuses } = req.body;

      if (!attributes) {
        return res.status(400).json({
          success: false,
          error: 'attributes required'
        });
      }

      const validation = characterCalculationsService.validateAttributes(attributes);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }

      const calculations = characterCalculationsService.calculateAll(
        attributes,
        defBonuses || {},
        movementBonuses || 0,
        recoveryBonuses || ''
      );

      res.json({
        success: true,
        data: calculations
      });
    } catch (error) {
      console.error('[Routes] Error calculating all stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate all stats'
      });
    }
  });
}

module.exports = createCalculationsRoutes;
