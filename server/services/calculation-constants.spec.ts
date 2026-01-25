/**
 * Calculation Constants Tests
 * 
 * Validates that all point-per-level arrays match game design specifications
 * and that calculation functions work correctly.
 */

import { describe, it, expect } from 'vitest';
import {
  ATTRIBUTE_POINTS_PER_LEVEL,
  SKILL_POINTS_PER_LEVEL,
  TALENT_POINTS_PER_LEVEL,
  HEALTH_PER_LEVEL,
  HEALTH_STRENGTH_BONUS_LEVELS,
  MAX_SKILL_RANKS_PER_LEVEL,
  SKILL_RANKS_PER_LEVEL,
  getAttributePointsForLevel,
  getTotalAttributePointsUpToLevel,
  getSkillPointsForLevel,
  getTotalSkillPointsUpToLevel,
  getTalentPointsForLevel,
  getTotalTalentPointsUpToLevel,
  getHealthForLevel,
  getMaxSkillRanksForLevel,
  getSkillRanksForLevel,
  getAllCalculationTables
} from './calculation-constants';

describe('Calculation Constants', () => {
  // ========================================================================
  // ARRAY STRUCTURE TESTS
  // ========================================================================

  describe('Array lengths', () => {
    it('should have 21 entries for all point tables (levels 1-21)', () => {
      expect(ATTRIBUTE_POINTS_PER_LEVEL).toHaveLength(21);
      expect(SKILL_POINTS_PER_LEVEL).toHaveLength(21);
      expect(TALENT_POINTS_PER_LEVEL).toHaveLength(21);
      expect(HEALTH_PER_LEVEL).toHaveLength(21);
      expect(MAX_SKILL_RANKS_PER_LEVEL).toHaveLength(21);
      expect(SKILL_RANKS_PER_LEVEL).toHaveLength(21);
    });
  });

  // ========================================================================
  // ATTRIBUTE POINTS TESTS
  // ========================================================================

  describe('Attribute Points', () => {
    it('should return 12 points at level 1', () => {
      expect(getAttributePointsForLevel(1)).toBe(12);
    });

    it('should return correct points for bonus levels (3,6,9,12,15,18)', () => {
      expect(getAttributePointsForLevel(3)).toBe(1);
      expect(getAttributePointsForLevel(6)).toBe(1);
      expect(getAttributePointsForLevel(9)).toBe(1);
      expect(getAttributePointsForLevel(12)).toBe(1);
      expect(getAttributePointsForLevel(15)).toBe(1);
      expect(getAttributePointsForLevel(18)).toBe(1);
    });

    it('should return 0 points for non-bonus levels', () => {
      expect(getAttributePointsForLevel(2)).toBe(0);
      expect(getAttributePointsForLevel(4)).toBe(0);
      expect(getAttributePointsForLevel(5)).toBe(0);
    });

    it('should return 0 for invalid level', () => {
      expect(getAttributePointsForLevel(0)).toBe(0);
      expect(getAttributePointsForLevel(99)).toBe(0);
      expect(getAttributePointsForLevel(-1)).toBe(0);
    });

    it('should calculate total attribute points up to level 21 as 18', () => {
      const total = getTotalAttributePointsUpToLevel(21);
      expect(total).toBe(18); // 12 + 6*1 = 18
    });

    it('should calculate cumulative totals correctly', () => {
      expect(getTotalAttributePointsUpToLevel(1)).toBe(12);
      expect(getTotalAttributePointsUpToLevel(3)).toBe(13); // 12 + 1
      expect(getTotalAttributePointsUpToLevel(6)).toBe(14); // 12 + 1 + 1
    });
  });

  // ========================================================================
  // SKILL POINTS TESTS
  // ========================================================================

  describe('Skill Points', () => {
    it('should return 4 points at level 1', () => {
      expect(getSkillPointsForLevel(1)).toBe(4);
    });

    it('should return 2 points for all levels 2-21', () => {
      for (let level = 2; level <= 21; level++) {
        expect(getSkillPointsForLevel(level)).toBe(2);
      }
    });

    it('should calculate total skill points up to level 21 as 46', () => {
      const total = getTotalSkillPointsUpToLevel(21);
      expect(total).toBe(46); // 4 + 20*2 = 44
    });

    it('should calculate cumulative totals correctly', () => {
      expect(getTotalSkillPointsUpToLevel(1)).toBe(4);
      expect(getTotalSkillPointsUpToLevel(2)).toBe(6); // 4 + 2
      expect(getTotalSkillPointsUpToLevel(3)).toBe(8); // 4 + 2 + 2
    });
  });

  // ========================================================================
  // TALENT POINTS TESTS
  // ========================================================================

  describe('Talent Points', () => {
    it('should return 2 points at level 1', () => {
      expect(getTalentPointsForLevel(1)).toBe(2);
    });

    it('should return 2 points at bonus levels (1, 6, 11, 16)', () => {
      expect(getTalentPointsForLevel(1)).toBe(2);
      expect(getTalentPointsForLevel(6)).toBe(2);
      expect(getTalentPointsForLevel(11)).toBe(2);
      expect(getTalentPointsForLevel(16)).toBe(2);
    });

    it('should return 1 point for non-bonus levels', () => {
      expect(getTalentPointsForLevel(2)).toBe(1);
      expect(getTalentPointsForLevel(7)).toBe(1);
      expect(getTalentPointsForLevel(12)).toBe(1);
    });

    it('should calculate total talent points up to level 21 as 25', () => {
      const total = getTotalTalentPointsUpToLevel(21);
      expect(total).toBe(25); // 2 + 1*4 + 2 + 1*4 + 2 + 1*4 + 2 + 1*5 = 25
    });

    it('should match frontend hardcoded values', () => {
      const expected = [2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1];
      expected.forEach((val, idx) => {
        expect(getTalentPointsForLevel(idx + 1)).toBe(val);
      });
    });
  });

  // ========================================================================
  // HEALTH TESTS
  // ========================================================================

  describe('Health Calculations', () => {
    it('should apply strength modifier only at bonus levels', () => {
      const strengthMod = 2;
      
      // Level 1 is bonus level
      expect(getHealthForLevel(1, strengthMod)).toBe(10 + strengthMod);
      
      // Level 2 is not bonus level
      expect(getHealthForLevel(2, strengthMod)).toBe(5); // no modifier
      
      // Level 6 is bonus level
      expect(getHealthForLevel(6, strengthMod)).toBe(4 + strengthMod);
    });

    it('should apply strength bonus at levels 1, 6, 11, 16, 21', () => {
      const bonusLevels = [1, 6, 11, 16, 21];
      bonusLevels.forEach(level => {
        expect(HEALTH_STRENGTH_BONUS_LEVELS).toContain(level);
      });
    });

    it('should handle negative strength modifiers', () => {
      const strengthMod = -1;
      expect(getHealthForLevel(1, strengthMod)).toBe(10 - 1); // 9
    });

    it('should return 0 for invalid level', () => {
      expect(getHealthForLevel(0, 0)).toBe(0);
      expect(getHealthForLevel(99, 0)).toBe(0);
    });
  });

  // ========================================================================
  // SKILL RANKS TESTS
  // ========================================================================

  describe('Skill Ranks', () => {
    it('should return correct max ranks per level', () => {
      expect(getMaxSkillRanksForLevel(1)).toBe(2);  // Levels 1-5
      expect(getMaxSkillRanksForLevel(5)).toBe(2);
      
      expect(getMaxSkillRanksForLevel(6)).toBe(3);  // Levels 6-10
      expect(getMaxSkillRanksForLevel(10)).toBe(3);
      
      expect(getMaxSkillRanksForLevel(11)).toBe(4); // Levels 11-15
      expect(getMaxSkillRanksForLevel(15)).toBe(4);
      
      expect(getMaxSkillRanksForLevel(16)).toBe(5); // Levels 16-21
      expect(getMaxSkillRanksForLevel(21)).toBe(5);
    });

    it('should return correct skill ranks per level', () => {
      expect(getSkillRanksForLevel(1)).toBe(5);  // Level 1
      expect(getSkillRanksForLevel(2)).toBe(2);  // Levels 2-20
      expect(getSkillRanksForLevel(20)).toBe(2);
      expect(getSkillRanksForLevel(21)).toBe(0); // Terminal level
    });
  });

  // ========================================================================
  // API EXPORT TESTS
  // ========================================================================

  describe('getAllCalculationTables()', () => {
    it('should return all tables in single object', () => {
      const tables = getAllCalculationTables();
      
      expect(tables).toHaveProperty('attributePointsPerLevel');
      expect(tables).toHaveProperty('skillPointsPerLevel');
      expect(tables).toHaveProperty('talentPointsPerLevel');
      expect(tables).toHaveProperty('healthPerLevel');
      expect(tables).toHaveProperty('healthStrengthBonusLevels');
      expect(tables).toHaveProperty('maxSkillRanksPerLevel');
      expect(tables).toHaveProperty('skillRanksPerLevel');
    });

    it('should return same arrays as individual exports', () => {
      const tables = getAllCalculationTables();
      
      expect(tables.attributePointsPerLevel).toEqual(ATTRIBUTE_POINTS_PER_LEVEL);
      expect(tables.skillPointsPerLevel).toEqual(SKILL_POINTS_PER_LEVEL);
      expect(tables.talentPointsPerLevel).toEqual(TALENT_POINTS_PER_LEVEL);
    });
  });

  // ========================================================================
  // EDGE CASE TESTS
  // ========================================================================

  describe('Edge Cases', () => {
    it('should handle level 0 gracefully', () => {
      expect(getAttributePointsForLevel(0)).toBe(0);
      expect(getTotalAttributePointsUpToLevel(0)).toBe(0);
    });

    it('should handle very high levels gracefully', () => {
      expect(getAttributePointsForLevel(1000)).toBe(0);
      expect(getTotalAttributePointsUpToLevel(1000)).toBe(18); // Caps at level 21
    });

    it('should handle negative strength modifiers in health calc', () => {
      const health = getHealthForLevel(1, -5);
      expect(health).toBe(5); // 10 - 5
    });
  });
});
