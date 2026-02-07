/**
 * Bonus System - Shared Type Definitions
 * 
 * Interfaces for character bonuses and effects
 */

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
