/**
 * SkillManager Component - PHASE 2.2 REFACTOR
 * 
 * MIGRATION: Removed subscription to character$ Observable
 * 
 * PROBLEM FIXED:
 * - Previously subscribed to combineLatest([queryParams, character$])
 * - When navigating back from talents, character$ would re-emit
 * - Component would reuse stale serverSkillPoints from first visit
 * - This caused incorrect remaining points calculation
 * 
 * SOLUTION:
 * - Now subscribes ONLY to queryParams changes
 * - Gets current character state directly via getCharacter() snapshot
 * - Resets isFetchingSlice flag on each param change to force fresh API fetch
 * - Only fetches during level-up mode to avoid unnecessary calls
 * - Prevents stale cache from being reused when revisiting step
 * 
 * ARCHITECTURE:
 * - Level-up components are now independent of character$ emissions
 * - Backend slice APIs remain the source of truth for point allocation
 * - Each visit to a level-up step triggers fresh data fetch
 */

import { Component, OnInit, OnDestroy, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Character } from '../../character/character';
import { CharacterStateService } from '../../character/characterStateService';
import { StepValidationService } from '../../services/step-validation.service';
import { LevelUpManager } from '../../levelup/levelUpManager';
import { LevelUpApiService, LevelTables } from '../../services/levelup-api.service';
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
  providers: [],
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
  private characterId: string | null = null;
  private levelTables?: LevelTables;
  private serverSkillPoints?: number;
  private isInitialized: boolean = false;
  private isFetchingSlice: boolean = false;

  // Group skills by category for better UI organization
  physicalSkills: SkillConfig[] = [];
  mentalSkills: SkillConfig[] = [];
  socialSkills: SkillConfig[] = [];
  surgeSkills: SkillConfig[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private characterStateService: CharacterStateService,
    private levelUpManager: LevelUpManager,
    private levelUpApi: LevelUpApiService,
    private validationService: StepValidationService,
    private cdr: ChangeDetectorRef
  ) {
    super();
  }

  ngOnInit(): void {
    // Subscribe only to route params changes - do NOT subscribe to character$
    // during level-up mode. This prevents stale cache reuse when navigating
    // between level-up steps.
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.isLevelUpMode = params['levelUp'] === 'true';
        // Reset isFetchingSlice when route params change - this forces fresh fetch
        // if we re-enter level-up mode
        this.isFetchingSlice = false;
        
        // Get current character from service (not from subscription)
        this.character = this.characterStateService.getCharacter();
        this.characterId = (this.character as any)?.id || null;

        if (this.character && this.isLevelUpMode) {
          this.isInitialized = false;
          if (this.characterId) {
            this.fetchSkillSlice(this.characterId);
          }
        } else if (this.character && !this.isLevelUpMode) {
          // Always fetch slice from API even in creation mode to keep server as source of truth
          console.log('[SkillManager] Character creation mode - fetching slice from API');
          this.isInitialized = false;
          if (this.characterId) {
            this.fetchSkillSlice(this.characterId);
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private fetchSkillSlice(characterId: string): void {
    this.isFetchingSlice = true;
    // In creation mode (level > 1), request cumulative points instead of single-level
    const isCreationMode = (this.character?.level ?? 1) > 1;
    this.levelUpApi.getSkillSlice(characterId, isCreationMode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (slice) => {
          this.isFetchingSlice = false;
          this.serverSkillPoints = slice.pointsForLevel;
          if (this.character && slice.skills) {
            this.mapSkillsFromSlice(slice.skills);
          }
          // Mark as initialized before initializing to prevent re-fetching
          this.isInitialized = false; // Allow re-init
          this.initializeSkills();
          this.cdr.detectChanges(); // Trigger change detection
        },
        error: () => {
          // Server health service will handle navigation to error page
          console.error('Failed to load skill slice, server may be down');
          this.isFetchingSlice = false;
        }
      });
  }

  private mapSkillsFromSlice(skills: Record<string, number>): void {
    if (!this.character) return;
    Object.entries(skills).forEach(([skillType, rank]) => {
      this.character!.skills.setSkillRank(skillType as SkillType, rank);
    });
  }

  // Offline mode removed: no local points tables

  private persistSkills(): void {
    if (!this.character || !this.characterId) {
      return;
    }

    const payload = this.character.skills.getAllSkillRanks();
    console.log('[SkillManager] Persisting skills for character', this.characterId, payload);
    // In creation mode (level > 1), pass isCreationMode flag to use cumulative points
    const isCreationMode = (this.character.level ?? 1) > 1;
    this.levelUpApi.updateSkillSlice(this.characterId, payload, isCreationMode)
      .pipe(takeUntil(this.destroy$))
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
        type: skillType,
        currentValue: currentRank,
        associatedAttribute: this.capitalizeFirst(associatedAttr),
        total: currentRank + attrValue
      };
    });

    // Group skills by category
    this.categorizeSkills(skills);

    // Always use server points (character always has ID from creation)
    const totalPoints = this.serverSkillPoints ?? 0;
    const useBaseline = this.serverSkillPoints !== undefined;
    
    // Initialize without baseline first
    this.initialize(skills, totalPoints, false);
    
    // If in level-up mode, set baseline to current values (these are pre-levelup allocations)
    if (useBaseline) {
      skills.forEach(skill => {
        this.baselineValues.set(skill.name, skill.currentValue);
      });
      // Recalculate points with new baseline
      this.calculatePoints();
    }
    
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
      // Skip broadcasting during level-up to avoid resetting input bindings
      if (!this.isLevelUpMode) {
        this.characterStateService.updateCharacter(this.character);
      }
      this.updateSkillTotals();
      this.updateValidation();
      // Don't auto-persist on every change - only persist when Next is clicked
    }
  }

  protected onResetComplete(): void {
    if (this.character) {
      // Skip broadcasting during level-up to avoid resetting input bindings
      if (!this.isLevelUpMode) {
        this.characterStateService.updateCharacter(this.character);
      }
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
