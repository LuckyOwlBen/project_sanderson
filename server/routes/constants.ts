/**
 * Calculation Constants Routes
 * 
 * Exposes point-per-level arrays and calculation functions via API
 * This is the single source of truth for character progression calculations
 * 
 * GET /api/constants/point-tables
 * Returns all calculation constants as JSON
 */

import { getAllCalculationTables } from '../services/calculation-constants';

function createConstantsRoutes(app) {
  console.log('[Routes] Registering constants routes...');

  /**
   * GET /api/constants/point-tables
   * 
   * Returns all point-per-level tables and health/skill progression data
   * 
   * Response:
   * {
   *   attributePointsPerLevel: number[],
   *   skillPointsPerLevel: number[],
   *   talentPointsPerLevel: number[],
   *   healthPerLevel: number[],
   *   healthStrengthBonusLevels: number[],
   *   maxSkillRanksPerLevel: number[],
   *   skillRanksPerLevel: number[]
   * }
   */
  app.get('/api/constants/point-tables', (req, res) => {
    try {
      const tables = getAllCalculationTables();
      res.json({
        success: true,
        data: tables
      });
    } catch (error) {
      console.error('[Routes] Error fetching constants:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch calculation constants'
      });
    }
  });

  /**
   * GET /api/constants/attribute-points
   * Returns only attribute points per level (convenience endpoint)
   */
  app.get('/api/constants/attribute-points', (req, res) => {
    try {
      const tables = getAllCalculationTables();
      res.json({
        success: true,
        data: tables.attributePointsPerLevel
      });
    } catch (error) {
      console.error('[Routes] Error fetching attribute constants:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch attribute constants'
      });
    }
  });

  /**
   * GET /api/constants/skill-points
   * Returns only skill points per level (convenience endpoint)
   */
  app.get('/api/constants/skill-points', (req, res) => {
    try {
      const tables = getAllCalculationTables();
      res.json({
        success: true,
        data: tables.skillPointsPerLevel
      });
    } catch (error) {
      console.error('[Routes] Error fetching skill constants:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch skill constants'
      });
    }
  });

  /**
   * GET /api/constants/talent-points
   * Returns only talent points per level (convenience endpoint)
   */
  app.get('/api/constants/talent-points', (req, res) => {
    try {
      const tables = getAllCalculationTables();
      res.json({
        success: true,
        data: tables.talentPointsPerLevel
      });
    } catch (error) {
      console.error('[Routes] Error fetching talent constants:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch talent constants'
      });
    }
  });
}

export default createConstantsRoutes;
