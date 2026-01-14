/**
 * Attack System - Core Interfaces
 * 
 * Extensible attack system that connects weapons, talents, and character stats
 * to generate available attack actions for combat.
 */

export type AttackSource = 'weapon' | 'talent' | 'combined';
export type DefenseType = 'Physical' | 'Cognitive' | 'Spiritual';
export type DamageType = 'keen' | 'impact' | 'energy' | 'vital' | 'spirit';

/**
 * Represents a combat action (attack) available to the character.
 * Can be generated from equipped weapons, combat talents, or combination of both.
 */
export interface Attack {
  /** Unique identifier for this attack */
  id: string;
  
  /** Display name for the attack */
  name: string;
  
  /** Source of this attack */
  source: AttackSource;
  
  /** Reference to weapon item if weapon-based */
  weaponId?: string;
  
  /** Reference to talent if talent-based */
  talentId?: string;
  
  /** Total attack bonus (skill + attribute + bonuses) */
  attackBonus: number;
  
  /** Damage dice expression (e.g., "1d8+3", "2d6+1d4") */
  damage: string;
  
  /** Type of damage dealt */
  damageType: DamageType;
  
  /** Attack range description (e.g., "Melee", "Ranged[80/320]") */
  range: string;
  
  /** Which defense the attack targets */
  targetDefense: DefenseType;
  
  /** Number of actions required to make this attack */
  actionCost: number;
  
  /** Resource costs (focus, investiture, etc.) */
  resourceCost?: ResourceCost;
  
  /** Weapon and talent traits that apply to this attack */
  traits: string[];
  
  /** Detailed description of the attack's effects */
  description: string;
  
  /** 
   * Custom modifiers for future extensibility 
   * (advantages, conditions, temporary buffs, etc.)
   */
  customModifiers?: AttackModifier[];
}

/**
 * Resource cost for special attacks
 */
export interface ResourceCost {
  type: 'focus' | 'investiture';
  amount: number;
}

/**
 * Extensible modifier system for future combat features
 */
export interface AttackModifier {
  /** Modifier source identifier */
  source: string;
  
  /** Type of modification */
  type: 'damage' | 'attackBonus' | 'trait' | 'other';
  
  /** Modifier value (if numeric) */
  value?: number | string;
  
  /** Description of the modifier */
  description: string;
  
  /** Optional condition for when this modifier applies */
  condition?: string;
}

/**
 * Active stance affecting combat capabilities
 */
export interface Stance {
  /** Stance identifier */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Stance description and effects */
  description: string;
  
  /** Talent that grants this stance */
  talentId: string;
  
  /** Action cost to activate/switch */
  activationCost: number;
  
  /** Effects while stance is active */
  effects: string[];
  
  /** Bonuses applied by this stance */
  bonuses?: AttackModifier[];
}
