import { BonusEffect } from "../bonuses/bonusModule";
import { DefenseType, DamageType } from "../attacks/attackInterfaces";

export interface TalentPrerequisite {
  type: 'talent' | 'skill' | 'attribute' | 'level' | 'ideal';
  target: string; // talent ID, skill name, attribute name, 'character', or ideal level ('first', 'second', etc.)
  value?: number; // For skill ranks, attribute values, level, or ideal level (1-5)
  operator?: 'AND' | 'OR'; // Default is And
}

export enum ActionCostCode {
  Free = 0,
  Reaction = -1,
  Special = -2,
  Passive = Infinity,
}

/**
 * Structured expertise grant from a talent
 * Replaces text parsing of otherEffects for expertise grants
 */
export interface ExpertiseGrant {
  /** Type of grant */
  type: 'fixed' | 'choice' | 'category';
  
  /** Fixed expertises granted (for type: 'fixed') */
  expertises?: string[];
  
  /** Number of choices allowed (for type: 'choice') */
  choiceCount?: number;
  
  /** List of options to choose from (for type: 'choice') */
  options?: string[];
  
  /** Category to expand (for type: 'category') */
  category?: 'weapon' | 'armor' | 'cultural' | 'utility' | 'specialist';
}

/**
 * Structured trait grant/modification from a talent
 * Allows talents to add traits to specific items or categories
 */
export interface TraitGrant {
  /** Items this grant applies to */
  targetItems: string[] | 'all' | { category: string };
  
  /** Traits to add */
  traits: string[];
  
  /** Whether these are expert traits (require expertise) */
  expert: boolean;
}

/**
 * Structured attack definition for combat talents
 * For talents that generate attacks (actions > 0, reactions, etc.)
 */
export interface AttackDefinition {
  /** Required weapon type */
  weaponType?: 'light' | 'heavy' | 'unarmed' | 'any';
  
  /** Defense the attack targets */
  targetDefense: DefenseType;
  
  /** Attack range */
  range: 'melee' | 'ranged' | 'special';
  
  /** Base damage dice */
  baseDamage?: string;
  
  /** Damage type override */
  damageType?: DamageType;
  
  /** Damage scaling by tier */
  damageScaling?: Array<{ tier: number; damage: string }>;
  
  /** Conditional advantages */
  conditionalAdvantages?: Array<{ condition: string; value: number }>;
  
  /** Resource cost (focus, investiture) */
  resourceCost?: { type: 'focus' | 'investiture'; amount: number };
  
  /** Complex mechanics that can't be fully structured yet */
  specialMechanics?: string[];
}

export interface TalentNode {
  id: string;
  name: string;
  description: string;
  actionCost: number | ActionCostCode;
  specialActivation?: string; // Description of special activation if actionCost is Special
  prerequisites: TalentPrerequisite[]; // IDs of required talents
  tier: number;
  pathRequirement?: string; // Optional path restriction
  bonuses: BonusEffect[];
  grantsAdvantage?: string[]; // Situations/skills that grant advantage
  grantsDisadvantage?: string[]; // Situations/skills that grant disadvantage
  otherEffects?: string[]; // Descriptions of non-bonus effects (being deprecated)
  
  // NEW: Structured data fields
  /** Structured expertise grants - replaces text parsing */
  expertiseGrants?: ExpertiseGrant[];
  
  /** Structured trait grants to items */
  traitGrants?: TraitGrant[];
  
  /** Structured attack definition for combat talents */
  attackDefinition?: AttackDefinition;
}

/** For quick copy paste of new talent nodes
 * {
            id:,
            name:,
            description:,
            actionCost:,
            prerequisites: [],
            tier:,
            bonuses: [],
        },
 */

export interface TalentTree {
  pathName: string;
  nodes: TalentNode[];
}

export interface TalentPath {
  name: string;
  paths: TalentTree[];
  talentNodes?: TalentNode[]; // For talent nodes not in a specific tree
}