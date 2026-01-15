export enum BonusType {
  ATTRIBUTE = 'attribute',
  SKILL = 'skill',
  DEFENSE = 'defense',
  RESOURCE = 'resource',
  DERIVED = 'derived',
  DEFLECT = 'deflect',
}

export interface BonusEffect {
  type: BonusType;
  target: string; // e.g., 'strength', 'athletics', 'parry'
  value?: number;
  formula?: string; // e.g., '1 + tier', 'perception.ranks', 'athletics.ranks / 2'
  scaling?: boolean;
  condition?: string;
}

export class BonusModule {
  private activeEffects: Map<string, BonusEffect[]> = new Map();

  addBonus(source: string, effect: BonusEffect): void {
    if (!this.activeEffects.has(source)) {
      this.activeEffects.set(source, []);
    }
    this.activeEffects.get(source)!.push(effect);
  }

  removeBonus(source: string): void {
    this.activeEffects.delete(source);
  }

  /**
   * Evaluate a bonus effect, resolving formulas if present
   * @param effect The bonus effect with optional formula
   * @param context Character context for formula evaluation (tier, skill ranks, etc)
   * @returns The numeric value of the bonus
   */
  evaluateBonus(effect: BonusEffect, context?: { tier: number; skillRanks?: Map<string, number> }): number {
    // If formula is present, evaluate it
    if (effect.formula && context) {
      return this.evaluateFormula(effect.formula, context);
    }
    // Fall back to direct value
    return effect.value ?? 0;
  }

  /**
   * Evaluate a formula string with character context
   * Supports: '1 + tier', 'perception.ranks', 'athletics.ranks / 2', etc.
   */
  private evaluateFormula(formula: string, context: { tier: number; skillRanks?: Map<string, number> }): number {
    try {
      // Replace 'tier' with the character's tier
      let expr = formula.replace(/\btier\b/g, context.tier.toString());

      // Replace 'skill.ranks' patterns with actual skill rank values
      // e.g., 'perception.ranks' -> 3
      if (context.skillRanks) {
        expr = expr.replace(/\b(\w+)\.ranks\b/g, (match, skillName) => {
          const rank = context.skillRanks?.get(skillName.toLowerCase()) ?? 0;
          return rank.toString();
        });
      }

      // Safely evaluate the expression (only math operations and numbers)
      // This is a simple evaluator - for production, consider using a math expression library
      if (!/^[\d+\-*/(). ]+$/.test(expr)) {
        console.warn(`Invalid formula expression: ${formula}`);
        return 0;
      }

      // Use Function constructor (safer than eval for math expressions)
      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${expr}`)() as number;
      return Math.floor(result); // Ensure integer result
    } catch (error) {
      console.error(`Error evaluating formula "${formula}":`, error);
      return 0;
    }
  }

  getBonusesFor(type: BonusType, target: string, context?: { tier: number; skillRanks?: Map<string, number> }): number {
    let total = 0;
    for (const effects of this.activeEffects.values()) {
      for (const e of effects) {
        if (e.type === type && e.target === target) {
          total += this.evaluateBonus(e, context);
        }
      }
    }
    return total;
  }
}