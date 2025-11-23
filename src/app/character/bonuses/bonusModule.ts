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
  value: number;
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

  getBonusesFor(type: BonusType, target: string): number {
    let total = 0;
    for (const effects of this.activeEffects.values()) {
      total += effects
        .filter(e => e.type === type && e.target === target)
        .reduce((sum, e) => sum + e.value, 0);
    }
    return total;
  }
}