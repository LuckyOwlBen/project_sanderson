import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { Character } from '../../../character/character';
import { SkillType, isSurgeSkill } from '../../../character/skills/skillTypes';
import { SkillAssociationTable } from '../../../character/skills/skillAssociationTable';

export interface SkillOption {
  name: string;
  type: 'regular' | 'surge' | 'expertise';
  modifier: number;
  rank: number;
  attributeValue: number;
  associatedAttribute: string;
  rawSkillType?: SkillType;
  expertiseName?: string;
}

export interface SkillCheckResult {
  skill: SkillOption;
  roll: number; // d20 roll
  total: number; // roll + modifier
  modifier: number;
  breakdown: string;
}

@Component({
  selector: 'app-skill-roller',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatInputModule
  ],
  templateUrl: './skill-roller.html',
  styleUrls: ['./skill-roller.scss']
})
export class SkillRoller implements OnChanges {
  @Input() character: Character | null = null;
  @Input() compact: boolean = false; // For inline/compact display
  @Output() skillChecked = new EventEmitter<SkillCheckResult>();

  selectedSkill: SkillOption | null = null;
  lastResult: SkillCheckResult | null = null;
  availableSkills: SkillOption[] = [];
  private skillAssociationTable = new SkillAssociationTable();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['character']) {
      this.updateAvailableSkills();
    }
  }

  /**
   * Update the cached skills list
   */
  updateAvailableSkills(): void {
    this.availableSkills = this.buildSkillsList();
  }

  /**
   * Public accessor for available skills (used in tests)
   */
  getAvailableSkills(): SkillOption[] {
    return this.availableSkills;
  }

  /**
   * Build the skills list (private - use availableSkills property in template)
   */
  private buildSkillsList(): SkillOption[] {
    if (!this.character) return [];

    const skills: SkillOption[] = [];

    // Add regular and surge skills
    Object.values(SkillType).forEach(skillType => {
      const rank = this.character!.skills.getSkillRank(skillType);
      const associatedAttr = this.skillAssociationTable.checkSkillAssociation(skillType);
      const attrValue = this.character!.attributes.getAttribute(associatedAttr);
      const modifier = rank + attrValue;

      skills.push({
        name: this.formatSkillName(skillType),
        type: isSurgeSkill(skillType) ? 'surge' : 'regular',
        modifier,
        rank,
        attributeValue: attrValue,
        associatedAttribute: this.capitalizeFirst(associatedAttr),
        rawSkillType: skillType
      });
    });

    // Add expertise skills (all use Intellect as governing attribute)
    const expertiseSkills = this.character.getExpertiseSkills();
    const intellectValue = this.character.attributes.getAttribute('intellect');

    expertiseSkills.forEach(expertiseName => {
      const rank = this.character!.getExpertiseRank(expertiseName);
      const modifier = rank + intellectValue;

      skills.push({
        name: expertiseName,
        type: 'expertise',
        modifier,
        rank,
        attributeValue: intellectValue,
        associatedAttribute: 'Intellect',
        expertiseName
      });
    });

    // Sort alphabetically
    return skills.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Roll a d20 skill check
   */
  rollSkillCheck(): void {
    if (!this.selectedSkill) return;

    const roll = this.rollD20();
    const total = roll + this.selectedSkill.modifier;

    const result: SkillCheckResult = {
      skill: this.selectedSkill,
      roll,
      total,
      modifier: this.selectedSkill.modifier,
      breakdown: `${roll} (d20) + ${this.selectedSkill.modifier} (Rank ${this.selectedSkill.rank} + ${this.selectedSkill.associatedAttribute} ${this.selectedSkill.attributeValue})`
    };

    this.lastResult = result;
    this.skillChecked.emit(result);
  }

  /**
   * Simulate a d20 roll
   */
  private rollD20(): number {
    return Math.floor(Math.random() * 20) + 1;
  }

  /**
   * Get icon for skill type
   */
  getSkillIcon(skill: SkillOption): string {
    switch (skill.type) {
      case 'surge': return '⚡';
      case 'expertise': return '📚';
      default: return '🎯';
    }
  }

  /**
   * Get CSS class for skill type
   */
  getSkillTypeClass(skill: SkillOption): string {
    return `skill-${skill.type}`;
  }

  /**
   * Clear the last result
   */
  clearResult(): void {
    this.lastResult = null;
  }

  /**
   * Compare skills by name for mat-select
   */
  compareSkills(skill1: SkillOption | null, skill2: SkillOption | null): boolean {
    if (!skill1 || !skill2) return skill1 === skill2;
    return skill1.name === skill2.name && skill1.type === skill2.type;
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
