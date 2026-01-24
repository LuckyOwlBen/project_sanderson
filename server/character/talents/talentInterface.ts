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

/**
 * Action economy grants
 * For talents that grant additional actions or reactions
 */
export interface ActionGrant {
  /** Type of action granted */
  type: 'action' | 'reaction' | 'free-action';
  
  /** Number of actions/reactions granted */
  count: number;
  
  /** When the action is granted */
  timing?: 'start-of-combat' | 'start-of-turn' | 'end-of-turn' | 'always';
  
  /** Restriction on what the action can be used for */
  restrictedTo?: string; // e.g., "Strike only", "Move only", "Sustain only"
  
  /** Frequency limitation */
  frequency?: 'once-per-round' | 'once-per-scene' | 'once-per-session' | 'unlimited';
}

/**
 * Condition effects (application, removal, immunity)
 */
export interface ConditionEffect {
  /** Type of condition effect */
  type: 'apply' | 'ignore' | 'immune' | 'prevent';
  
  /** Condition name */
  condition: string; // 'Surprised', 'Disoriented', 'Stunned', 'Prone', 'Immobilized', 'Exhausted', 'Slowed', etc.
  
  /** When this effect triggers */
  trigger?: string; // e.g., "on hit", "when attacked", "while in stance"
  
  /** Target of the condition (self, target, etc.) */
  target?: 'self' | 'target' | 'all-enemies' | 'all-allies';
  
  /** Duration if applying a condition */
  duration?: string; // e.g., "end of target's next turn", "1 round", "scene"
  
  /** Additional condition details */
  details?: string;
}

/**
 * Resource triggers (focus recovery, investiture manipulation, etc.)
 */
export interface ResourceTrigger {
  /** Resource affected */
  resource: 'focus' | 'investiture' | 'health';
  
  /** Effect type */
  effect: 'recover' | 'spend' | 'reduce-cost';
  
  /** Amount (can be formula) */
  amount: number | string; // number or formula like "tier" or "1 + tier"
  
  /** When this trigger activates */
  trigger: string; // e.g., "on kill", "on hit", "start of turn", "when you miss"
  
  /** Frequency limitation */
  frequency?: 'once-per-round' | 'once-per-scene' | 'unlimited';
  
  /** Condition for the trigger */
  condition?: string;
}

/**
 * Movement effects and modifications
 */
export interface MovementEffect {
  /** Type of movement effect */
  type: 'increase-rate' | 'special-movement' | 'ignore-terrain' | 'teleport';
  
  /** Amount of movement (in feet) or formula */
  amount?: number | string;
  
  /** When this movement is available */
  timing?: 'before-attack' | 'after-attack' | 'as-part-of-action' | 'always';
  
  /** Special movement type */
  movementType?: 'walk' | 'leap' | 'climb' | 'swim' | 'fly';
  
  /** Additional restrictions or conditions */
  condition?: string; // e.g., "ignore difficult terrain", "can move through enemies"
  
  /** Action cost of the movement */
  actionCost?: 'free' | 'part-of-action' | 'full-action';
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
  otherEffects?: string[]; // Descriptions of non-bonus effects (ONLY for truly complex mechanics that can't be structured)
  
  // Structured data fields - these replace otherEffects wherever possible
  /** Structured expertise grants - replaces text parsing */
  expertiseGrants?: ExpertiseGrant[];
  
  /** Structured trait grants to items */
  traitGrants?: TraitGrant[];
  
  /** Structured attack definition for combat talents */
  attackDefinition?: AttackDefinition;
  
  /** Action economy modifications */
  actionGrants?: ActionGrant[];
  
  /** Condition application, immunity, or removal */
  conditionEffects?: ConditionEffect[];
  
  /** Resource triggers and manipulations */
  resourceTriggers?: ResourceTrigger[];
  
  /** Movement modifications and special movement */
  movementEffects?: MovementEffect[];
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