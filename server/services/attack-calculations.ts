/**
 * Attack Calculations Service
 * 
 * Handles all attack and damage calculations including:
 * - Single attack rolls
 * - Damage calculations
 * - Attack combinations (multiple attacks)
 * - Advantage/disadvantage mechanics
 * - Defense vs attack comparisons
 * - Hit determination and margin of success
 * 
 * This is the single source of truth for combat calculations.
 * All attack decisions must be validated here.
 */

/**
 * Advantage/Disadvantage mode
 */
export enum AdvantageMode {
  NORMAL = 'normal',
  ADVANTAGE = 'advantage',
  DISADVANTAGE = 'disadvantage'
}

/**
 * Single die roll result
 */
export interface DiceRoll {
  sides: number;
  rolls: number[];
  total: number;
}

/**
 * Attack roll result (skill check)
 */
export interface AttackRoll {
  rollDescription: string;        // 'd20', 'd20+3', etc
  diceRoll: DiceRoll;            // Raw dice rolls
  skillModifier: number;          // Skill total (rank + attribute/2)
  bonusModifiers: number;         // From items, effects, etc
  advantageMode: AdvantageMode;
  rollsGenerated: number[];       // All rolls (for advantage, will be 2)
  finalRoll: number;             // Selected roll (base roll for normal, best for advantage, worst for disadvantage)
  total: number;                 // finalRoll + modifiers
  isCritical: boolean;           // Natural 20 on d20
  isFumble: boolean;             // Natural 1 on d20
}

/**
 * Damage roll result
 */
export interface DamageRoll {
  rollDescription: string;        // 'd6+2', etc
  diceRoll: DiceRoll;
  bonuses: number;               // Additional flat damage
  total: number;
}

/**
 * Complete attack result
 */
export interface Attack {
  attackRoll: AttackRoll;
  damageRoll: DamageRoll;
  vsDefense: number;             // Opponent's defense
  hitMargin: number;             // How much attack exceeded defense
  isHit: boolean;                // true if total >= defense
  damageDealt: number;           // Damage if hit, 0 if miss
}

/**
 * Multiple attacks result (when attacking multiple times)
 */
export interface AttackCombination {
  attacks: Attack[];
  totalDamage: number;
  hitCount: number;
  missCount: number;
}

/**
 * Attack Calculations Service
 */
export class AttackCalculationsService {
  /**
   * Roll a d20 once
   */
  rollD20(): number {
    return Math.floor(Math.random() * 20) + 1;
  }

  /**
   * Roll arbitrary dice
   * 
   * @param sides - Number of sides on die (d6, d8, d10, d12, d20)
   * @param count - Number of dice to roll (default 1)
   * @returns DiceRoll with all rolls and total
   */
  rollDice(sides: number, count: number = 1): DiceRoll {
    if (sides < 2) {
      throw new Error('Dice must have at least 2 sides');
    }
    if (count < 1) {
      throw new Error('Must roll at least 1 die');
    }

    const rolls: number[] = [];
    for (let i = 0; i < count; i++) {
      rolls.push(Math.floor(Math.random() * sides) + 1);
    }

    const total = rolls.reduce((sum, roll) => sum + roll, 0);

    return {
      sides,
      rolls,
      total
    };
  }

  /**
   * Parse a dice notation string (e.g., 'd20', '2d6+3', 'd8')
   * 
   * @param notation - Dice notation string
   * @returns {count, sides, bonus}
   */
  parseDiceNotation(notation: string): { count: number; sides: number; bonus: number } {
    const pattern = /^(\d*)d(\d+)([+-]\d+)?$/i;
    const match = notation.toLowerCase().match(pattern);

    if (!match) {
      throw new Error(`Invalid dice notation: ${notation}`);
    }

    const count = match[1] ? parseInt(match[1], 10) : 1;
    const sides = parseInt(match[2], 10);
    const bonus = match[3] ? parseInt(match[3], 10) : 0;

    return { count, sides, bonus };
  }

