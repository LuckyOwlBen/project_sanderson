export enum SkillType {
    AGILITY = 'AGILITY',
    ATHLETICS = 'ATHLETICS',
    HEAVY_WEAPONRY = 'HEAVY_WEAPONRY',
    LIGHT_WEAPONRY = 'LIGHT_WEAPONRY',
    STEALTH = 'STEALTH',
    THIEVERY = 'THIEVERY',
    CRAFTING = 'CRAFTING',
    DEDUCTION = 'DEDUCTION',
    DISCIPLINE = 'DISCIPLINE',
    INTIMIDATION = 'INTIMIDATION',
    LORE = 'LORE',
    MEDICINE = 'MEDICINE',
    DECEPTION = 'DECEPTION',
    INSIGHT = 'INSIGHT',
    LEADERSHIP = 'LEADERSHIP',
    PERCEPTION = 'PERCEPTION',
    PERSUASION = 'PERSUASION',
    SURVIVAL = 'SURVIVAL',
}

export interface Skill {
    name: string;
    category: 'AWARENESS' | 'PRESENCE' | 'INTELLECT' | 'WILLPOWER' | 'STRENGTH' | 'SPEED';
}

export const SKILLS: Record<SkillType, Skill> = {
    [SkillType.AGILITY]: {
        name: 'Agility',
        category: 'SPEED',
    },
    [SkillType.ATHLETICS]: {
        name: 'Athletics',
        category: 'STRENGTH',
    },
    [SkillType.HEAVY_WEAPONRY]: {
        name: 'Heavy Weaponry',
        category: 'STRENGTH',
    },
    [SkillType.LIGHT_WEAPONRY]: {
        name: 'Light Weaponry',
        category: 'SPEED',
    },
    [SkillType.STEALTH]: {
        name: 'Stealth',
        category: 'SPEED',
    },
    [SkillType.THIEVERY]: {
        name: 'Thievery',
        category: 'SPEED',
    },
    [SkillType.CRAFTING]: {
        name: 'Crafting',
        category: 'INTELLECT',
    },
    [SkillType.DEDUCTION]: {
        name: 'Deduction',
        category: 'INTELLECT',
    },
    [SkillType.DISCIPLINE]: {
        name: 'Discipline',
        category: 'WILLPOWER',
    },
    [SkillType.INTIMIDATION]: {
        name: 'Intimidation',
        category: 'WILLPOWER',
    },
    [SkillType.LORE]: {
        name: 'Lore',
        category: 'INTELLECT',
    },
    [SkillType.MEDICINE]: {
        name: 'Medicine',
        category: 'INTELLECT',
    },
    [SkillType.DECEPTION]: {
        name: 'Deception',
        category: 'PRESENCE',
    },
    [SkillType.INSIGHT]: {
        name: 'Insight',
        category: 'AWARENESS',
    },
    [SkillType.LEADERSHIP]: {
        name: 'Leadership',
        category: 'PRESENCE',
    },
    [SkillType.PERCEPTION]: {
        name: 'Perception',
        category: 'AWARENESS',
    },
    [SkillType.PERSUASION]: {
        name: 'Persuasion',
        category: 'PRESENCE',
    },
    [SkillType.SURVIVAL]: {
        name: 'Survival',
        category: 'AWARENESS',
    },
};

export type SkillRanks = Record<SkillType, number>; //0-5

export const createDefaultSkills = (): SkillRanks => {
  const skills = {} as SkillRanks;
  Object.values(SkillType).forEach(skill => {
    skills[skill] = 0; // default rank
  });
  return skills;
};