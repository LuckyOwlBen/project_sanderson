import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Character } from '../../character/character';
import { CharacterStateService } from '../../character/characterStateService';
import { StepValidationService } from '../../services/step-validation.service';
import { LevelUpManager } from '../../levelup/levelUpManager';
import { ValueStepper } from '../value-stepper/value-stepper';
import { BaseAllocator } from '../shared/base-allocator';
import { SkillType, isSurgeSkill } from '../../character/skills/skillTypes';
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
export class SkillManager extends BaseAllocator<SkillConfig> implements OnInit, OnDestroy {
  @Output() pendingChange = new EventEmitter<boolean>();
  
  private destroy$ = new Subject<void>();
  private readonly STEP_INDEX = 4; // Skills is step 4
  
  character: Character | null = null;
  private skillAssociationTable = new SkillAssociationTable();
  isLevelUpMode: boolean = false;
  private isInitialized: boolean = false;

  // Group skills by category for better UI organization
  physicalSkills: SkillConfig[] = [];
  mentalSkills: SkillConfig[] = [];
  socialSkills: SkillConfig[] = [];
  surgeSkills: SkillConfig[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private characterStateService: CharacterStateService,
    private levelUpManager: LevelUpManager,
    private validationService: StepValidationService
  ) {
    super();
  }

  ngOnInit(): void {
    // Listen to points changed events from LevelUpManager
    this.levelUpManager.pointsChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.checkPendingStatus();
      });

    // Combine queryParams and character$ to avoid race conditions
    combineLatest([
      this.activatedRoute.queryParams,
      this.characterStateService.character$
    ]).pipe(takeUntil(this.destroy$))
      .subscribe(([params, character]) => {
        this.isLevelUpMode = params['levelUp'] === 'true';
        this.character = character;
        if (this.character) {
          this.initializeSkills();
          this.checkPendingStatus();
          // Always update validation when character changes, even if already initialized
          this.updateValidation();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeSkills(): void {
    if (!this.character || this.isInitialized) return;

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
    
    // In level-up mode: use incremental points for the current level only
    // In character creation mode: use cumulative total from levels 1 to current
    const useBaseline = this.isLevelUpMode && currentLevel > 1;
    const totalPoints = useBaseline 
      ? this.levelUpManager.getSkillPointsForLevel(currentLevel)
      : this.levelUpManager.getTotalSkillPointsUpToLevel(currentLevel);
    
    this.initialize(skills, totalPoints, useBaseline);
    this.isInitialized = true;
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
    
    // Include surge skills only if character has spoken the First Ideal
    if (this.character?.radiantPath.hasSpokenIdeal()) {
      const orderInfo = this.character.radiantPath.getOrderInfo();
      if (orderInfo?.surgePair) {
        const surgePair = orderInfo.surgePair;
        this.surgeSkills = skills.filter(s => surgePair.includes(s.type));
      }
    } else {
      this.surgeSkills = [];
    }
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
      this.updateValidation();
    }
  }

  protected onResetComplete(): void {
    if (this.character) {
      this.characterStateService.updateCharacter(this.character);
      this.updateSkillTotals();
      this.updateValidation();
    }
  }

  private updateValidation(): void {
    // All points must be allocated (remainingPoints === 0)
    const isValid = this.remainingPoints === 0;
    this.validationService.setStepValid(this.STEP_INDEX, isValid);
    this.checkPendingStatus();
    
    // Scroll to show navigation buttons when all points are allocated
    if (isValid) {
      setTimeout(() => {
        const buttons = document.querySelector('.stepper-buttons') as HTMLElement;
        if (buttons) {
          buttons.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 150);
    }
  }

  private checkPendingStatus(): void {
    // Has pending changes if there are points available to allocate
    const hasPending = this.remainingPoints > 0;
    this.pendingChange.emit(hasPending);
  }
}
