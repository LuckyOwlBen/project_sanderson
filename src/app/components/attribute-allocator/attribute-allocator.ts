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

interface AttributeConfig {
  name: string;
  key: keyof Character['attributes'];
  currentValue: number;
}

@Component({
  selector: 'app-attribute-allocator',
  standalone: true,
  imports: [CommonModule, ValueStepper],
  providers: [LevelUpManager],
  templateUrl: './attribute-allocator.html',
  styleUrls: ['./attribute-allocator.scss']
})
export class AttributeAllocator extends BaseAllocator<AttributeConfig> implements OnInit, OnDestroy {
  @Output() pendingChange = new EventEmitter<boolean>();
  
  private destroy$ = new Subject<void>();
  private readonly STEP_INDEX = 3; // Attributes is step 3
  
  character: Character | null = null;
  movementSpeed: number = 0;
  recoveryDie: string = '';
  isLevelUpMode: boolean = false;
  private isInitialized: boolean = false;

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
          this.initializeAttributes();
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

  private initializeAttributes(): void {
    if (!this.character || this.isInitialized) return;

    const attributes: AttributeConfig[] = [
      { name: 'Strength', key: 'strength', currentValue: this.character.attributes.strength },
      { name: 'Speed', key: 'speed', currentValue: this.character.attributes.speed },
      { name: 'Awareness', key: 'awareness', currentValue: this.character.attributes.awareness },
      { name: 'Intellect', key: 'intellect', currentValue: this.character.attributes.intellect },
      { name: 'Willpower', key: 'willpower', currentValue: this.character.attributes.willpower },
      { name: 'Presence', key: 'presence', currentValue: this.character.attributes.presence }
    ];

    const currentLevel = this.character.level || 1;
    
    // In level-up mode: use incremental points for the current level only
    // In character creation mode: use cumulative total from levels 1 to current
    const useBaseline = this.isLevelUpMode && currentLevel > 1;
    const totalPoints = useBaseline 
      ? this.levelUpManager.getAttributePointsForLevel(currentLevel)
      : this.levelUpManager.getTotalAttributePointsUpToLevel(currentLevel);
    
    this.initialize(attributes, totalPoints, useBaseline);
    this.updateDerivedAttributes();
    this.isInitialized = true;
  }

  private updateDerivedAttributes(): void {
    if (!this.character) return;
    this.movementSpeed = this.character.derivedAttributes.getMovementSpeed(this.character.attributes);
    this.recoveryDie = this.character.derivedAttributes.getRecoveryDie(this.character.attributes);
  }

  // BaseAllocator abstract methods implementation
  protected getLabel(item: AttributeConfig): string {
    return item.name;
  }

  protected getCurrentValue(item: AttributeConfig): number {
    return item.currentValue;
  }

  protected setCurrentValue(item: AttributeConfig, value: number): void {
    item.currentValue = value;
    if (this.character) {
      this.character.attributes.setAttribute(item.key, value);
    }
  }

  protected onItemChanged(item: AttributeConfig, newValue: number): void {
    if (this.character) {
      this.characterStateService.updateCharacter(this.character);
      this.updateDerivedAttributes();
      this.updateValidation();
    }
  }

  protected onResetComplete(): void {
    if (this.character) {
      this.characterStateService.updateCharacter(this.character);
      this.updateDerivedAttributes();
      this.updateValidation();
    }
  }

  private updateValidation(): void {
    // All points must be allocated (remainingPoints === 0)
    const isValid = this.remainingPoints === 0;
    this.validationService.setStepValid(this.STEP_INDEX, isValid);
    this.checkPendingStatus();
  }

  private checkPendingStatus(): void {
    // Has pending changes if there are points available to allocate
    const hasPending = this.remainingPoints > 0;
    this.pendingChange.emit(hasPending);
  }
}