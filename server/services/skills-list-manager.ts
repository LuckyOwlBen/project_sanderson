import { SkillType } from 'shared/data/skills/skillTypes';

export interface SkillsCategoryList {
  physical: SkillType[];
  mental: SkillType[];
  social: SkillType[];
}

export class SkillsListManager {
  getAvailableSkills(): SkillsCategoryList {
    return {
      physical: [
        SkillType.AGILITY,
        SkillType.ATHLETICS,
        SkillType.HEAVY_WEAPONRY,
        SkillType.LIGHT_WEAPONRY,
        SkillType.STEALTH,
        SkillType.THIEVERY
      ],
      mental: [
        SkillType.CRAFTING,
        SkillType.DEDUCTION,
        SkillType.DISCIPLINE,
        SkillType.INTIMIDATION,
        SkillType.LORE,
        SkillType.MEDICINE
      ],
      social: [
        SkillType.DECEPTION,
        SkillType.INSIGHT,
        SkillType.LEADERSHIP,
        SkillType.PERCEPTION,
        SkillType.PERSUASION,
        SkillType.SURVIVAL
      ]
    };
  }
}

export const skillsListManager = new SkillsListManager();
