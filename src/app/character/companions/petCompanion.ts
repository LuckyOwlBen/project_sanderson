import { PetAbility } from './petAbility';

/**
 * Client-side PetStatBlock: The base definition for a pet companion.
 * Mirrors server-side definition.
 */
export interface PetStatBlock {
  id: string;
  name: string;
  type: string;
  species: string;
  intelligence: 'animal' | 'sapient';
  behavior: string;

  health: {
    current: number;
    max: number;
  };
  focus: {
    current: number;
    max: number;
  };

  movement: {
    ground?: number;
    flying?: number;
  };
  senses?: {
    range: number;
    types: string[];
  };

  deflect: number;

  physicalSkills?: Record<string, number>;
  spiritualSkills?: Record<string, number>;

  abilities: PetAbility[];

  specialTraits?: string[];
  languages?: string;

  description?: string;
  source?: string;
}

/**
 * Client-side PetCompanion: A bonded companion instance with current state.
 * Tracks active health, focus, and references the stat block definition.
 */
export class PetCompanion {
  readonly id: string;
  readonly statBlock: PetStatBlock;
  currentHealth: number;
  currentFocus: number;

  constructor(statBlock: PetStatBlock) {
    this.id = statBlock.id;
    this.statBlock = statBlock;
    this.currentHealth = statBlock.health.max;
    this.currentFocus = statBlock.focus.max;
  }

  // ===== RESOURCE MANAGEMENT =====

  takeDamage(amount: number): number {
    const damage = Math.min(amount, this.currentHealth);
    this.currentHealth -= damage;
    return damage;
  }

  restoreHealth(amount: number): number {
    const restored = Math.min(amount, this.statBlock.health.max - this.currentHealth);
    this.currentHealth += restored;
    return restored;
  }

  spendFocus(amount: number): boolean {
    if (this.currentFocus >= amount) {
      this.currentFocus -= amount;
      return true;
    }
    return false;
  }

  restoreFocus(amount: number): number {
    const restored = Math.min(amount, this.statBlock.focus.max - this.currentFocus);
    this.currentFocus += restored;
    return restored;
  }

  // ===== ABILITY ACCESS =====

  getAbilities(): PetAbility[] {
    return this.statBlock.abilities;
  }

  getAbilityById(abilityId: string): PetAbility | undefined {
    return this.statBlock.abilities.find((a) => a.id === abilityId);
  }

  canUseAbility(abilityId: string): boolean {
    const ability = this.getAbilityById(abilityId);
    if (!ability) return false;

    if (ability.cost?.focus && this.currentFocus < ability.cost.focus) {
      return false;
    }

    if (ability.cost?.health && this.currentHealth < ability.cost.health) {
      return false;
    }

    return true;
  }

  // ===== STATE =====

  isAlive(): boolean {
    return this.currentHealth > 0;
  }

  isFocused(): boolean {
    return this.currentFocus > 0;
  }

  toJSON() {
    return {
      id: this.id,
      statBlock: this.statBlock,
      currentHealth: this.currentHealth,
      currentFocus: this.currentFocus,
    };
  }

  static fromJSON(data: any): PetCompanion {
    const companion = new PetCompanion(data.statBlock);
    companion.currentHealth = data.currentHealth;
    companion.currentFocus = data.currentFocus;
    return companion;
  }
}
