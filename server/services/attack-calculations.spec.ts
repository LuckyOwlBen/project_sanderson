/**
 * Attack Calculations Service Tests
 * 
 * Validates all combat calculations including attacks, damage, and advantage/disadvantage
 */

import { describe, it, expect, vi } from 'vitest';
import {
  AttackCalculationsService,
  AdvantageMode,
  DiceRoll,
  AttackRoll,
  DamageRoll,
  Attack
} from './attack-calculations';

describe('AttackCalculationsService', () => {
  const service = new AttackCalculationsService();

  // ========================================================================
  // DICE ROLLING TESTS
  // ========================================================================

  describe('rollD20', () => {
    it('should return number between 1 and 20', () => {
      for (let i = 0; i < 100; i++) {
        const roll = service.rollD20();
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(20);
      }
    });
  });

  describe('rollDice', () => {
    it('should roll single die correctly', () => {
      const result = service.rollDice(6);
      expect(result.sides).toBe(6);
      expect(result.rolls).toHaveLength(1);
      expect(result.rolls[0]).toBeGreaterThanOrEqual(1);
      expect(result.rolls[0]).toBeLessThanOrEqual(6);
      expect(result.total).toBe(result.rolls[0]);
    });

    it('should roll multiple dice', () => {
      const result = service.rollDice(6, 3);
      expect(result.rolls).toHaveLength(3);
      expect(result.total).toBe(result.rolls[0] + result.rolls[1] + result.rolls[2]);
    });

    it('should handle various die types', () => {
      expect(service.rollDice(4).rolls[0]).toBeLessThanOrEqual(4);
      expect(service.rollDice(8).rolls[0]).toBeLessThanOrEqual(8);
      expect(service.rollDice(10).rolls[0]).toBeLessThanOrEqual(10);
      expect(service.rollDice(12).rolls[0]).toBeLessThanOrEqual(12);
      expect(service.rollDice(20).rolls[0]).toBeLessThanOrEqual(20);
    });

    it('should throw error for invalid die sides', () => {
      expect(() => service.rollDice(1)).toThrow();
      expect(() => service.rollDice(0)).toThrow();
    });

    it('should throw error for invalid count', () => {
      expect(() => service.rollDice(6, 0)).toThrow();
      expect(() => service.rollDice(6, -1)).toThrow();
    });
  });

  // ========================================================================
  // DICE NOTATION TESTS
  // ========================================================================

  describe('parseDiceNotation', () => {
    it('should parse single die notation', () => {
      const result = service.parseDiceNotation('d6');
      expect(result.count).toBe(1);
      expect(result.sides).toBe(6);
      expect(result.bonus).toBe(0);
    });

    it('should parse multiple dice notation', () => {
      const result = service.parseDiceNotation('2d6');
      expect(result.count).toBe(2);
      expect(result.sides).toBe(6);
      expect(result.bonus).toBe(0);
    });

    it('should parse with bonus', () => {
      const result = service.parseDiceNotation('d6+3');
      expect(result.count).toBe(1);
      expect(result.sides).toBe(6);
      expect(result.bonus).toBe(3);
    });

    it('should parse with negative bonus', () => {
      const result = service.parseDiceNotation('2d8-2');
      expect(result.count).toBe(2);
      expect(result.sides).toBe(8);
      expect(result.bonus).toBe(-2);
    });

    it('should throw error for invalid notation', () => {
      expect(() => service.parseDiceNotation('2d')).toThrow();
      expect(() => service.parseDiceNotation('d')).toThrow();
      expect(() => service.parseDiceNotation('abc')).toThrow();
    });
  });

  // ========================================================================
  // ATTACK ROLL TESTS
  // ========================================================================

  describe('calculateAttackRoll', () => {
    it('should calculate normal attack roll', () => {
      const result = service.calculateAttackRoll(5, 2, AdvantageMode.NORMAL);
      expect(result.skillModifier).toBe(5);
      expect(result.bonusModifiers).toBe(2);
      expect(result.advantageMode).toBe(AdvantageMode.NORMAL);
      expect(result.total).toBe(result.finalRoll + 5 + 2);
      expect(result.rollsGenerated).toHaveLength(1);
    });

    it('should mark critical hits (natural 20)', () => {
      // Mock rollD20 to return 20
      let rollCount = 0;
      const originalRoll = service.rollD20.bind(service);
      service.rollD20 = vi.fn(() => {
        rollCount++;
        return rollCount === 1 ? 20 : 1;
      });

      const result = service.calculateAttackRoll(5, 0, AdvantageMode.NORMAL);
      expect(result.isCritical).toBe(true);

      // Restore
      service.rollD20 = originalRoll;
    });

    it('should mark fumbles (natural 1)', () => {
      let rollCount = 0;
      const originalRoll = service.rollD20.bind(service);
      service.rollD20 = vi.fn(() => {
        rollCount++;
        return rollCount === 1 ? 1 : 20;
      });

      const result = service.calculateAttackRoll(5, 0, AdvantageMode.NORMAL);
      expect(result.isFumble).toBe(true);

      // Restore
      service.rollD20 = originalRoll;
    });

    it('should apply advantage (roll 2d20, take higher)', () => {
      // For advantage, should roll 2 dice
      const result = service.calculateAttackRoll(3, 1, AdvantageMode.ADVANTAGE);
      expect(result.rollsGenerated).toHaveLength(2);
      expect(result.finalRoll).toBe(Math.max(result.rollsGenerated[0], result.rollsGenerated[1]));
    });

    it('should apply disadvantage (roll 2d20, take lower)', () => {
      const result = service.calculateAttackRoll(3, 1, AdvantageMode.DISADVANTAGE);
      expect(result.rollsGenerated).toHaveLength(2);
      expect(result.finalRoll).toBe(Math.min(result.rollsGenerated[0], result.rollsGenerated[1]));
    });

    it('should include modifiers in total', () => {
      const result = service.calculateAttackRoll(7, 3);
      expect(result.total).toBe(result.finalRoll + 7 + 3);
    });
  });

  // ========================================================================
  // DAMAGE ROLL TESTS
  // ========================================================================

  describe('calculateDamageRoll', () => {
    it('should calculate simple damage roll', () => {
      const result = service.calculateDamageRoll('d6');
      expect(result.diceRoll.sides).toBe(6);
      expect(result.diceRoll.rolls).toHaveLength(1);
      expect(result.total).toBeGreaterThanOrEqual(1);
      expect(result.total).toBeLessThanOrEqual(6);
    });

    it('should parse notation and apply bonuses', () => {
      const result = service.calculateDamageRoll('d6+2');
      expect(result.total).toBe(result.diceRoll.total + 2);
      expect(result.total).toBeGreaterThanOrEqual(3);
      expect(result.total).toBeLessThanOrEqual(8);
    });

    it('should apply flat damage bonus', () => {
      const result = service.calculateDamageRoll('d6', 3);
      expect(result.bonuses).toBe(3 + 0); // No bonus in notation, +3 flat
      expect(result.total).toBe(result.diceRoll.total + 3);
    });

    it('should combine notation and flat bonuses', () => {
      const result = service.calculateDamageRoll('d8+1', 2);
      expect(result.bonuses).toBe(1 + 2);
      expect(result.total).toBe(result.diceRoll.total + 3);
    });

    it('should handle multiple dice', () => {
      const result = service.calculateDamageRoll('3d6+2');
      expect(result.diceRoll.rolls).toHaveLength(3);
      expect(result.total).toBeGreaterThanOrEqual(5); // 3*1 + 2
      expect(result.total).toBeLessThanOrEqual(20); // 3*6 + 2
    });

    it('should prevent negative damage', () => {
      const result = service.calculateDamageRoll('d6-10');
      expect(result.total).toBeGreaterThanOrEqual(0);
    });
  });

  // ========================================================================
  // HIT DETERMINATION TESTS
  // ========================================================================

  describe('checkHit', () => {
    it('should hit when attack >= defense', () => {
      const result = service.checkHit(15, 12);
      expect(result.isHit).toBe(true);
      expect(result.hitMargin).toBe(3);
    });

    it('should miss when attack < defense', () => {
      const result = service.checkHit(10, 15);
      expect(result.isHit).toBe(false);
      expect(result.hitMargin).toBe(-5);
    });

    it('should hit on exact defense', () => {
      const result = service.checkHit(15, 15);
      expect(result.isHit).toBe(true);
      expect(result.hitMargin).toBe(0);
    });

    it('should calculate hit margin correctly', () => {
      let result = service.checkHit(20, 12);
      expect(result.hitMargin).toBe(8);

      result = service.checkHit(10, 18);
      expect(result.hitMargin).toBe(-8);
    });
  });

  // ========================================================================
  // DAMAGE DETERMINATION TESTS
  // ========================================================================

  describe('getDamageDealt', () => {
    it('should return full damage on hit', () => {
      const damage = service.getDamageDealt(5, true, false);
      expect(damage).toBe(5);
    });

    it('should return 0 on miss', () => {
      const damage = service.getDamageDealt(5, false, false);
      expect(damage).toBe(0);
    });

    it('should double damage on critical hit', () => {
      const damage = service.getDamageDealt(5, true, true);
      expect(damage).toBe(10);
    });

    it('should return 0 on critical miss', () => {
      const damage = service.getDamageDealt(5, false, true);
      expect(damage).toBe(0);
    });
  });

  // ========================================================================
  // COMPLETE ATTACK TESTS
  // ========================================================================

  describe('executeAttack', () => {
    it('should execute complete attack', () => {
      const attack = service.executeAttack(5, 2, 'd6+1', 1, 12, AdvantageMode.NORMAL);

      expect(attack.attackRoll).toBeDefined();
      expect(attack.damageRoll).toBeDefined();
      expect(attack.vsDefense).toBe(12);
      expect(attack.isHit).toBeDefined();
      expect(attack.damageDealt).toBeDefined();

      if (attack.isHit) {
        expect(attack.damageDealt).toBeGreaterThan(0);
      } else {
        expect(attack.damageDealt).toBe(0);
      }
    });

    it('should hit when attack total >= defense', () => {
      // Use high skill to ensure hit
      const attack = service.executeAttack(15, 5, 'd6', 0, 10);
      expect(attack.isHit).toBe(true); // Should hit with +20 bonus
      expect(attack.damageDealt).toBeGreaterThan(0);
    });

    it('should miss when attack total < defense', () => {
      // Use low skill to ensure miss
      const attack = service.executeAttack(-5, -5, 'd6', 0, 20);
      expect(attack.isHit).toBe(false); // Should miss with -10 penalty
      expect(attack.damageDealt).toBe(0);
    });

    it('should apply advantage correctly', () => {
      const attack = service.executeAttack(5, 0, 'd6', 0, 12, AdvantageMode.ADVANTAGE);
      expect(attack.attackRoll.advantageMode).toBe(AdvantageMode.ADVANTAGE);
      expect(attack.attackRoll.rollsGenerated).toHaveLength(2);
    });
  });

  // ========================================================================
  // ATTACK COMBINATION TESTS
  // ========================================================================

  describe('executeAttackCombination', () => {
    it('should execute multiple attacks', () => {
      const combination = service.executeAttackCombination(
        3,    // 3 attacks
        5,    // skill total
        0,    // bonus
        'd6', // damage
        0,    // damage bonus
        12    // defense
      );

      expect(combination.attacks).toHaveLength(3);
      expect(combination.hitCount + combination.missCount).toBe(3);
      expect(combination.totalDamage).toBeGreaterThanOrEqual(0);
    });

    it('should count hits and misses', () => {
      const combination = service.executeAttackCombination(2, 20, 10, 'd6', 0, 5);
      // With +30 bonus, should hit both
      expect(combination.hitCount).toBe(2);
      expect(combination.missCount).toBe(0);

      const combination2 = service.executeAttackCombination(2, -10, -10, 'd6', 0, 20);
      // With -20 penalty, should miss both
      expect(combination2.hitCount).toBe(0);
      expect(combination2.missCount).toBe(2);
    });

    it('should calculate total damage correctly', () => {
      const combination = service.executeAttackCombination(2, 20, 10, 'd6+1', 1, 5);
      expect(combination.totalDamage).toBe(
        combination.attacks[0].damageDealt + combination.attacks[1].damageDealt
      );
    });

    it('should throw error for invalid attack count', () => {
      expect(() => service.executeAttackCombination(0, 5, 0, 'd6', 0, 12)).toThrow();
      expect(() => service.executeAttackCombination(-1, 5, 0, 'd6', 0, 12)).toThrow();
    });
  });

  // ========================================================================
  // VALIDATION TESTS
  // ========================================================================

  describe('validateAttackParameters', () => {
    it('should accept valid parameters', () => {
      const result = service.validateAttackParameters(5, 2, 'd6+1', 1, 12);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject negative skill total', () => {
      const result = service.validateAttackParameters(-1, 0, 'd6', 0, 12);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid damage notation', () => {
      const result = service.validateAttackParameters(5, 0, 'invalid', 0, 12);
      expect(result.valid).toBe(false);
    });

    it('should reject invalid defense', () => {
      const result = service.validateAttackParameters(5, 0, 'd6', 0, 0);
      expect(result.valid).toBe(false);
    });

    it('should provide specific error messages', () => {
      const result = service.validateAttackParameters(-5, 'invalid' as any, 'bad', -1, -1);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ========================================================================
  // DESCRIPTION TESTS
  // ========================================================================

  describe('getAdvantageDescription', () => {
    it('should describe advantage mode', () => {
      expect(service.getAdvantageDescription(AdvantageMode.ADVANTAGE)).toContain('2d20');
      expect(service.getAdvantageDescription(AdvantageMode.DISADVANTAGE)).toContain('2d20');
      expect(service.getAdvantageDescription(AdvantageMode.NORMAL)).toContain('1d20');
    });
  });

  describe('getHitDescription', () => {
    it('should describe critical hit', () => {
      const desc = service.getHitDescription(true, 10, true);
      expect(desc).toContain('CRITICAL');
    });

    it('should describe hit', () => {
      const desc = service.getHitDescription(true, 5, false);
      expect(desc).toContain('HIT');
    });

    it('should describe near miss', () => {
      const desc = service.getHitDescription(false, -1, false);
      expect(desc).toContain('off by 1');
    });

    it('should describe miss', () => {
      const desc = service.getHitDescription(false, -5, false);
      expect(desc).toContain('MISS');
    });
  });

  // ========================================================================
  // INTEGRATION TESTS
  // ========================================================================

  describe('Complete Combat Scenario', () => {
    it('should handle standard attack sequence', () => {
      // Character with Athletics 3 (rank 2 + STR bonus 6)
      // Attacking with +2 weapon bonus
      // Rolling for damage d6+2
      // Against defense 12

      const attack = service.executeAttack(
        8,      // skill total: 2 + 6
        2,      // weapon bonus
        'd6+2', // damage
        1,      // additional bonus
        12,     // target defense
        AdvantageMode.NORMAL
      );

      expect(attack.attackRoll.total).toBe(attack.attackRoll.finalRoll + 8 + 2);
      expect(attack.damageRoll.total).toBeGreaterThanOrEqual(3);
      expect(attack.damageRoll.total).toBeLessThanOrEqual(11);

      if (attack.isHit) {
        expect(attack.damageDealt).toBeGreaterThan(0);
      } else {
        expect(attack.damageDealt).toBe(0);
      }
    });

    it('should handle multiple attacks with different outcomes', () => {
      const combination = service.executeAttackCombination(
        2,      // 2 attacks
        8,      // skill total
        1,      // bonus
        'd6',   // damage
        0,      // damage bonus
        12,     // target defense
        AdvantageMode.NORMAL
      );

      expect(combination.attacks.length).toBe(2);
      expect(combination.hitCount + combination.missCount).toBe(2);
      expect(combination.totalDamage).toBeGreaterThanOrEqual(0);

      // Each attack should be independent
      const attack1 = combination.attacks[0];
      const attack2 = combination.attacks[1];
      expect(attack1.attackRoll.finalRoll).not.toBe(attack2.attackRoll.finalRoll); // Different rolls
    });
  });
});
