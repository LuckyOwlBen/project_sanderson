import { SkillType, SkillRanks, createDefaultSkills } from './skills/skill';

export class Character {
    name: string = '';
    level: number = 1;
    paths: string[] = [];
    ancestry: string = '';
    strength: number = 10;
    speed: number = 10;
    intellect: number = 10;
    willpower: number = 10;
    awareness: number = 10;
    presence: number = 10;
    physicalDefense: number = 10;
    cognativeDefense: number = 10;
    spiritualDefense: number = 10;
    maxHealth: number = 100;
    currentHealth: number = 100;
    maxFocus: number = 50;
    currentFocus: number = 50;
    maxInvestiture: number = 30;
    currentInvestiture: number = 30;
    skills: SkillRanks = createDefaultSkills();

    getSkillRank(skill: SkillType): number {
    return this.skills[skill];
  }
  
  setSkillRank(skill: SkillType, rank: number): void {
    this.skills[skill] = Math.max(0, Math.min(5, rank));
  }
}