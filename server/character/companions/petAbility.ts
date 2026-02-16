/**
 * PetAbility: Defines special actions and abilities a companion can perform.
 * Includes combat actions (attacks), utility actions (abilities), and passive traits.
 */

export type ActionCost = 'free' | '1-action' | '2-actions';
export type AbilityType = 'attack' | 'utility' | 'passive' | 'reaction';
export type DamageType =
  | 'keen'
  | 'fire'
  | 'frost'
  | 'spark'
  | 'sonic'
  | 'force'
  | 'poison'
  | 'light'
  | 'dark';

export interface DamageRoll {
  statistic: string; // e.g., 'keen', 'fire'
  bonus?: number; // e.g., +5 for Bite
  dice?: string; // e.g., '1d4', '2d8'
  description?: string; // e.g., '7 (1d4 + 5) keen damage'
}

export interface AbilityRequirement {
  type: 'focus' | 'health' | 'investiture' | 'condition';
  value?: number; // e.g., at least 2 focus to use
  description: string;
}

export interface PetAbility {
  id: string;
  name: string;
  type: AbilityType;
  actionCost: ActionCost;
  range: string; // e.g., '5 ft.', '20 ft.', 'self'
  description: string;
  detailedEffect?: string; // Full rules text
  attack?: {
    bonus: number; // e.g., +5
    reach?: string; // e.g., '5 ft.'
    target: string; // e.g., 'one target'
    onHit: DamageRoll[];
    onGraze?: DamageRoll[]; // For partial hits
  };
  utility?: {
    target: string; // e.g., 'one object within 5 ft.'
    effect: string;
    check?: {
      statistic: string; // e.g., 'Agility'
      against: string; // e.g., 'Spiritual defense'
    };
  };
  passive?: {
    description: string;
    effects: string[];
  };
  cost?: {
    focus?: number;
    investiture?: number;
    health?: number;
  };
  limitations?: string[];
  source?: string; // e.g., 'Special Companion – Small Animal'
}
