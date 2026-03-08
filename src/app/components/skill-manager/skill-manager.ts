/**
 * SkillManager Component
 *
 * Uses the Skills API as the source of truth for skill allocations.
 */

import { Component, OnInit, OnDestroy, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, filter, take } from 'rxjs';
import { Character } from '../../character/character';
import { CharacterStateService } from '../../character/characterStateService';
import { CharacterIdentityService } from '../../services/character-identity.service';
import { StepValidationService } from '../../services/step-validation.service';
import { SkillsApiService, SkillsState } from '../../services/skills-api.service';
import { ValueStepper } from '../value-stepper/value-stepper';
import { BaseAllocator } from '../shared/base-allocator';
import { SkillType } from '../../../../shared/data/skills/skillTypes';
import { SkillAssociationTable } from '../../../../shared/data/skills/skillAssociationTable';

interface SkillConfig {
  name: string;
  key: string;
  currentValue: number;
  associatedAttribute: string;
  total: number;
  isExpertise?: boolean;
}

@Component({
  selector: 'app-skill-manager',
  standalone: true,
  imports: [CommonModule, ValueStepper],
  providers: [],
  templateUrl: './skill-manager.html',
  styleUrls: ['./skill-manager.scss']
})
export class SkillManager extends BaseAllocator<SkillConfig> implements OnInit, OnDestroy {
  @Output() pendingChange = new EventEmitter<boolean>();
  
  private destroy$ = new Subject<void>();
  private readonly STEP_INDEX = 5; // Skills is now step 5 (0-indexed)
  
  character: Character | null = null;
  private skillAssociationTable = new SkillAssociationTable();
  private characterId: string | null = null;
  private serverSkillPoints?: number;
  private isInitialized: boolean = false;
  private isFetchingSlice: boolean = false;

  // Group skills by category for better UI organization
  physicalSkills: SkillConfig[] = [];
  mentalSkills: SkillConfig[] = [];
  socialSkills: SkillConfig[] = [];
  surgeSkills: SkillConfig[] = [];
  specialSkills: SkillConfig[] = [];

  constructor(
    private characterStateService: CharacterStateService,
    private identityService: CharacterIdentityService,
    private skillsApi: SkillsApiService,
    private validationService: StepValidationService,
    private cdr: ChangeDetectorRef
  ) {
    super();
  }

  ngOnInit(): void {
    this.identityService.currentCharacterId$
      .pipe(
        takeUntil(this.destroy$),
        filter((id): id is string => id !== null)
      )
      .subscribe((characterId) => {
        if (this.characterId !== characterId) {
          this.characterId = characterId;
          this.character = this.characterStateService.getCharacter();
          this.isInitialized = false;
          this.fetchSkillState(characterId);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private fetchSkillState(characterId: string): void {
    if (this.isFetchingSlice) return;
    this.isFetchingSlice = true;

    this.skillsApi.getSkills(characterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (state: SkillsState) => {
          this.isFetchingSlice = false;
          this.serverSkillPoints = state.totalPoints;
          if (this.character && state.skills) {
            this.mapSkillsFromSlice(state.skills);
          }
          this.isInitialized = false;
          this.initializeSkills();
          this.cdr.detectChanges();
        },
        error: () => {
          console.error('Failed to load skills, server may be down');
          this.isFetchingSlice = false;
        }
      });
  }

  private mapSkillsFromSlice(skills: Record<string, number>): void {
    if (!this.character) return;
    Object.entries(skills).forEach(([skillType, rank]) => {
      this.character!.skills.setSkillRank(skillType, rank);
    });
  }

  private persistSkills(): void {
    if (!this.character || !this.characterId) {
      return;
    }

    const payload = this.character.skills.getAllSkillRanks();
    console.log('[SkillManager] Persisting skills for character', this.characterId, payload);
    this.skillsApi.updateSkills(this.characterId, payload)
      .subscribe({
        next: (response) => {
          console.log('[SkillManager] Skills persisted successfully:', response);
        },
        error: (err) => {
          console.error('[SkillManager] Failed to persist skills:', err);
        }
      });
  }

  // Persist hook called by CharacterCreatorView before navigating to next step
  public persistStep(): void {
    if (this.characterId) {
      this.persistSkills();
    }
  }

  private initializeSkills(): void {
    if (!this.character) return;
    if (this.isInitialized) return;

    const skills: SkillConfig[] = Object.values(SkillType).map(skillType => {
      const currentRank = this.character!.skills?.getSkillRank(skillType) || 0;
      const associatedAttr = this.skillAssociationTable.checkSkillAssociation(skillType);
      const attrValue = this.character!.attributes.getAttribute(associatedAttr);
      
      return {
        name: this.formatSkillName(skillType),
        key: skillType,
        currentValue: currentRank,
        associatedAttribute: this.capitalizeFirst(associatedAttr),
        total: currentRank + attrValue
      };
    });

    const expertiseSkills = this.character.getExpertiseSkills();
    const intellectValue = this.character.attributes.getAttribute('intellect');
    const existingLabels = new Set(skills.map(skill => skill.name));
    expertiseSkills.forEach(expertiseName => {
      if (existingLabels.has(expertiseName)) {
        return;
      }
      const currentRank = this.character!.skills?.getSkillRank(expertiseName) || 0;
      skills.push({
        name: expertiseName,
        key: expertiseName,
        currentValue: currentRank,
        associatedAttribute: 'Intellect',
        total: currentRank + intellectValue,
        isExpertise: true
      });
    });

    // Group skills by category
    this.categorizeSkills(skills);

    const totalPoints = this.serverSkillPoints ?? 0;
    this.initialize(skills, totalPoints, false);
    
    // Set initialized AFTER everything is setup
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

    const baseSkills = skills.filter(s => !s.isExpertise);
    this.physicalSkills = baseSkills.filter(s => physical.includes(s.key as SkillType));
    this.mentalSkills = baseSkills.filter(s => mental.includes(s.key as SkillType));
    this.socialSkills = baseSkills.filter(s => social.includes(s.key as SkillType));
    this.specialSkills = skills.filter(s => s.isExpertise);
    
    // Include surge skills only if character has spoken the First Ideal
    if (this.character?.radiantPath.hasSpokenIdeal()) {
      const orderInfo = this.character.radiantPath.getOrderInfo();
      if (orderInfo?.surgePair) {
        const surgePair = orderInfo.surgePair;
        this.surgeSkills = baseSkills.filter(s => surgePair.includes(s.key as SkillType));
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
      if (skill.isExpertise) {
        const attrValue = this.character!.attributes.getAttribute('intellect');
        skill.associatedAttribute = 'Intellect';
        skill.total = skill.currentValue + attrValue;
      } else {
        const associatedAttr = this.skillAssociationTable.checkSkillAssociation(skill.key as SkillType);
        const attrValue = this.character!.attributes.getAttribute(associatedAttr);
        skill.associatedAttribute = this.capitalizeFirst(associatedAttr);
        skill.total = skill.currentValue + attrValue;
      }
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
      this.character.skills.setSkillRank(item.key, value);
    }
  }

  protected onItemChanged(item: SkillConfig, newValue: number): void {
    if (this.character) {
      this.characterStateService.updateCharacter(this.character);
      this.updateSkillTotals();
      this.updateValidation();
      // Don't auto-persist on every change - only persist when Next is clicked
    }
  }

  protected onResetComplete(): void {
    if (this.character) {
      this.characterStateService.updateCharacter(this.character);
      this.updateSkillTotals();
      this.updateValidation();
      // Don't auto-persist on every change - only persist when Next is clicked
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
