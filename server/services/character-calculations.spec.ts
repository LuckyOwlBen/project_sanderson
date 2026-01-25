/**
 * Character Calculations Service Tests
 * 
 * Validates all defense and derived attribute calculations
 * Ensures calculations match game design specifications
 */

import { describe, it, expect } from 'vitest';
import {
  CharacterCalculationsService,
  Attributes,
  DefenseValues,
  DerivedAttributes
} from './character-calculations';

describe('CharacterCalculationsService', () => {
  const service = new CharacterCalculationsService();

  // ========================================================================
  // PHYSICS DEFENSE CALCULATION TESTS
  // ========================================================================

  describe('calculatePhysicsDefense', () => {
    it('should calculate base defense with no attributes or bonuses', () => {
      const result = service.calculatePhysicsDefense({});
      expect(result.physicsDef).toBe(10);
      expect(result.baseDef).toBe(10);
      expect(result.speedBonus).toBe(0);
      expect(result.strengthBonus).toBe(0);
      expect(result.bonuses).toBe(0);
    });

    it('should calculate speed bonus as quickness / 2 (rounded down)', () => {
      let result = service.calculatePhysicsDefense({ quickness: 10 });
      expect(result.speedBonus).toBe(5);

      result = service.calculatePhysicsDefense({ quickness: 11 });
      expect(result.speedBonus).toBe(5); // 11 / 2 = 5.5 -> 5

      result = service.calculatePhysicsDefense({ quickness: 12 });
      expect(result.speedBonus).toBe(6);
    });

    it('should calculate strength bonus as strength / 2 (rounded down)', () => {
      let result = service.calculatePhysicsDefense({ strength: 10 });
      expect(result.strengthBonus).toBe(5);

      result = service.calculatePhysicsDefense({ strength: 11 });
      expect(result.strengthBonus).toBe(5); // 11 / 2 = 5.5 -> 5

      result = service.calculatePhysicsDefense({ strength: 12 });
      expect(result.strengthBonus).toBe(6);
    });

    it('should combine all bonuses correctly', () => {
      const attributes: Attributes = {
        strength: 12,    // +6 to def
        quickness: 12    // +6 to def
      };
      const bonuses = {
        'armor': 2,
        'enchantment': 1
      };
      const result = service.calculatePhysicsDefense(attributes, bonuses);
      expect(result.physicsDef).toBe(10 + 6 + 6 + 3); // 25
    });

    it('should handle zero bonuses', () => {
      const result = service.calculatePhysicsDefense(
        { strength: 10, quickness: 10 },
        {}
      );
      expect(result.bonuses).toBe(0);
      expect(result.physicsDef).toBe(10 + 5 + 5); // 20
    });

    it('should throw error if attributes is null', () => {
      expect(() => service.calculatePhysicsDefense(null as any)).toThrow();
    });

    it('should handle negative bonuses (debuffs)', () => {
      const result = service.calculatePhysicsDefense(
        { strength: 10, quickness: 10 },
        { 'curse': -2 }
      );
      expect(result.bonuses).toBe(-2);
      expect(result.physicsDef).toBe(10 + 5 + 5 - 2); // 18
    });

    it('should handle mixed positive and negative bonuses', () => {
      const result = service.calculatePhysicsDefense(
        { strength: 10, quickness: 10 },
        { 'armor': 3, 'curse': -1, 'blessing': 2 }
      );
      expect(result.bonuses).toBe(4); // 3 - 1 + 2
      expect(result.physicsDef).toBe(10 + 5 + 5 + 4); // 24
    });
  });

  // ========================================================================
  // MOVEMENT SPEED CALCULATION TESTS
  // ========================================================================

  describe('calculateMovementSpeed', () => {
    it('should return 30 feet for quickness 10 (standard human)', () => {
      expect(service.calculateMovementSpeed(10)).toBe(30);
    });

    it('should add 5 feet per point above quickness 10', () => {
      expect(service.calculateMovementSpeed(11)).toBe(35);
      expect(service.calculateMovementSpeed(12)).toBe(40);
      expect(service.calculateMovementSpeed(15)).toBe(55);
    });

    it('should subtract 5 feet per point below quickness 10', () => {
      expect(service.calculateMovementSpeed(9)).toBe(25);
      expect(service.calculateMovementSpeed(8)).toBe(20);
      expect(service.calculateMovementSpeed(5)).toBe(5);
    });

    it('should handle quickness 0', () => {
      expect(service.calculateMovementSpeed(0)).toBe(-50); // 30 + (0-10)*5
    });

    it('should apply movement bonuses', () => {
      expect(service.calculateMovementSpeed(10, 10)).toBe(40);
      expect(service.calculateMovementSpeed(12, 5)).toBe(45); // 40 + 5
    });

    it('should throw error for negative quickness', () => {
      expect(() => service.calculateMovementSpeed(-1)).toThrow();
    });

    it('should handle high quickness values', () => {
      expect(service.calculateMovementSpeed(20)).toBe(80); // 30 + 10*5
    });
  });

  // ========================================================================
  // RECOVERY DIE CALCULATION TESTS
  // ========================================================================

  describe('calculateRecoveryDie', () => {
    it('should return d4 for strength 1-5', () => {
      expect(service.calculateRecoveryDie(1)).toBe('d4');
      expect(service.calculateRecoveryDie(5)).toBe('d4');
    });

    it('should return d6 for strength 6-10', () => {
      expect(service.calculateRecoveryDie(6)).toBe('d6');
      expect(service.calculateRecoveryDie(10)).toBe('d6');
    });

    it('should return d8 for strength 11-15', () => {
      expect(service.calculateRecoveryDie(11)).toBe('d8');
      expect(service.calculateRecoveryDie(15)).toBe('d8');
    });

    it('should return d10 for strength 16-20', () => {
      expect(service.calculateRecoveryDie(16)).toBe('d10');
      expect(service.calculateRecoveryDie(20)).toBe('d10');
    });

    it('should return d12 for strength 21+', () => {
      expect(service.calculateRecoveryDie(21)).toBe('d12');
      expect(service.calculateRecoveryDie(25)).toBe('d12');
    });

    it('should handle strength 0 as d4', () => {
      expect(service.calculateRecoveryDie(0)).toBe('d4');
    });

    it('should apply numeric bonuses', () => {
      expect(service.calculateRecoveryDie(10, '+2')).toBe('d6+2');
      expect(service.calculateRecoveryDie(10, '3')).toBe('d6+3');
    });

    it('should handle negative bonuses', () => {
      expect(service.calculateRecoveryDie(10, '-1')).toBe('d6-1');
    });

    it('should throw error for negative strength', () => {
      expect(() => service.calculateRecoveryDie(-1)).toThrow();
    });

    it('should handle empty bonus string', () => {
      expect(service.calculateRecoveryDie(10, '')).toBe('d6');
    });
  });

  // ========================================================================
  // DERIVED ATTRIBUTES TESTS
  // ========================================================================

  describe('getDerivedAttributes', () => {
    it('should return correct derived attributes for standard human', () => {
      const attrs: Attributes = {
        strength: 10,
        quickness: 10
      };
      const result = service.getDerivedAttributes(attrs);
      
      expect(result.movementSpeed).toBe(30);
      expect(result.recoveryDie).toBe('d6');
      expect(result.baseRecoveryDie).toBe('d6');
      expect(result.speedModifier).toBe(0);
    });

    it('should calculate speed modifier correctly', () => {
      // Movement 40 = base 30 + 10, modifier should be 2 (10/5)
      const attrs: Attributes = { quickness: 12 };
      const result = service.getDerivedAttributes(attrs);
      expect(result.speedModifier).toBe(2);
    });

    it('should calculate negative speed modifier', () => {
      // Movement 20 = base 30 - 10, modifier should be -2 (−10/5)
      const attrs: Attributes = { quickness: 8 };
      const result = service.getDerivedAttributes(attrs);
      expect(result.speedModifier).toBe(-2);
    });

    it('should apply movement bonuses', () => {
      const attrs: Attributes = { quickness: 10 };
      const result = service.getDerivedAttributes(attrs, 10);
      expect(result.movementSpeed).toBe(40);
    });

    it('should apply recovery bonuses', () => {
      const attrs: Attributes = { strength: 10 };
      const result = service.getDerivedAttributes(attrs, 0, '+2');
      expect(result.recoveryDie).toBe('d6+2');
      expect(result.baseRecoveryDie).toBe('d6');
    });

    it('should handle high strength with bonuses', () => {
      const attrs: Attributes = { strength: 18 };
      const result = service.getDerivedAttributes(attrs, 0, '+1');
      expect(result.recoveryDie).toBe('d10+1');
    });

    it('should handle empty attributes', () => {
      const result = service.getDerivedAttributes({});
      expect(result.movementSpeed).toBe(-20); // 30 + (0-10)*5
      expect(result.recoveryDie).toBe('d4');
      expect(result.speedModifier).toBe(-10);
    });
  });

  // ========================================================================
  // FULL CALCULATION TESTS
  // ========================================================================

  describe('calculateAll', () => {
    it('should calculate defense and derived attributes together', () => {
      const attrs: Attributes = {
        strength: 12,
        quickness: 12,
        intellect: 10,
        awareness: 10,
        will: 10,
        presence: 10
      };
      const result = service.calculateAll(attrs);
      
      expect(result.defense.physicsDef).toBe(10 + 6 + 6); // 22
      expect(result.derived.movementSpeed).toBe(40);
      expect(result.derived.recoveryDie).toBe('d6');
    });

    it('should apply all bonuses together', () => {
      const attrs: Attributes = {
        strength: 10,
        quickness: 10
      };
      const result = service.calculateAll(
        attrs,
        { 'armor': 2 },
        5,
        '+1'
      );
      
      expect(result.defense.physicsDef).toBe(10 + 5 + 5 + 2); // 22
      expect(result.derived.movementSpeed).toBe(35);
      expect(result.derived.recoveryDie).toBe('d6+1');
    });
  });

  // ========================================================================
  // VALIDATION TESTS
  // ========================================================================

  describe('validateAttributes', () => {
    it('should accept valid attributes object', () => {
      const result = service.validateAttributes({
        strength: 10,
        quickness: 10,
        intellect: 10,
        awareness: 10,
        will: 10,
        presence: 10
      });
      expect(result.valid).toBe(true);
    });

    it('should accept partial attributes', () => {
      const result = service.validateAttributes({ strength: 10 });
      expect(result.valid).toBe(true);
    });

    it('should reject non-numeric values', () => {
      const result = service.validateAttributes({ strength: 'ten' as any });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be a number');
    });

    it('should reject negative values', () => {
      const result = service.validateAttributes({ strength: -1 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be negative');
    });

    it('should reject non-object input', () => {
      const result = service.validateAttributes(null as any);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be an object');
    });

    it('should reject undefined input', () => {
      const result = service.validateAttributes(undefined as any);
      expect(result.valid).toBe(false);
    });
  });

  // ========================================================================
  // EDGE CASES & BOUNDARY TESTS
  // ========================================================================

  describe('Edge Cases', () => {
    it('should handle attributes at maximum reasonable values', () => {
      const attrs: Attributes = {
        strength: 21,
        quickness: 20,
        intellect: 21,
        awareness: 20,
        will: 21,
        presence: 20
      };
      const result = service.calculateAll(attrs);
      
      expect(result.defense.physicsDef).toBe(10 + 10 + 10); // 30
      expect(result.derived.movementSpeed).toBe(80); // 30 + (20-10)*5
      expect(result.derived.recoveryDie).toBe('d12');
    });

    it('should handle attributes at minimum values', () => {
      const attrs: Attributes = {
        strength: 1,
        quickness: 1,
        intellect: 1,
        awareness: 1,
        will: 1,
        presence: 1
      };
      const result = service.calculateAll(attrs);
      
      expect(result.defense.physicsDef).toBe(10 + 0 + 0); // 10
      expect(result.derived.movementSpeed).toBe(5); // 30 + (1-10)*5
      expect(result.derived.recoveryDie).toBe('d4');
    });

    it('should handle multiple bonus sources', () => {
      const bonuses = {
        'armor': 2,
        'shield': 1,
        'ring': 1,
        'blessing': 2,
        'curse': -1
      };
      const result = service.calculatePhysicsDefense({ strength: 10, quickness: 10 }, bonuses);
      expect(result.bonuses).toBe(5); // 2+1+1+2-1
      expect(result.physicsDef).toBe(10 + 5 + 5 + 5); // 25
    });

    it('should handle zero attributes correctly', () => {
      const attrs: Attributes = {
        strength: 0,
        quickness: 0
      };
      const result = service.calculateAll(attrs);
      expect(result.defense.physicsDef).toBe(10);
      expect(result.derived.movementSpeed).toBe(-50);
      expect(result.derived.recoveryDie).toBe('d4');
    });
  });

  // ========================================================================
  // GAME DESIGN RULE VALIDATION
  // ========================================================================

  describe('Game Design Rules', () => {
    it('should enforce movement speed scales with quickness at 5ft per point', () => {
      for (let qck = 8; qck <= 15; qck++) {
        const speed = service.calculateMovementSpeed(qck);
        const expectedSpeed = 30 + (qck - 10) * 5;
        expect(speed).toBe(expectedSpeed);
      }
    });

    it('should enforce recovery die progression based on strength', () => {
      expect(service.calculateRecoveryDie(5)).toBe('d4');
      expect(service.calculateRecoveryDie(6)).toBe('d6');
      expect(service.calculateRecoveryDie(11)).toBe('d8');
      expect(service.calculateRecoveryDie(16)).toBe('d10');
      expect(service.calculateRecoveryDie(21)).toBe('d12');
    });

    it('should enforce defense includes all three components', () => {
      const result = service.calculatePhysicsDefense(
        { strength: 12, quickness: 14 },
        { 'armor': 1 }
      );
      // 10 (base) + 7 (qck/2) + 6 (str/2) + 1 (bonus)
      expect(result.physicsDef).toBe(24);
      expect(result.baseDef).toBe(10);
      expect(result.speedBonus).toBe(7);
      expect(result.strengthBonus).toBe(6);
      expect(result.bonuses).toBe(1);
    });
  });
});
