import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Character } from '../../character/character';
import { CharacterStateService } from '../../character/characterStateService';
import { LevelUpManager } from '../../levelup/levelUpManager';
import { ValueStepper } from '../value-stepper/value-stepper';
import { BaseAllocator } from '../shared/base-allocator';
import { SkillType } from '../../character/skills/skillTypes';
import { SkillAssociationTable } from '../../character/skills/skillAssociationTable';

interface SkillConfig {
  name: string;
  type: SkillType;
  currentValue: number;
  associatedAttribute: string;
  total: number;
}

@Component({
  selector: 'app-skill-manager',
  standalone: true,
  imports: [CommonModule, ValueStepper],
  providers: [LevelUpManager],
  templateUrl: './skill-manager.html',
  styleUrls: ['./skill-manager.scss']
})
export class SkillManager extends BaseAllocator<SkillConfig> implements OnInit {
  character: Character | null = null;
  private skillAssociationTable = new SkillAssociationTable();

  // Group skills by category for better UI organization
  physicalSkills: SkillConfig[] = [];
  mentalSkills: SkillConfig[] = [];
  socialSkills: SkillConfig[] = [];

  constructor(
    private characterStateService: CharacterStateService,
    private levelUpManager: LevelUpManager
  ) {
    super();
  }

  ngOnInit(): void {
    // Subscribe to character state to get updates and persist state
    this.characterStateService.character$.subscribe(character => {
      this.character = character;
      if (this.character) {
        this.initializeSkills();
      }
    });
  }

  private initializeSkills(): void {
    if (!this.character) return;

    const skills: SkillConfig[] = Object.values(SkillType).map(skillType => {
      const currentRank = this.character!.skills.getSkillRank(skillType);
      const associatedAttr = this.skillAssociationTable.checkSkillAssociation(skillType);
      const attrValue = this.character!.attributes.getAttribute(associatedAttr);
      
      return {
        name: this.formatSkillName(skillType),
        type: skillType,
        currentValue: currentRank,
        associatedAttribute: this.capitalizeFirst(associatedAttr),
        total: currentRank + attrValue
      };
    });

    // Group skills by category
    this.categorizeSkills(skills);

    const currentLevel = this.character.level || 1;
    const totalPoints = this.levelUpManager.getSkillPointsForLevel(currentLevel);
    
    this.initialize(skills, totalPoints);
  }

  private categorizeSkills(skills: SkillConfig[]): void {
    const physical = [
      SkillType.AGILITY, SkillType.ATHLETICS, SkillType.HEAVY_WEAPONRY,
      SkillType.LIGHT_WEAPONRY, SkillType.STEALTH, SkillType.THIEVERY
    ];
    
    const mental = [
      SkillType.CRAFTING, SkillType.DEDUCTION, SkillType.DISCIPLINE,
      SkillType.INTIMIDATION, SkillType.LORE, SkillType.MEDICINE
    ];
    
    const social = [
      SkillType.DECEPTION, SkillType.INSIGHT, SkillType.LEADERSHIP,
      SkillType.PERCEPTION, SkillType.PERSUASION, SkillType.SURVIVAL
    ];

    this.physicalSkills = skills.filter(s => physical.includes(s.type));
    this.mentalSkills = skills.filter(s => mental.includes(s.type));
    this.socialSkills = skills.filter(s => social.includes(s.type));
  }

  private formatSkillName(skillType: SkillType): string {
    return skillType
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private updateSkillTotals(): void {
    if (!this.character) return;
    
    this.items.forEach(skill => {
      const associatedAttr = this.skillAssociationTable.checkSkillAssociation(skill.type);
      const attrValue = this.character!.attributes.getAttribute(associatedAttr);
      skill.total = skill.currentValue + attrValue;
    });
  }

  // BaseAllocator abstract methods implementation
  protected getLabel(item: SkillConfig): string {
    return item.name;
  }

  protected getCurrentValue(item: SkillConfig): number {
    return item.currentValue;
  }

  protected setCurrentValue(item: SkillConfig, value: number): void {
    item.currentValue = value;
    if (this.character) {
      this.character.skills.setSkillRank(item.type, value);
    }
  }

  protected onItemChanged(item: SkillConfig, newValue: number): void {
    if (this.character) {
      this.characterStateService.updateCharacter(this.character);
      this.updateSkillTotals();
    }
  }

  protected onResetComplete(): void {
    if (this.character) {
      this.characterStateService.updateCharacter(this.character);
      this.updateSkillTotals();
    }
  }
}