  /**
   * Calculate attack roll
   * 
   * Attack Roll = d20 + Skill Total + Bonuses (with advantage/disadvantage)
   * Advantage: roll 2d20, take higher
   * Disadvantage: roll 2d20, take lower
   * 
   * @param skillTotal - Skill total (rank + attribute/2)
   * @param bonusModifiers - Additional bonuses from items/effects
   * @param advantageMode - Normal/advantage/disadvantage
   * @returns AttackRoll with breakdown
   */
  calculateAttackRoll(
    skillTotal: number = 0,
    bonusModifiers: number = 0,
    advantageMode: AdvantageMode = AdvantageMode.NORMAL
  ): AttackRoll {
    let rollsGenerated: number[] = [];
    let finalRoll: number;

    if (advantageMode === AdvantageMode.NORMAL) {
      // Single d20 roll
      finalRoll = this.rollD20();
      rollsGenerated = [finalRoll];
    } else if (advantageMode === AdvantageMode.ADVANTAGE) {
      // Roll 2d20, take higher
      const roll1 = this.rollD20();
      const roll2 = this.rollD20();
      rollsGenerated = [roll1, roll2];
      finalRoll = Math.max(roll1, roll2);
    } else {
      // Disadvantage: roll 2d20, take lower
      const roll1 = this.rollD20();
      const roll2 = this.rollD20();
      rollsGenerated = [roll1, roll2];
      finalRoll = Math.min(roll1, roll2);
    }

    const isCritical = rollsGenerated.some(r => r === 20);
    const isFumble = rollsGenerated.some(r => r === 1);

    const total = finalRoll + skillTotal + bonusModifiers;

    return {
      rollDescription: `d20${skillTotal > 0 ? '+' + skillTotal : ''}${bonusModifiers > 0 ? '+' + bonusModifiers : ''}`,
      diceRoll: {
        sides: 20,
        rolls: [finalRoll],
        total: finalRoll
      },
      skillModifier: skillTotal,
      bonusModifiers,
      advantageMode,
      rollsGenerated,
      finalRoll,
      total,
      isCritical,
      isFumble
    };
  }

  /**
   * Calculate damage roll
   * 
   * Damage Roll = XdY + Bonuses
   * 
   * @param diceNotation - Notation like 'd6', '2d6+3', 'd8+2'
   * @param bonuses - Additional flat damage
   * @returns DamageRoll with breakdown
   */
  calculateDamageRoll(diceNotation: string, bonuses: number = 0): DamageRoll {
    const { count, sides, bonus } = this.parseDiceNotation(diceNotation);
    const diceRoll = this.rollDice(sides, count);
    const totalBonus = bonus + bonuses;
    const total = diceRoll.total + totalBonus;

    return {
      rollDescription: diceNotation + (bonuses > 0 ? `+${bonuses}` : ''),
      diceRoll,
      bonuses: totalBonus,
      total: Math.max(0, total) // Damage cannot be negative
    };
  }

  /**
   * Check if attack hits target
   * 
   * Hit if: Attack Total >= Defense
   * 
   * @param attackTotal - Total attack roll
   * @param targetDefense - Target's defense value
   * @returns {isHit, hitMargin}
   */
  checkHit(attackTotal: number, targetDefense: number): { isHit: boolean; hitMargin: number } {
    const hitMargin = attackTotal - targetDefense;
    return {
      isHit: attackTotal >= targetDefense,
      hitMargin
    };
  }

  /**
   * Determine damage dealt based on hit/miss
   * 
   * - Hit: Full damage
   * - Miss: No damage
   * - Critical: Double damage
   * 
   * @param damage - Base damage from damage roll
   * @param isHit - Whether attack hit
   * @param isCritical - Whether attack was critical
   * @returns Actual damage dealt
   */
  getDamageDealt(damage: number, isHit: boolean, isCritical: boolean = false): number {
    if (!isHit) {
      return 0;
    }
    if (isCritical) {
      return damage * 2;
    }
    return damage;
  }

