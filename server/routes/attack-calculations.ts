/**
 * Attack Calculations Routes
 *
 * REST API endpoints for executing attacks, calculating damage, and handling advantage/disadvantage
 */

import { attackCalculationsService } from '../services/attack-calculations';

function createAttackCalculationsRoutes(app) {
  console.log('[Routes] Registering attack calculations routes...');

  /**
   * POST /api/calculations/attack/execute
   * Execute a single attack with all calculations
   *
   * Body:
   * {
   *   skillTotal: number,
   *   bonusModifiers: number,
   *   damageNotation: string (e.g., 'd6+2'),
   *   damageBonus: number,
   *   targetDefense: number,
   *   advantageMode: 'normal' | 'advantage' | 'disadvantage'
   * }
   *
   * Returns:
   * {
   *   attackRoll: AttackRoll,
   *   damageRoll: DamageRoll,
   *   vsDefense: number,
   *   isHit: boolean,
   *   isCritical: boolean,
   *   hitDescription: string,
   *   damageDealt: number,
   *   totalWithModifiers: number (for damage consideration)
   * }
   */
  app.post('/api/calculations/attack/execute', (req, res) => {
    try {
      const {
        skillTotal,
        bonusModifiers = 0,
        damageNotation,
        damageBonus = 0,
        targetDefense,
        advantageMode = 'normal'
      } = req.body;

      // Validate required fields
      if (skillTotal === undefined || damageNotation === undefined || targetDefense === undefined) {
        return res.status(400).json({
          error: 'Missing required fields: skillTotal, damageNotation, targetDefense'
        });
      }

      // Validate parameters
      const validation = attackCalculationsService.validateAttackParameters(
        skillTotal,
        bonusModifiers,
        damageNotation,
        damageBonus,
        targetDefense
      );

      if (!validation.valid) {
        return res.status(400).json({
          error: 'Invalid attack parameters',
          details: validation.errors
        });
      }

      // Map string advantage mode to enum
      const advantageModeMap = {
        'normal': 0,
        'advantage': 1,
        'disadvantage': 2
      };
      const mode = advantageModeMap[advantageMode] ?? 0;

      // Execute attack
      const attack = attackCalculationsService.executeAttack(
        skillTotal,
        bonusModifiers,
        damageNotation,
        damageBonus,
        targetDefense,
        mode
      );

      res.json({
        success: true,
        attack: {
          attackRoll: {
            finalRoll: attack.attackRoll.finalRoll,
            rollsGenerated: attack.attackRoll.rollsGenerated,
            skillModifier: attack.attackRoll.skillModifier,
            bonusModifiers: attack.attackRoll.bonusModifiers,
            total: attack.attackRoll.total,
            isCritical: attack.attackRoll.isCritical,
            isFumble: attack.attackRoll.isFumble,
            advantageMode: advantageMode
          },
          damageRoll: {
            diceNotation: damageNotation,
            diceRolls: attack.damageRoll.diceRoll.rolls,
            diceTotal: attack.damageRoll.diceRoll.total,
            bonuses: attack.damageRoll.bonuses,
            total: attack.damageRoll.total
          },
          combat: {
            vsDefense: attack.vsDefense,
            attackTotal: attack.attackRoll.total,
            isHit: attack.isHit,
            isCritical: attack.attackRoll.isCritical,
            hitMargin: attack.hitMargin,
            damageDealt: attack.damageDealt,
            hitDescription: attackCalculationsService.getHitDescription(
              attack.isHit,
              attack.hitMargin,
              attack.attackRoll.isCritical
            )
          }
        }
      });
    } catch (error) {
      console.error('Error executing attack:', error);
      res.status(500).json({
        error: 'Failed to execute attack',
        message: error.message
      });
    }
  });

  /**
   * GET /api/calculations/attack/execute
   * Execute a single attack with query parameters
   *
   * Query params:
   *   skillTotal: number
   *   bonusModifiers: number
   *   damageNotation: string
   *   damageBonus: number
   *   targetDefense: number
   *   advantageMode: 'normal' | 'advantage' | 'disadvantage'
   */
  app.get('/api/calculations/attack/execute', (req, res) => {
    try {
      const {
        skillTotal,
        bonusModifiers = '0',
        damageNotation,
        damageBonus = '0',
        targetDefense,
        advantageMode = 'normal'
      } = req.query;

      if (!skillTotal || !damageNotation || !targetDefense) {
        return res.status(400).json({
          error: 'Missing required query params: skillTotal, damageNotation, targetDefense'
        });
      }

      const skillTotalNum = parseInt(skillTotal);
      const bonusModifiersNum = parseInt(bonusModifiers);
      const damageBonusNum = parseInt(damageBonus);
      const targetDefenseNum = parseInt(targetDefense);

      const validation = attackCalculationsService.validateAttackParameters(
        skillTotalNum,
        bonusModifiersNum,
        damageNotation,
        damageBonusNum,
        targetDefenseNum
      );

      if (!validation.valid) {
        return res.status(400).json({
          error: 'Invalid attack parameters',
          details: validation.errors
        });
      }

      const advantageModeMap = {
        'normal': 0,
        'advantage': 1,
        'disadvantage': 2
      };
      const mode = advantageModeMap[advantageMode] ?? 0;

      const attack = attackCalculationsService.executeAttack(
        skillTotalNum,
        bonusModifiersNum,
        damageNotation,
        damageBonusNum,
        targetDefenseNum,
        mode
      );

      res.json({
        success: true,
        attack: {
          attackRoll: {
            finalRoll: attack.attackRoll.finalRoll,
            rollsGenerated: attack.attackRoll.rollsGenerated,
            skillModifier: attack.attackRoll.skillModifier,
            bonusModifiers: attack.attackRoll.bonusModifiers,
            total: attack.attackRoll.total,
            isCritical: attack.attackRoll.isCritical,
            isFumble: attack.attackRoll.isFumble,
            advantageMode: advantageMode
          },
          damageRoll: {
            diceNotation: damageNotation,
            diceRolls: attack.damageRoll.diceRoll.rolls,
            diceTotal: attack.damageRoll.diceRoll.total,
            bonuses: attack.damageRoll.bonuses,
            total: attack.damageRoll.total
          },
          combat: {
            vsDefense: attack.vsDefense,
            attackTotal: attack.attackRoll.total,
            isHit: attack.isHit,
            isCritical: attack.attackRoll.isCritical,
            hitMargin: attack.hitMargin,
            damageDealt: attack.damageDealt,
            hitDescription: attackCalculationsService.getHitDescription(
              attack.isHit,
              attack.hitMargin,
              attack.attackRoll.isCritical
            )
          }
        }
      });
    } catch (error) {
      console.error('Error executing attack:', error);
      res.status(500).json({
        error: 'Failed to execute attack',
        message: error.message
      });
    }
  });

  /**
   * POST /api/calculations/attack/combination
   * Execute multiple attacks (e.g., full attack action)
   *
   * Body:
   * {
   *   attackCount: number,
   *   skillTotal: number,
   *   bonusModifiers: number,
   *   damageNotation: string,
   *   damageBonus: number,
   *   targetDefense: number,
   *   advantageMode: 'normal' | 'advantage' | 'disadvantage'
   * }
   *
   * Returns:
   * {
   *   attacks: Attack[],
   *   hitCount: number,
   *   missCount: number,
   *   totalDamage: number,
   *   averageDamagePerAttack: number
   * }
   */
  app.post('/api/calculations/attack/combination', (req, res) => {
    try {
      const {
        attackCount,
        skillTotal,
        bonusModifiers = 0,
        damageNotation,
        damageBonus = 0,
        targetDefense,
        advantageMode = 'normal'
      } = req.body;

      if (attackCount === undefined || skillTotal === undefined || damageNotation === undefined || targetDefense === undefined) {
        return res.status(400).json({
          error: 'Missing required fields: attackCount, skillTotal, damageNotation, targetDefense'
        });
      }

      const validation = attackCalculationsService.validateAttackParameters(
        skillTotal,
        bonusModifiers,
        damageNotation,
        damageBonus,
        targetDefense
      );

      if (!validation.valid) {
        return res.status(400).json({
          error: 'Invalid attack parameters',
          details: validation.errors
        });
      }

      if (attackCount < 1 || !Number.isInteger(attackCount)) {
        return res.status(400).json({
          error: 'Invalid attackCount: must be a positive integer'
        });
      }

      const advantageModeMap = {
        'normal': 0,
        'advantage': 1,
        'disadvantage': 2
      };
      const mode = advantageModeMap[advantageMode] ?? 0;

      const combination = attackCalculationsService.executeAttackCombination(
        attackCount,
        skillTotal,
        bonusModifiers,
        damageNotation,
        damageBonus,
        targetDefense,
        mode
      );

      res.json({
        success: true,
        combination: {
          attackCount: attackCount,
          attacks: combination.attacks.map((attack, index) => ({
            number: index + 1,
            attackRoll: attack.attackRoll.total,
            isCritical: attack.attackRoll.isCritical,
            damageRoll: attack.damageRoll.total,
            isHit: attack.isHit,
            damageDealt: attack.damageDealt
          })),
          summary: {
            hitCount: combination.hitCount,
            missCount: combination.missCount,
            totalDamage: combination.totalDamage,
            averageDamagePerAttack: combination.totalDamage / attackCount,
            criticalHits: combination.attacks.filter(a => a.attackRoll.isCritical && a.isHit).length
          }
        }
      });
    } catch (error) {
      console.error('Error executing attack combination:', error);
      res.status(500).json({
        error: 'Failed to execute attack combination',
        message: error.message
      });
    }
  });

  /**
   * GET /api/calculations/attack/combination
   * Execute multiple attacks with query parameters
   *
   * Query params:
   *   attackCount: number
   *   skillTotal: number
   *   bonusModifiers: number
   *   damageNotation: string
   *   damageBonus: number
   *   targetDefense: number
   *   advantageMode: 'normal' | 'advantage' | 'disadvantage'
   */
  app.get('/api/calculations/attack/combination', (req, res) => {
    try {
      const {
        attackCount,
        skillTotal,
        bonusModifiers = '0',
        damageNotation,
        damageBonus = '0',
        targetDefense,
        advantageMode = 'normal'
      } = req.query;

      if (!attackCount || !skillTotal || !damageNotation || !targetDefense) {
        return res.status(400).json({
          error: 'Missing required query params: attackCount, skillTotal, damageNotation, targetDefense'
        });
      }

      const attackCountNum = parseInt(attackCount);
      const skillTotalNum = parseInt(skillTotal);
      const bonusModifiersNum = parseInt(bonusModifiers);
      const damageBonusNum = parseInt(damageBonus);
      const targetDefenseNum = parseInt(targetDefense);

      if (attackCountNum < 1 || !Number.isInteger(attackCountNum)) {
        return res.status(400).json({
          error: 'Invalid attackCount: must be a positive integer'
        });
      }

      const validation = attackCalculationsService.validateAttackParameters(
        skillTotalNum,
        bonusModifiersNum,
        damageNotation,
        damageBonusNum,
        targetDefenseNum
      );

      if (!validation.valid) {
        return res.status(400).json({
          error: 'Invalid attack parameters',
          details: validation.errors
        });
      }

      const advantageModeMap = {
        'normal': 0,
        'advantage': 1,
        'disadvantage': 2
      };
      const mode = advantageModeMap[advantageMode] ?? 0;

      const combination = attackCalculationsService.executeAttackCombination(
        attackCountNum,
        skillTotalNum,
        bonusModifiersNum,
        damageNotation,
        damageBonusNum,
        targetDefenseNum,
        mode
      );

      res.json({
        success: true,
        combination: {
          attackCount: attackCountNum,
          attacks: combination.attacks.map((attack, index) => ({
            number: index + 1,
            attackRoll: attack.attackRoll.total,
            isCritical: attack.attackRoll.isCritical,
            damageRoll: attack.damageRoll.total,
            isHit: attack.isHit,
            damageDealt: attack.damageDealt
          })),
          summary: {
            hitCount: combination.hitCount,
            missCount: combination.missCount,
            totalDamage: combination.totalDamage,
            averageDamagePerAttack: combination.totalDamage / attackCountNum,
            criticalHits: combination.attacks.filter(a => a.attackRoll.isCritical && a.isHit).length
          }
        }
      });
    } catch (error) {
      console.error('Error executing attack combination:', error);
      res.status(500).json({
        error: 'Failed to execute attack combination',
        message: error.message
      });
    }
  });

  /**
   * POST /api/calculations/attack/validate
   * Validate attack parameters without executing
   *
   * Body:
   * {
   *   skillTotal: number,
   *   bonusModifiers: number,
   *   damageNotation: string,
   *   damageBonus: number,
   *   targetDefense: number
   * }
   *
   * Returns:
   * {
   *   valid: boolean,
   *   errors: string[],
   *   summary: {
   *     attackPower: number (skillTotal + bonusModifiers),
   *     expectedDamageRange: string (e.g., "2-8"),
   *     defenseDifficulty: string (easy/medium/hard)
   *   }
   * }
   */
  app.post('/api/calculations/attack/validate', (req, res) => {
    try {
      const {
        skillTotal,
        bonusModifiers = 0,
        damageNotation,
        damageBonus = 0,
        targetDefense
      } = req.body;

      if (skillTotal === undefined || damageNotation === undefined || targetDefense === undefined) {
        return res.status(400).json({
          error: 'Missing required fields: skillTotal, damageNotation, targetDefense'
        });
      }

      const validation = attackCalculationsService.validateAttackParameters(
        skillTotal,
        bonusModifiers,
        damageNotation,
        damageBonus,
        targetDefense
      );

      // Parse damage notation to provide range
      let expectedDamageRange = 'unknown';
      try {
        const parsed = attackCalculationsService.parseDiceNotation(damageNotation);
        const min = parsed.count + parsed.bonus;
        const max = parsed.count * parsed.sides + parsed.bonus;
        expectedDamageRange = `${Math.max(0, min)}-${Math.max(0, max)}`;
      } catch (e) {
        // If notation is invalid, validation will catch it
      }

      // Estimate difficulty
      const attackPower = skillTotal + bonusModifiers;
      let defenseDifficulty = 'medium';
      if (targetDefense > attackPower + 5) {
        defenseDifficulty = 'hard';
      } else if (targetDefense < attackPower - 5) {
        defenseDifficulty = 'easy';
      }

      res.json({
        success: true,
        validation: {
          valid: validation.valid,
          errors: validation.errors,
          summary: {
            attackPower: attackPower,
            expectedDamageRange: expectedDamageRange,
            defenseDifficulty: defenseDifficulty,
            hitProbability: validation.valid
              ? Math.min(100, Math.max(5, (attackPower - targetDefense) * 5 + 50)) + '%'
              : 'unknown'
          }
        }
      });
    } catch (error) {
      console.error('Error validating attack:', error);
      res.status(500).json({
        error: 'Failed to validate attack',
        message: error.message
      });
    }
  });

  /**
   * GET /api/calculations/attack/validate
   * Validate attack parameters with query parameters
   *
   * Query params:
   *   skillTotal: number
   *   bonusModifiers: number
   *   damageNotation: string
   *   damageBonus: number
   *   targetDefense: number
   */
  app.get('/api/calculations/attack/validate', (req, res) => {
    try {
      const {
        skillTotal,
        bonusModifiers = '0',
        damageNotation,
        damageBonus = '0',
        targetDefense
      } = req.query;

      if (!skillTotal || !damageNotation || !targetDefense) {
        return res.status(400).json({
          error: 'Missing required query params: skillTotal, damageNotation, targetDefense'
        });
      }

      const skillTotalNum = parseInt(skillTotal);
      const bonusModifiersNum = parseInt(bonusModifiers);
      const damageBonusNum = parseInt(damageBonus);
      const targetDefenseNum = parseInt(targetDefense);

      const validation = attackCalculationsService.validateAttackParameters(
        skillTotalNum,
        bonusModifiersNum,
        damageNotation,
        damageBonusNum,
        targetDefenseNum
      );

      let expectedDamageRange = 'unknown';
      try {
        const parsed = attackCalculationsService.parseDiceNotation(damageNotation);
        const min = parsed.count + parsed.bonus;
        const max = parsed.count * parsed.sides + parsed.bonus;
        expectedDamageRange = `${Math.max(0, min)}-${Math.max(0, max)}`;
      } catch (e) {
        // If notation is invalid, validation will catch it
      }

      const attackPower = skillTotalNum + bonusModifiersNum;
      let defenseDifficulty = 'medium';
      if (targetDefenseNum > attackPower + 5) {
        defenseDifficulty = 'hard';
      } else if (targetDefenseNum < attackPower - 5) {
        defenseDifficulty = 'easy';
      }

      res.json({
        success: true,
        validation: {
          valid: validation.valid,
          errors: validation.errors,
          summary: {
            attackPower: attackPower,
            expectedDamageRange: expectedDamageRange,
            defenseDifficulty: defenseDifficulty,
            hitProbability: validation.valid
              ? Math.min(100, Math.max(5, (attackPower - targetDefenseNum) * 5 + 50)) + '%'
              : 'unknown'
          }
        }
      });
    } catch (error) {
      console.error('Error validating attack:', error);
      res.status(500).json({
        error: 'Failed to validate attack',
        message: error.message
      });
    }
  });
}

export { createAttackCalculationsRoutes };
