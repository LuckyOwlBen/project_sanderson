import { TalentNode, TalentPrerequisite } from '../../types/talents';

/**
 * Minimal interface describing what TalentPrerequisiteChecker needs from a character.
 * Both server and UI Character classes satisfy this contract.
 */
export interface TalentPrerequisiteCharacter {
  skills: {
    checkStringForMatchingSkill(target: string): string | null;
    getSkillRank(skillName: string): number;
  };
  attributes: any;
  level: number;
  radiantPath: {
    hasSpokenIdeal(): boolean;
  };
  [key: string]: any;
}

export class TalentPrerequisiteChecker {
  private character: TalentPrerequisiteCharacter;
  private unlockedTalents: Set<string>;

  constructor(character: TalentPrerequisiteCharacter, unlockedTalents: Set<string>) {
    this.character = character;
    this.unlockedTalents = unlockedTalents;
  }

  canUnlockTalent(talentNode: TalentNode): boolean {
    // Group prerequisites by operator
    let andGroup: (string | TalentPrerequisite)[] = [];
    let orGroup: (string | TalentPrerequisite)[] = [];

    talentNode.prerequisites.forEach(prereq => {
      if (typeof prereq === 'string' || prereq.operator !== 'OR') {
        andGroup.push(prereq);
      } else {
        orGroup.push(prereq);
      }
    });

    // All AND prerequisites must pass
    const andPass = andGroup.every(prereq => this.checkPrerequisite(prereq));
    
    // At least one OR prerequisite must pass (if any exist)
    const orPass = orGroup.length === 0 || orGroup.some(prereq => this.checkPrerequisite(prereq));

    return andPass && orPass;
  }

  private checkPrerequisite(prereq: string | TalentPrerequisite): boolean {
    // Handle simple string prerequisites (talent IDs)
    if (typeof prereq === 'string') {
      return this.unlockedTalents.has(prereq);
    }

    // Handle complex prerequisites
    switch (prereq.type) {
      case 'talent':
        return this.unlockedTalents.has(prereq.target);

      case 'skill':
        const skillname = this.character.skills.checkStringForMatchingSkill(prereq.target);
        if (!skillname) { return false; }
        const skillRanks = this.character.skills.getSkillRank(skillname);
        return skillRanks >= (prereq.value ?? 0);

      case 'attribute':
        const attrValue = this.character.attributes[prereq.target as keyof typeof this.character.attributes];
        return typeof attrValue === 'number' && attrValue >= (prereq.value ?? 0);

      case 'level':
        return this.character.level >= (prereq.value ?? 0);

      case 'ideal':
        // Check if the character has spoken the required ideal
        // For now, we only check if First Ideal has been spoken
        if (prereq.target === 'first') {
          return this.character.radiantPath.hasSpokenIdeal();
        }
        // Future ideals would be checked here (second, third, etc.)
        return false;

      default:
        return false;
    }
  }
}
