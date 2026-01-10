import { BonusEffect } from "../bonuses/bonusModule";

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
  otherEffects?: string[]; // Descriptions of non-bonus effects
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