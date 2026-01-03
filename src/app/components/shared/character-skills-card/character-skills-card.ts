import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Character } from '../../../character/character';
import { SkillType, isSurgeSkill } from '../../../character/skills/skillTypes';
import { SkillAssociationTable } from '../../../character/skills/skillAssociationTable';

interface SkillDisplay {
  name: string;
  type: 'regular' | 'surge' | 'expertise';
  rank: number;
  attributeValue: number;
  total: number;
  associatedAttribute: string;
  rawSkillType?: SkillType; // For regular and surge skills
  expertiseName?: string; // For expertise skills
}

@Component({
  selector: 'app-character-skills-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatChipsModule],
  templateUrl: './character-skills-card.html',
  styleUrls: ['./character-skills-card.scss']
})
export class CharacterSkillsCard {
  @Input() character: Character | null = null;

  private skillAssociationTable = new SkillAssociationTable();

  /**
   * Get all skills (regular + surge + expertise) for display
   */
  getAllSkills(): SkillDisplay[] {
    if (!this.character) return [];

    const skills: SkillDisplay[] = [];

    // Add regular and surge skills
    Object.values(SkillType).forEach(skillType => {
      const rank = this.character!.skills.getSkillRank(skillType);
      const associatedAttr = this.skillAssociationTable.checkSkillAssociation(skillType);
      const attrValue = this.character!.attributes.getAttribute(associatedAttr);

      skills.push({
        name: this.formatSkillName(skillType),
        type: isSurgeSkill(skillType) ? 'surge' : 'regular',
        rank,
        attributeValue: attrValue,
        total: rank + attrValue,
        associatedAttribute: this.capitalizeFirst(associatedAttr),
        rawSkillType: skillType
      });
    });

    // Add expertise skills (all use Intellect as governing attribute)
    const expertiseSkills = this.character.getExpertiseSkills();
    const intellectValue = this.character.attributes.getAttribute('intellect');

    expertiseSkills.forEach(expertiseName => {
      const rank = this.character!.getExpertiseRank(expertiseName);
      skills.push({
        name: expertiseName,
        type: 'expertise',
        rank,
        attributeValue: intellectValue,
        total: rank + intellectValue,
        associatedAttribute: 'Intellect',
        expertiseName
      });
    });

    // Sort alphabetically
    return skills.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get skills grouped by type
   */
  getSkillsByType(): { regular: SkillDisplay[], surge: SkillDisplay[], expertise: SkillDisplay[] } {
    const allSkills = this.getAllSkills();
    return {
      regular: allSkills.filter(s => s.type === 'regular'),
      surge: allSkills.filter(s => s.type === 'surge'),
      expertise: allSkills.filter(s => s.type === 'expertise')
    };
  }

  /**
   * Get icon for skill type
   */
  getSkillIcon(skill: SkillDisplay): string {
    switch (skill.type) {
      case 'surge': return '⚡';
      case 'expertise': return '📚';
      default: return '🎯';
    }
  }

  /**
   * Get CSS class for skill type
   */
  getSkillClass(skill: SkillDisplay): string {
    return `skill-${skill.type}`;
  }

  /**
   * Format skill name from enum
   */
  private formatSkillName(skillType: SkillType): string {
    return skillType
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Capitalize first letter
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
