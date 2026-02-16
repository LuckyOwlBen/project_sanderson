/**
 * Client-side PetAbility: Defines special actions and abilities a companion can perform.
 * Mirrors server-side definition for UI display and calculations.
 */

export type ActionCost = 'free' | '1-action' | '2-actions';
export type AbilityType = 'attack' | 'utility' | 'passive' | 'reaction';
export type DamageType = 'keen' | 'fire' | 'frost' | 'spark' | 'sonic' | 'force' | 'poison' | 'light' | 'dark';

export interface DamageRoll {
  statistic: string;
  bonus?: number;
  dice?: string;
  description?: string;
}

export interface AbilityRequirement {
  type: 'focus' | 'health' | 'investiture' | 'condition';
  value?: number;
  description: string;
}

export interface PetAbility {
  id: string;
  name: string;
  type: AbilityType;
  actionCost: ActionCost;
  range: string;
  description: string;
  detailedEffect?: string;
  attack?: {
    bonus: number;
    reach?: string;
    target: string;
    onHit: DamageRoll[];
    onGraze?: DamageRoll[];
  };
  utility?: {
    target: string;
    effect: string;
    check?: {
      statistic: string;
      against: string;
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
  source?: string;
}