  /**
   * Execute complete single attack
   * 
   * @param skillTotal - Skill total (rank + attribute/2)
   * @param attackBonus - Attack roll bonuses
   * @param damageNotation - Damage dice notation
   * @param damageBonus - Damage bonuses
   * @param targetDefense - Target's defense
   * @param advantageMode - Advantage/disadvantage mode
   * @returns Complete Attack result
   */
  executeAttack(
    skillTotal: number = 0,
    attackBonus: number = 0,
    damageNotation: string = 'd6',
    damageBonus: number = 0,
    targetDefense: number = 10,
    advantageMode: AdvantageMode = AdvantageMode.NORMAL
  ): Attack {
    const attackRoll = this.calculateAttackRoll(skillTotal, attackBonus, advantageMode);
    const damageRoll = this.calculateDamageRoll(damageNotation, damageBonus);

    const { isHit, hitMargin } = this.checkHit(attackRoll.total, targetDefense);
    const damageDealt = this.getDamageDealt(damageRoll.total, isHit, attackRoll.isCritical);

    return {
      attackRoll,
      damageRoll,
      vsDefense: targetDefense,
      hitMargin,
      isHit,
      damageDealt
    };
  }

  /**
   * Execute multiple attacks at once (attack combination)
   * Used when character can make multiple attacks
   * 
   * @param attackCount - Number of attacks to make
   * @param skillTotal - Skill total
   * @param attackBonus - Attack roll bonuses
   * @param damageNotation - Damage dice notation
   * @param damageBonus - Damage bonuses
   * @param targetDefense - Target's defense
   * @param advantageMode - Advantage/disadvantage mode (same for all attacks)
   * @returns AttackCombination with all attacks and totals
   */
  executeAttackCombination(
    attackCount: number,
    skillTotal: number = 0,
    attackBonus: number = 0,
    damageNotation: string = 'd6',
    damageBonus: number = 0,
    targetDefense: number = 10,
    advantageMode: AdvantageMode = AdvantageMode.NORMAL
  ): AttackCombination {
    if (attackCount < 1) {
      throw new Error('Must make at least 1 attack');
    }

    const attacks: Attack[] = [];
    let totalDamage = 0;
    let hitCount = 0;

    for (let i = 0; i < attackCount; i++) {
      const attack = this.executeAttack(
        skillTotal,
        attackBonus,
        damageNotation,
        damageBonus,
        targetDefense,
        advantageMode
      );
      attacks.push(attack);

      if (attack.isHit) {
        hitCount++;
      }
      totalDamage += attack.damageDealt;
    }

    return {
      attacks,
      totalDamage,
      hitCount,
      missCount: attackCount - hitCount
    };
  }

  /**
   * Validate attack parameters
   */
  validateAttackParameters(
    skillTotal: number,
    attackBonus: number,
    damageNotation: string,
    damageBonus: number,
    targetDefense: number
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (typeof skillTotal !== 'number' || skillTotal < 0) {
      errors.push('Skill total must be non-negative number');
    }
    if (typeof attackBonus !== 'number') {
      errors.push('Attack bonus must be a number');
    }
    if (typeof damageBonus !== 'number') {
      errors.push('Damage bonus must be a number');
    }
    if (typeof targetDefense !== 'number' || targetDefense < 1) {
      errors.push('Target defense must be positive number');
    }

    try {
      this.parseDiceNotation(damageNotation);
    } catch (e) {
      errors.push(`Invalid damage notation: ${damageNotation}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get advantage/disadvantage description
   */
  getAdvantageDescription(mode: AdvantageMode): string {
    switch (mode) {
      case AdvantageMode.ADVANTAGE:
        return 'Roll 2d20, take higher';
      case AdvantageMode.DISADVANTAGE:
        return 'Roll 2d20, take lower';
      default:
        return 'Roll 1d20';
    }
  }

  /**
   * Get hit result description
   */
  getHitDescription(isHit: boolean, hitMargin: number, isCritical: boolean): string {
    if (isCritical && isHit) {
      return `CRITICAL HIT (+${hitMargin} margin)`;
    }
    if (isHit) {
      return `HIT (+${hitMargin} margin)`;
    }
    if (hitMargin === -1) {
      return 'MISS (off by 1)';
    }
    return `MISS (off by ${Math.abs(hitMargin)})`;
  }
}

// Export singleton instance
export const attackCalculationsService = new AttackCalculationsService();
