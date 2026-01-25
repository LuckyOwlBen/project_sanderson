/**
 * Point Allocation Service Tests
 * 
 * Validates all business logic for attribute, skill, and talent allocations
 * Ensures point calculations are accurate and validation rules are enforced
 */

import { describe, it, expect } from 'vitest';
import {
  PointAllocationService,
  Attributes,
  Skills,
  Talents,
  ValidationResult
} from './point-allocation-service';

describe('PointAllocationService', () => {
  const service = new PointAllocationService();

  // ========================================================================
  // ATTRIBUTE ALLOCATION TESTS
  // ========================================================================

  describe('Attribute Allocation', () => {
    describe('getTotalAttributePointsAvailable', () => {
      it('should return 12 for level 1', () => {
        expect(service.getTotalAttributePointsAvailable(1)).toBe(12);
      });

      it('should return 13 for level 3 (12 + 1)', () => {
        expect(service.getTotalAttributePointsAvailable(3)).toBe(13);
      });

      it('should return 18 for level 21 (all 6 bonus levels)', () => {
        expect(service.getTotalAttributePointsAvailable(21)).toBe(18);
      });
    });

    describe('validateAttributeAllocation', () => {
      const validAttributes: Attributes = {
        strength: 3,
        quickness: 2,
        intellect: 2,
        awareness: 2,
        will: 2,
        presence: 1
      };

      it('should accept valid level 1 allocation (12 points total)', () => {
        const result = service.validateAttributeAllocation(1, validAttributes);
        expect(result.valid).toBe(true);
      });

      it('should reject missing attributes', () => {
        const incomplete: Attributes = {
          strength: 3,
          quickness: 2,
          intellect: 2,
          awareness: 2,
          will: 2
          // missing presence
        };
        const result = service.validateAttributeAllocation(1, incomplete);
        expect(result.valid).toBe(false);
        expect(result.message).toContain('Missing attribute');
      });

      it('should reject attributes below 1', () => {
        const invalid: Attributes = {
          ...validAttributes,
          presence: 0
        };
        const result = service.validateAttributeAllocation(1, invalid);
        expect(result.valid).toBe(false);
        expect(result.message).toContain('at least 1');
      });

      it('should reject non-numeric attributes', () => {
        const invalid = { ...validAttributes } as any;
        invalid.strength = 'three';
        const result = service.validateAttributeAllocation(1, invalid);
        expect(result.valid).toBe(false);
        expect(result.message).toContain('must be a number');
      });

      it('should reject incorrect total points', () => {
        const tooMany: Attributes = {
          strength: 4,
          quickness: 3,
          intellect: 2,
          awareness: 2,
          will: 2,
          presence: 1
        };
        const result = service.validateAttributeAllocation(1, tooMany);
        expect(result.valid).toBe(false);
        expect(result.message).toContain('Total points incorrect');
      });

      it('should support level-up allocations with previous values', () => {
        const previous: Attributes = validAttributes;
        const levelUp: Attributes = {
          strength: 4,  // +1
          quickness: 2,
          intellect: 2,
          awareness: 2,
          will: 2,
          presence: 1
        };
        // Level 3 should have +1 point available
        const result = service.validateAttributeAllocation(3, levelUp, previous);
        expect(result.valid).toBe(true);
      });
    });

    describe('getAttributeSlice', () => {
      it('should return correct slice for level 1 creation', () => {
        const attrs: Attributes = {
          strength: 3,
          quickness: 2,
          intellect: 2,
          awareness: 2,
          will: 2,
          presence: 1
        };
        const slice = service.getAttributeSlice(1, attrs, true);
        
        expect(slice.currentLevel).toBe(1);
        expect(slice.isCreation).toBe(true);
        expect(slice.pointsAvailable).toBe(12);
        expect(slice.pointsTotal).toBe(12);
        expect(slice.canProceed).toBe(true);
      });

      it('should mark cannot proceed if points incorrect', () => {
        const attrs: Attributes = {
          strength: 4,
          quickness: 2,
          intellect: 2,
          awareness: 2,
          will: 2,
          presence: 1
        };
        const slice = service.getAttributeSlice(1, attrs, true);
        expect(slice.canProceed).toBe(false);
      });
    });
  });

  // ========================================================================
  // SKILL ALLOCATION TESTS
  // ========================================================================

  describe('Skill Allocation', () => {
    describe('getTotalSkillPointsAvailable', () => {
      it('should return 4 for level 1', () => {
        expect(service.getTotalSkillPointsAvailable(1)).toBe(4);
      });

      it('should return 46 for level 21 (4 + 20*2)', () => {
        expect(service.getTotalSkillPointsAvailable(21)).toBe(44);
      });
    });

    describe('validateSkillAllocation', () => {
      it('should accept valid level 1 allocation (4 points)', () => {
        const skills: Skills = {
          'Athletics': 2,
          'Acrobatics': 2
        };
        const result = service.validateSkillAllocation(1, skills, {}, true);
        expect(result.valid).toBe(true);
      });

      it('should reject invalid rank (> 5)', () => {
        const skills: Skills = {
          'Athletics': 6
        };
        const result = service.validateSkillAllocation(1, skills, {});
        expect(result.valid).toBe(false);
        expect(result.message).toContain('0-5');
      });

      it('should reject negative ranks', () => {
        const skills: Skills = {
          'Athletics': -1
        };
        const result = service.validateSkillAllocation(1, skills, {});
        expect(result.valid).toBe(false);
      });

      it('should reject decreasing ranks', () => {
        const previous: Skills = { 'Athletics': 3 };
        const current: Skills = { 'Athletics': 2 };
        const result = service.validateSkillAllocation(2, current, previous);
        expect(result.valid).toBe(false);
        expect(result.message).toContain('Cannot decrease');
      });

      it('should reject incorrect points spent', () => {
        const skills: Skills = {
          'Athletics': 1,
          'Acrobatics': 1
        };
        // Level 1 has 4 points available, this spends only 2
        const result = service.validateSkillAllocation(1, skills, {}, true);
        expect(result.valid).toBe(false);
        expect(result.message).toContain('Points spent this level incorrect');
      });

      it('should validate level-up allocation with previous skills', () => {
        const previous: Skills = {
          'Athletics': 2,
          'Acrobatics': 2
        };
        const current: Skills = {
          'Athletics': 3,  // +1
          'Acrobatics': 3  // +1
        };
        // Level 2 has 2 points available
        const result = service.validateSkillAllocation(2, current, previous);
        expect(result.valid).toBe(true);
      });

      it('should allow keeping previous skills at same rank', () => {
        const previous: Skills = {
          'Athletics': 2,
          'Acrobatics': 2
        };
        const current: Skills = {
          'Athletics': 2,
          'Acrobatics': 3,  // +1
          'Stealth': 1      // +1 new skill
        };
        const result = service.validateSkillAllocation(2, current, previous);
        expect(result.valid).toBe(true);
      });
    });

    describe('getSkillSlice', () => {
      it('should return correct slice for level 1 creation', () => {
        const skills: Skills = {
          'Athletics': 2,
          'Acrobatics': 2
        };
        const slice = service.getSkillSlice(1, skills, {}, true);
        
        expect(slice.currentLevel).toBe(1);
        expect(slice.isCreation).toBe(true);
        expect(slice.pointsAvailable).toBe(4);
        expect(slice.canProceed).toBe(true);
      });

      it('should track remaining points correctly', () => {
        const skills: Skills = {
          'Athletics': 2,
          'Acrobatics': 1
        };
        const slice = service.getSkillSlice(1, skills, {}, true);
        expect(slice.validation.pointsRemaining).toBe(1);
      });
    });
  });

  // ========================================================================
  // TALENT ALLOCATION TESTS
  // ========================================================================

  describe('Talent Allocation', () => {
    describe('getTotalTalentPointsAvailable', () => {
      it('should return 2 for level 1', () => {
        expect(service.getTotalTalentPointsAvailable(1)).toBe(2);
      });

      it('should return 25 for level 21', () => {
        expect(service.getTotalTalentPointsAvailable(21)).toBe(25);
      });
    });

    describe('validateTalentAllocation', () => {
      it('should accept valid level 1 allocation (1 talent + 1 tier 0)', () => {
        const talents: Talents = {
          'tier0_warrior': true,
          'bonus_talent': true
        };
        const result = service.validateTalentAllocation(1, talents, {}, 'tier0_warrior');
        expect(result.valid).toBe(true);
      });

      it('should reject unselecting previously selected talent', () => {
        const previous: Talents = { 'talent_1': true };
        const current: Talents = { 'talent_1': false };
        const result = service.validateTalentAllocation(2, current, previous);
        expect(result.valid).toBe(false);
        expect(result.message).toContain('Cannot unselect');
      });

      it('should reject incorrect talent count', () => {
        const talents: Talents = {
          'talent_1': true
          // Level 1 should have 2 (1 tier0 auto + 1 selected)
        };
        const result = service.validateTalentAllocation(1, talents, {}, 'tier0_warrior');
        expect(result.valid).toBe(false);
        expect(result.message).toContain('Talents selected incorrect');
      });

      it('should count tier 0 auto-unlock correctly at level 1', () => {
        const talents: Talents = {
          'tier0_warrior': true,  // auto-selected
          'bonus_talent': true    // manual selection (1 point spent)
        };
        // Level 1 has 2 points: 1 for tier 0, 1 for manual
        const result = service.validateTalentAllocation(1, talents, {}, 'tier0_warrior');
        expect(result.valid).toBe(true);
      });

      it('should validate level-up talent allocation', () => {
        const previous: Talents = {
          'tier0_warrior': true,
          'bonus_talent': true
        };
        const current: Talents = {
          'tier0_warrior': true,
          'bonus_talent': true,
          'talent_2': true        // +1 talent
        };
        // Level 6 has 2 points available
        const result = service.validateTalentAllocation(6, current, previous);
        expect(result.valid).toBe(true);
      });

      it('should allow deselected talents (false values)', () => {
        const talents: Talents = {
          'talent_1': true,
          'talent_2': false       // not selected, OK
        };
        const result = service.validateTalentAllocation(1, talents, {}, 'tier0_warrior');
        expect(result.valid).toBe(true);
      });
    });

    describe('getTalentSlice', () => {
      it('should return correct slice for level 1 creation', () => {
        const talents: Talents = {
          'tier0_warrior': true,
          'bonus_talent': true
        };
        const slice = service.getTalentSlice(1, talents, {}, 'tier0_warrior', true);
        
        expect(slice.currentLevel).toBe(1);
        expect(slice.isCreation).toBe(true);
        expect(slice.pointsAvailable).toBe(2);
        expect(slice.canProceed).toBe(true);
      });

      it('should track remaining talents correctly', () => {
        const talents: Talents = {
          'tier0_warrior': true
          // Missing 1 manual selection
        };
        const slice = service.getTalentSlice(1, talents, {}, 'tier0_warrior', true);
        expect(slice.validation.pointsRemaining).toBe(1);
      });
    });
  });

  // ========================================================================
  // CROSS-LEVEL PROGRESSION TESTS
  // ========================================================================

  describe('Cross-Level Progression', () => {
    it('should validate complete progression from level 1 to 3', () => {
      // Level 1: Attributes
      const attrs1: Attributes = {
        strength: 3,
        quickness: 2,
        intellect: 2,
        awareness: 2,
        will: 2,
        presence: 1
      };
      expect(service.validateAttributeAllocation(1, attrs1).valid).toBe(true);

      // Level 3: Should have +1 attribute available
      const attrs3: Attributes = {
        strength: 4,  // +1
        quickness: 2,
        intellect: 2,
        awareness: 2,
        will: 2,
        presence: 1
      };
      expect(service.validateAttributeAllocation(3, attrs3, attrs1).valid).toBe(true);

      // Level 1: Skills
      const skills1: Skills = { 'Athletics': 2, 'Acrobatics': 2 };
      expect(service.validateSkillAllocation(1, skills1, {}).valid).toBe(true);

      // Level 2: Should have +2 skill points
      const skills2: Skills = { 'Athletics': 3, 'Acrobatics': 2, 'Stealth': 1 };
      expect(service.validateSkillAllocation(2, skills2, skills1).valid).toBe(true);
    });

    it('should maintain cumulative point totals across levels', () => {
      const level1Total = service.getTotalAttributePointsAvailable(1);
      const level3Total = service.getTotalAttributePointsAvailable(3);
      const level6Total = service.getTotalAttributePointsAvailable(6);

      expect(level3Total).toBe(level1Total + 1);  // +1 from level 3
      expect(level6Total).toBe(level3Total + 1);  // +1 from level 6
    });
  });

  // ========================================================================
  // ERROR HANDLING & EDGE CASES
  // ========================================================================

  describe('Error Handling', () => {
    it('should handle null allocations gracefully', () => {
      const result = service.validateAttributeAllocation(1, null as any);
      expect(result.valid).toBe(false);
    });

    it('should handle undefined allocations gracefully', () => {
      const result = service.validateSkillAllocation(1, undefined as any);
      expect(result.valid).toBe(false);
    });

    it('should return pointsRemaining in validation errors', () => {
      const attrs: Attributes = {
        strength: 4,
        quickness: 2,
        intellect: 2,
        awareness: 2,
        will: 2,
        presence: 1
      };
      const result = service.validateAttributeAllocation(1, attrs);
      expect(result.pointsRemaining).toBeDefined();
    });

    it('should handle invalid level gracefully', () => {
      expect(service.getTotalAttributePointsAvailable(0)).toBe(0);
      expect(service.getTotalAttributePointsAvailable(99)).toBe(18); // caps at 21
    });
  });

  // ========================================================================
  // BUSINESS RULE ENFORCEMENT
  // ========================================================================

  describe('Business Rules', () => {
    it('should enforce no skill rank decreases', () => {
      const previous: Skills = { 'Combat': 3 };
      const current: Skills = { 'Combat': 2 };
      const result = service.validateSkillAllocation(2, current, previous);
      expect(result.valid).toBe(false);
    });

    it('should enforce no talent unselection', () => {
      const previous: Talents = { 'talent_1': true };
      const current: Talents = { 'talent_1': false };
      const result = service.validateTalentAllocation(2, current, previous);
      expect(result.valid).toBe(false);
    });

    it('should enforce attribute minimum of 1', () => {
      const attrs: Attributes = {
        strength: 0,
        quickness: 3,
        intellect: 3,
        awareness: 3,
        will: 2,
        presence: 1
      };
      const result = service.validateAttributeAllocation(1, attrs);
      expect(result.valid).toBe(false);
    });

    it('should enforce exact point spending (no surplus)', () => {
      const attrs: Attributes = {
        strength: 2,
        quickness: 2,
        intellect: 2,
        awareness: 2,
        will: 2,
        presence: 1
      };
      const result = service.validateAttributeAllocation(1, attrs);
      expect(result.valid).toBe(false); // Only 11 points spent, need 12
    });
  });
});
