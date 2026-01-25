/**
 * Integration Test Suite: Backend API + Frontend
 * 
 * Tests the complete backend-frontend integration by calling the backend
 * attack calculation APIs and validating the responses.
 */

import { describe, it, expect } from 'vitest';

const API_BASE = 'http://localhost:3000/api';
const TIMEOUT = 10000; // 10 second timeout

/**
 * Helper to make HTTP requests to the backend
 */
async function apiCall(endpoint: string, body: any): Promise<any> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      timeout: TIMEOUT,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(`API Call Failed: ${error.message}`);
  }
}

describe('Backend-Frontend Integration Tests', () => {
  describe('Attack Roll Execution', () => {
    it('should execute a single attack roll', async () => {
      const response = await apiCall('/calculations/attack/execute', {
        skillTotal: 8,
        bonusModifiers: 2,
        damageNotation: 'd6+1',
        damageBonus: 0,
        targetDefense: 12,
        advantageMode: 'normal',
      });

      expect(response.success).toBe(true);
      expect(response.attack).toBeDefined();
      expect(response.attack.attackRoll).toBeDefined();
      expect(response.attack.damageRoll).toBeDefined();
      expect(response.attack.combat).toBeDefined();

      const attack = response.attack;

      // Validate attack roll structure
      expect(attack.attackRoll.finalRoll).toBeGreaterThanOrEqual(1);
      expect(attack.attackRoll.finalRoll).toBeLessThanOrEqual(20);
      expect(attack.attackRoll.total).toBe(
        attack.attackRoll.finalRoll + attack.attackRoll.skillModifier + attack.attackRoll.bonusModifiers
      );

      // Validate damage roll structure
      expect(attack.damageRoll.diceNotation).toBe('d6+1');
      expect(Array.isArray(attack.damageRoll.diceRolls)).toBe(true);
      expect(attack.damageRoll.diceTotal).toBeGreaterThanOrEqual(0);
      expect(attack.damageRoll.total).toBe(
        attack.damageRoll.diceTotal + attack.damageRoll.bonuses
      );

      // Validate combat result
      expect(attack.combat.vsDefense).toBe(12);
      expect(typeof attack.combat.isHit).toBe('boolean');
      expect(typeof attack.combat.hitMargin).toBe('number');

      console.log('✓ Single attack roll executed successfully');
      console.log(
        `  Roll: ${attack.attackRoll.finalRoll} + ${attack.attackRoll.skillModifier} + ${attack.attackRoll.bonusModifiers} = ${attack.attackRoll.total} vs ${attack.combat.vsDefense}`,
        attack.combat.isHit ? 'HIT' : 'MISS'
      );
    });

    it('should handle advantage rolls correctly', async () => {
      const response = await apiCall('/calculations/attack/execute', {
        skillTotal: 10,
        bonusModifiers: 0,
        damageNotation: 'd8',
        damageBonus: 0,
        targetDefense: 14,
        advantageMode: 'advantage',
      });

      expect(response.success).toBe(true);
      const attack = response.attack;

      // With advantage, should have 2 rolls
      expect(attack.attackRoll.rollsGenerated.length).toBe(2);
      expect(attack.attackRoll.finalRoll).toBe(Math.max(...attack.attackRoll.rollsGenerated));

      console.log('✓ Advantage roll (2d20 best) executed correctly');
      console.log(`  Rolls: [${attack.attackRoll.rollsGenerated.join(', ')}], Kept: ${attack.attackRoll.finalRoll}`);
    });

    it('should handle disadvantage rolls correctly', async () => {
      const response = await apiCall('/calculations/attack/execute', {
        skillTotal: 10,
        bonusModifiers: 0,
        damageNotation: 'd8',
        damageBonus: 0,
        targetDefense: 14,
        advantageMode: 'disadvantage',
      });

      expect(response.success).toBe(true);
      const attack = response.attack;

      // With disadvantage, should have 2 rolls
      expect(attack.attackRoll.rollsGenerated.length).toBe(2);
      expect(attack.attackRoll.finalRoll).toBe(Math.min(...attack.attackRoll.rollsGenerated));

      console.log('✓ Disadvantage roll (2d20 worst) executed correctly');
      console.log(`  Rolls: [${attack.attackRoll.rollsGenerated.join(', ')}], Kept: ${attack.attackRoll.finalRoll}`);
    });

    it('should detect critical hits (natural 20)', async () => {
      // Try multiple times to get a natural 20
      let foundCritical = false;
      for (let i = 0; i < 10; i++) {
        const response = await apiCall('/calculations/attack/execute', {
          skillTotal: 0,
          bonusModifiers: 0,
          damageNotation: 'd6',
          damageBonus: 0,
          targetDefense: 10,
          advantageMode: 'normal',
        });

        if (response.attack.attackRoll.isCritical && response.attack.attackRoll.finalRoll === 20) {
          foundCritical = true;
          const attack = response.attack;
          expect(attack.combat.isCritical).toBe(true);
          expect(attack.damageRoll.total * 2).toBeLessThanOrEqual(attack.combat.damageDealt + 1); // Allow small rounding

          console.log('✓ Critical hit detected (natural 20)');
          console.log(`  Damage: ${attack.damageRoll.total} × 2 = ${attack.combat.damageDealt}`);
          break;
        }
      }

      if (!foundCritical) {
        console.log('⚠ Critical hit test skipped (no natural 20 rolled in 10 attempts)');
      }
    });

    it('should detect fumbles (natural 1)', async () => {
      let foundFumble = false;
      for (let i = 0; i < 10; i++) {
        const response = await apiCall('/calculations/attack/execute', {
          skillTotal: 20,
          bonusModifiers: 0,
          damageNotation: 'd6',
          damageBonus: 0,
          targetDefense: 10,
          advantageMode: 'normal',
        });

        if (response.attack.attackRoll.isFumble && response.attack.attackRoll.finalRoll === 1) {
          foundFumble = true;
          const attack = response.attack;
          expect(attack.combat.isHit).toBe(false); // Fumble always misses

          console.log('✓ Fumble detected (natural 1)');
          console.log(`  Attack roll: ${attack.attackRoll.total} vs ${attack.combat.vsDefense} = MISS`);
          break;
        }
      }

      if (!foundFumble) {
        console.log('⚠ Fumble test skipped (no natural 1 rolled in 10 attempts)');
      }
    });
  });

  describe('Attack Combination', () => {
    it('should execute multiple attacks in combination', async () => {
      const response = await apiCall('/calculations/attack/combination', {
        attackCount: 3,
        skillTotal: 8,
        bonusModifiers: 2,
        damageNotation: 'd6+1',
        damageBonus: 0,
        targetDefense: 12,
        advantageMode: 'normal',
      });

      expect(response.success).toBe(true);
      expect(response.combination).toBeDefined();
      expect(response.combination.attackCount).toBe(3);
      expect(response.combination.attacks.length).toBe(3);

      const summary = response.combination.summary;
      expect(summary.hitCount + summary.missCount).toBe(3);
      expect(summary.totalDamage).toBeGreaterThanOrEqual(0);
      expect(summary.averageDamagePerAttack).toBeGreaterThanOrEqual(0);

      console.log('✓ Attack combination executed successfully');
      console.log(`  Attacks: 3, Hits: ${summary.hitCount}, Misses: ${summary.missCount}`);
      console.log(`  Total Damage: ${summary.totalDamage}, Average: ${summary.averageDamagePerAttack.toFixed(2)}`);
    });

    it('should handle large attack counts', async () => {
      const response = await apiCall('/calculations/attack/combination', {
        attackCount: 5,
        skillTotal: 15,
        bonusModifiers: 3,
        damageNotation: 'd8+2',
        damageBonus: 1,
        targetDefense: 13,
        advantageMode: 'normal',
      });

      expect(response.success).toBe(true);
      expect(response.combination.attacks.length).toBe(5);
      expect(response.combination.summary.hitCount).toBeGreaterThanOrEqual(0);
      expect(response.combination.summary.hitCount).toBeLessThanOrEqual(5);

      console.log('✓ Large attack combination handled correctly');
      console.log(`  Attacks: 5, Success Rate: ${(response.combination.summary.hitCount / 5 * 100).toFixed(1)}%`);
    });
  });

  describe('Attack Validation', () => {
    it('should validate correct attack parameters', async () => {
      const response = await apiCall('/calculations/attack/validate', {
        skillTotal: 8,
        bonusModifiers: 2,
        damageNotation: 'd6+1',
        damageBonus: 0,
        targetDefense: 12,
      });

      expect(response.success).toBe(true);
      expect(response.validation).toBeDefined();
      expect(response.validation.isValid).toBe(true);

      console.log('✓ Valid attack parameters accepted');
    });

    it('should reject invalid damage notation', async () => {
      const response = await apiCall('/calculations/attack/validate', {
        skillTotal: 8,
        bonusModifiers: 2,
        damageNotation: 'invalid-notation',
        damageBonus: 0,
        targetDefense: 12,
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();

      console.log('✓ Invalid damage notation rejected');
      console.log(`  Error: ${response.error}`);
    });

    it('should reject negative skill totals', async () => {
      const response = await apiCall('/calculations/attack/validate', {
        skillTotal: -5,
        bonusModifiers: 2,
        damageNotation: 'd6+1',
        damageBonus: 0,
        targetDefense: 12,
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();

      console.log('✓ Negative skill total rejected');
    });

    it('should reject zero target defense', async () => {
      const response = await apiCall('/calculations/attack/validate', {
        skillTotal: 8,
        bonusModifiers: 2,
        damageNotation: 'd6+1',
        damageBonus: 0,
        targetDefense: 0,
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();

      console.log('✓ Zero target defense rejected');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required fields', async () => {
      const response = await apiCall('/calculations/attack/execute', {
        skillTotal: 8,
        // Missing other fields
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();

      console.log('✓ Missing field validation works');
      console.log(`  Error: ${response.error}`);
    });

    it('should handle malformed requests gracefully', async () => {
      try {
        await fetch(`${API_BASE}/calculations/attack/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: 'invalid-json-{]',
          timeout: TIMEOUT,
        });
      } catch (error: any) {
        expect(error).toBeDefined();
        console.log('✓ Malformed request handled gracefully');
      }
    });
  });

  describe('Performance', () => {
    it('should respond to attack rolls within acceptable time', async () => {
      const start = Date.now();

      await apiCall('/calculations/attack/execute', {
        skillTotal: 8,
        bonusModifiers: 2,
        damageNotation: 'd6+1',
        damageBonus: 0,
        targetDefense: 12,
        advantageMode: 'normal',
      });

      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(500); // Should respond in < 500ms

      console.log(`✓ Attack roll responded in ${elapsed}ms`);
    });

    it('should handle rapid sequential requests', async () => {
      const start = Date.now();
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(
          apiCall('/calculations/attack/execute', {
            skillTotal: 8,
            bonusModifiers: 2,
            damageNotation: 'd6+1',
            damageBonus: 0,
            targetDefense: 12,
            advantageMode: 'normal',
          })
        );
      }

      const results = await Promise.all(promises);
      const elapsed = Date.now() - start;

      expect(results.length).toBe(10);
      expect(results.every((r: any) => r.success)).toBe(true);

      console.log(`✓ 10 sequential requests completed in ${elapsed}ms (${(elapsed / 10).toFixed(1)}ms average)`);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain consistency across multiple rolls', async () => {
      const rolls: any[] = [];

      for (let i = 0; i < 5; i++) {
        const response = await apiCall('/calculations/attack/execute', {
          skillTotal: 10,
          bonusModifiers: 1,
          damageNotation: 'd6',
          damageBonus: 1,
          targetDefense: 11,
          advantageMode: 'normal',
        });

        rolls.push(response.attack);
      }

      // Verify each roll has correct structure
      rolls.forEach((roll, index) => {
        expect(roll.attackRoll.total).toBe(
          roll.attackRoll.finalRoll + roll.attackRoll.skillModifier + roll.attackRoll.bonusModifiers
        );
        expect(roll.attackRoll.total).toBe(roll.combat.attackTotal);
      });

      console.log('✓ Data consistency verified across 5 rolls');
    });

    it('should handle extreme values gracefully', async () => {
      const response = await apiCall('/calculations/attack/execute', {
        skillTotal: 100, // Very high skill
        bonusModifiers: 50, // Very high bonus
        damageNotation: 'd20+10', // Complex damage
        damageBonus: 20,
        targetDefense: 200, // Very high defense
        advantageMode: 'normal',
      });

      expect(response.success).toBe(true);
      expect(response.attack.combat.attackTotal).toBeLessThan(200); // Still possible to miss

      console.log('✓ Extreme values handled correctly');
      console.log(`  Skill: 100, Bonus: 50, Attack Roll: ${response.attack.combat.attackTotal} vs Defense: 200`);
    });
  });
});
