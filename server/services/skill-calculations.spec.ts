/**
 * Skill Calculations Service Tests
 * 
 * Validates skill total calculations and skill associations
 */

import { describe, it, expect } from 'vitest';
import {
  SkillCalculationsService,
  SkillRanks,
  Attributes,
  SKILL_ASSOCIATIONS,
  SURGE_SKILLS
} from './skill-calculations';

describe('SkillCalculationsService', () => {
  const service = new SkillCalculationsService();

  // ========================================================================
  // SKILL ASSOCIATION TESTS
  // ========================================================================

  describe('getSkillAssociation', () => {
    it('should return correct attribute for physical skills', () => {
      expect(service.getSkillAssociation('ATHLETICS')).toBe('strength');
      expect(service.getSkillAssociation('AGILITY')).toBe('quickness');
      expect(service.getSkillAssociation('STEALTH')).toBe('quickness');
      expect(service.getSkillAssociation('HEAVY_WEAPONRY')).toBe('strength');
      expect(service.getSkillAssociation('LIGHT_WEAPONRY')).toBe('quickness');
    });

    it('should return correct attribute for mental skills', () => {
      expect(service.getSkillAssociation('CRAFTING')).toBe('intellect');
      expect(service.getSkillAssociation('DEDUCTION')).toBe('intellect');
      expect(service.getSkillAssociation('LORE')).toBe('intellect');
      expect(service.getSkillAssociation('MEDICINE')).toBe('intellect');
      expect(service.getSkillAssociation('DISCIPLINE')).toBe('willpower');
      expect(service.getSkillAssociation('INTIMIDATION')).toBe('willpower');
    });

    it('should return correct attribute for social skills', () => {
      expect(service.getSkillAssociation('DECEPTION')).toBe('presence');
      expect(service.getSkillAssociation('LEADERSHIP')).toBe('presence');
      expect(service.getSkillAssociation('PERSUASION')).toBe('presence');
      expect(service.getSkillAssociation('INSIGHT')).toBe('awareness');
      expect(service.getSkillAssociation('PERCEPTION')).toBe('awareness');
      expect(service.getSkillAssociation('SURVIVAL')).toBe('awareness');
    });

    it('should return willpower for all surge skills', () => {
      for (const surgeSkill of SURGE_SKILLS) {
        expect(service.getSkillAssociation(surgeSkill)).toBe('willpower');
      }
    });

    it('should throw error for unknown skill', () => {
      expect(() => service.getSkillAssociation('UNKNOWN_SKILL')).toThrow();
    });
  });

  describe('isSurgeSkill', () => {
    it('should identify surge skills correctly', () => {
      expect(service.isSurgeSkill('ADHESION')).toBe(true);
      expect(service.isSurgeSkill('GRAVITATION')).toBe(true);
      expect(service.isSurgeSkill('PROGRESSION')).toBe(true);
    });

    it('should return false for non-surge skills', () => {
      expect(service.isSurgeSkill('ATHLETICS')).toBe(false);
      expect(service.isSurgeSkill('STEALTH')).toBe(false);
      expect(service.isSurgeSkill('DECEPTION')).toBe(false);
    });
  });

  // ========================================================================
  // ATTRIBUTE MODIFIER TESTS
  // ========================================================================

  describe('calculateAttributeModifier', () => {
    it('should calculate modifier as attribute / 2 rounded down', () => {
      expect(service.calculateAttributeModifier(10)).toBe(5);
      expect(service.calculateAttributeModifier(11)).toBe(5); // 11/2 = 5.5 -> 5
      expect(service.calculateAttributeModifier(12)).toBe(6);
    });

    it('should handle low attribute values', () => {
      expect(service.calculateAttributeModifier(1)).toBe(0);
      expect(service.calculateAttributeModifier(2)).toBe(1);
      expect(service.calculateAttributeModifier(3)).toBe(1);
    });

    it('should handle high attribute values', () => {
      expect(service.calculateAttributeModifier(20)).toBe(10);
      expect(service.calculateAttributeModifier(21)).toBe(10);
    });

    it('should default to 0 for undefined attribute', () => {
      expect(service.calculateAttributeModifier()).toBe(0);
    });

    it('should throw error for negative value', () => {
      expect(() => service.calculateAttributeModifier(-1)).toThrow();
    });
  });

  // ========================================================================
  // SKILL TOTAL CALCULATION TESTS
  // ========================================================================

  describe('calculateSkillTotal', () => {
    it('should calculate skill total correctly', () => {
      const attrs: Attributes = { strength: 12 };
      const result = service.calculateSkillTotal('ATHLETICS', 3, attrs);
      
      expect(result.skillName).toBe('ATHLETICS');
      expect(result.rank).toBe(3);
      expect(result.attributeModifier).toBe(6); // 12/2
      expect(result.total).toBe(9); // 3 + 6
      expect(result.associatedAttribute).toBe('strength');
    });

    it('should handle rank 0', () => {
      const result = service.calculateSkillTotal('ATHLETICS', 0, { strength: 10 });
      expect(result.total).toBe(5); // 0 + 5
    });

    it('should handle rank 5', () => {
      const result = service.calculateSkillTotal('ATHLETICS', 5, { strength: 10 });
      expect(result.total).toBe(10); // 5 + 5
    });

    it('should default to rank 0', () => {
      const result = service.calculateSkillTotal('ATHLETICS', undefined as any, { strength: 10 });
      expect(result.rank).toBe(0);
      expect(result.total).toBe(5);
    });

    it('should default to empty attributes', () => {
      const result = service.calculateSkillTotal('ATHLETICS');
      expect(result.attributeModifier).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should handle different attribute associations', () => {
      const attrs: Attributes = { quickness: 14 };
      const result = service.calculateSkillTotal('STEALTH', 2, attrs);
      expect(result.attributeModifier).toBe(7); // 14/2
      expect(result.total).toBe(9); // 2 + 7
    });

    it('should throw error for unknown skill', () => {
      expect(() => service.calculateSkillTotal('UNKNOWN')).toThrow();
    });
  });

  // ========================================================================
  // ALL SKILL TOTALS TESTS
  // ========================================================================

  describe('calculateAllSkillTotals', () => {
    it('should calculate totals for all skills', () => {
      const skillRanks: SkillRanks = {
        'ATHLETICS': 3,
        'STEALTH': 2,
        'DECEPTION': 1
      };
      const attrs: Attributes = {
        strength: 12,
        quickness: 14,
        presence: 10
      };
      
      const results = service.calculateAllSkillTotals(skillRanks, attrs);
      
      expect(results['ATHLETICS'].total).toBe(9);   // 3 + 6(str)
      expect(results['STEALTH'].total).toBe(9);     // 2 + 7(qck)
      expect(results['DECEPTION'].total).toBe(6);   // 1 + 5(prs)
    });

    it('should include all known skills', () => {
      const results = service.calculateAllSkillTotals({}, {});
      expect(Object.keys(results).length).toBe(Object.keys(SKILL_ASSOCIATIONS).length);
    });

    it('should handle empty skill ranks', () => {
      const results = service.calculateAllSkillTotals({}, { strength: 10 });
      expect(results['ATHLETICS'].rank).toBe(0);
      expect(results['ATHLETICS'].total).toBe(5); // 0 + 5(str/2)
    });

    it('should handle empty attributes', () => {
      const results = service.calculateAllSkillTotals({ 'ATHLETICS': 3 }, {});
      expect(results['ATHLETICS'].total).toBe(3); // 3 + 0
    });
  });

  // ========================================================================
  // SURGE SKILL TESTS
  // ========================================================================

  describe('calculateSurgeSkillTotals', () => {
    it('should return only surge skills', () => {
      const skillRanks: SkillRanks = {
        'ATHLETICS': 2,
        'ADHESION': 1,
        'GRAVITATION': 2,
        'PROGRESSION': 1
      };
      const attrs: Attributes = { willpower: 12 };
      
      const results = service.calculateSurgeSkillTotals(skillRanks, attrs);
      
      expect(results['ATHLETICS']).toBeUndefined();
      expect(results['ADHESION']).toBeDefined();
      expect(results['GRAVITATION']).toBeDefined();
      expect(Object.keys(results).length).toBeGreaterThanOrEqual(3);
    });

    it('should calculate surge skill totals correctly', () => {
      const results = service.calculateSurgeSkillTotals(
        { 'ADHESION': 3, 'PROGRESSION': 2 },
        { willpower: 14 }
      );
      
      expect(results['ADHESION'].total).toBe(10);   // 3 + 7(wil/2)
      expect(results['PROGRESSION'].total).toBe(9); // 2 + 7(wil/2)
    });
  });

  describe('calculateNonSurgeSkillTotals', () => {
    it('should return only non-surge skills', () => {
      const skillRanks: SkillRanks = {
        'ATHLETICS': 2,
        'ADHESION': 1,
        'STEALTH': 2
      };
      
      const results = service.calculateNonSurgeSkillTotals(skillRanks, {});
      
      expect(results['ATHLETICS']).toBeDefined();
      expect(results['STEALTH']).toBeDefined();
      expect(results['ADHESION']).toBeUndefined();
    });
  });

  // ========================================================================
  // SKILL BY ATTRIBUTE TESTS
  // ========================================================================

  describe('calculateSkillsByAttribute', () => {
    it('should return only skills for specified attribute', () => {
      const skillRanks: SkillRanks = {
        'ATHLETICS': 2,
        'HEAVY_WEAPONRY': 1,
        'STEALTH': 2,
        'CRAFTING': 2
      };
      const attrs: Attributes = {
        strength: 12,
        quickness: 12,
        intellect: 12
      };
      
      const strengths = service.calculateSkillsByAttribute('strength', skillRanks, attrs);
      expect(strengths['ATHLETICS']).toBeDefined();
      expect(strengths['HEAVY_WEAPONRY']).toBeDefined();
      expect(strengths['STEALTH']).toBeUndefined();
      expect(strengths['CRAFTING']).toBeUndefined();
    });

    it('should calculate all quickness-based skills', () => {
      const skillRanks: SkillRanks = {
        'AGILITY': 2,
        'LIGHT_WEAPONRY': 1,
        'STEALTH': 3,
        'THIEVERY': 2
      };
      const attrs: Attributes = { quickness: 14 };
      
      const quickSkills = service.calculateSkillsByAttribute('quickness', skillRanks, attrs);
      expect(Object.keys(quickSkills).length).toBe(4);
      expect(quickSkills['AGILITY'].total).toBe(9); // 2 + 7
    });
  });

  // ========================================================================
  // VALIDATION TESTS
  // ========================================================================

  describe('validateSkillRank', () => {
    it('should accept valid ranks 0-5', () => {
      for (let i = 0; i <= 5; i++) {
        const result = service.validateSkillRank(i);
        expect(result.valid).toBe(true);
      }
    });

    it('should reject negative ranks', () => {
      const result = service.validateSkillRank(-1);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('negative');
    });

    it('should reject ranks above max', () => {
      const result = service.validateSkillRank(6);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceed');
    });

    it('should reject non-numeric ranks', () => {
      const result = service.validateSkillRank('three' as any);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be a number');
    });

    it('should respect custom max rank', () => {
      const result = service.validateSkillRank(3, 2);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateAllSkillRanks', () => {
    it('should accept valid skill ranks', () => {
      const ranks: SkillRanks = {
        'ATHLETICS': 3,
        'STEALTH': 2,
        'DECEPTION': 5
      };
      const result = service.validateAllSkillRanks(ranks);
      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it('should reject invalid ranks', () => {
      const ranks: SkillRanks = {
        'ATHLETICS': 6,
        'STEALTH': -1
      };
      const result = service.validateAllSkillRanks(ranks);
      expect(result.valid).toBe(false);
      expect(result.errors['ATHLETICS']).toBeDefined();
      expect(result.errors['STEALTH']).toBeDefined();
    });
  });

  describe('validateAttributes', () => {
    it('should accept valid attributes', () => {
      const result = service.validateAttributes({
        strength: 10,
        quickness: 12,
        intellect: 11
      });
      expect(result.valid).toBe(true);
    });

    it('should reject non-numeric attributes', () => {
      const result = service.validateAttributes({ strength: 'ten' as any });
      expect(result.valid).toBe(false);
    });

    it('should reject negative attributes', () => {
      const result = service.validateAttributes({ strength: -1 });
      expect(result.valid).toBe(false);
    });

    it('should reject null/undefined', () => {
      expect(service.validateAttributes(null as any).valid).toBe(false);
      expect(service.validateAttributes(undefined as any).valid).toBe(false);
    });
  });

  // ========================================================================
  // AGGREGATE TESTS
  // ========================================================================

  describe('getHighestSkillRank', () => {
    it('should return highest rank', () => {
      const ranks: SkillRanks = {
        'ATHLETICS': 2,
        'STEALTH': 5,
        'DECEPTION': 3
      };
      expect(service.getHighestSkillRank(ranks)).toBe(5);
    });

    it('should return 0 for empty skills', () => {
      expect(service.getHighestSkillRank({})).toBe(0);
    });
  });

  describe('getHighestSkillTotal', () => {
    it('should return highest total', () => {
      const ranks: SkillRanks = {
        'ATHLETICS': 3,
        'STEALTH': 2
      };
      const attrs: Attributes = {
        strength: 16,  // +8
        quickness: 10  // +5
      };
      // ATHLETICS = 3 + 8 = 11
      // STEALTH = 2 + 5 = 7
      expect(service.getHighestSkillTotal(ranks, attrs)).toBe(11);
    });
  });

  describe('getAverageSkillRank', () => {
    it('should calculate average rank', () => {
      const ranks: SkillRanks = {
        'ATHLETICS': 2,
        'STEALTH': 4,
        'DECEPTION': 3
      };
      expect(service.getAverageSkillRank(ranks)).toBe(3); // (2+4+3)/3
    });

    it('should return 0 for empty skills', () => {
      expect(service.getAverageSkillRank({})).toBe(0);
    });
  });

  describe('getAverageSkillTotal', () => {
    it('should calculate average total', () => {
      const ranks: SkillRanks = {
        'ATHLETICS': 2,
        'STEALTH': 2
      };
      const attrs: Attributes = {
        strength: 12,
        quickness: 12
      };
      // ATHLETICS = 2 + 6 = 8
      // STEALTH = 2 + 6 = 8
      // Average = 8
      expect(service.getAverageSkillTotal(ranks, attrs)).toBe(8);
    });
  });

  // ========================================================================
  // INTEGRATION TESTS
  // ========================================================================

  describe('Complete Character Sheet', () => {
    it('should calculate full skill sheet for standard character', () => {
      const skillRanks: SkillRanks = {
        'ATHLETICS': 3,
        'LIGHT_WEAPONRY': 2,
        'STEALTH': 2,
        'DECEPTION': 1,
        'CRAFTING': 2,
        'PERCEPTION': 2,
        'ADHESION': 1
      };
      const attrs: Attributes = {
        strength: 12,
        quickness: 14,
        intellect: 10,
        awareness: 11,
        willpower: 12,
        presence: 10
      };

      const allTotals = service.calculateAllSkillTotals(skillRanks, attrs);

      // Verify some specific skills
      expect(allTotals['ATHLETICS'].total).toBe(9);    // 3 + 6(str)
      expect(allTotals['LIGHT_WEAPONRY'].total).toBe(9); // 2 + 7(qck)
      expect(allTotals['STEALTH'].total).toBe(9);      // 2 + 7(qck)
      expect(allTotals['DECEPTION'].total).toBe(6);    // 1 + 5(prs)
      expect(allTotals['CRAFTING'].total).toBe(7);     // 2 + 5(int)
      expect(allTotals['PERCEPTION'].total).toBe(7);   // 2 + 5(awr)
      expect(allTotals['ADHESION'].total).toBe(7);     // 1 + 6(wil)
    });
  });
});
