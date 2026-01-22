import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Character } from '../../character/character';
import { CharacterStateService } from '../../character/characterStateService';
import { StepValidationService } from '../../services/step-validation.service';
import { LevelUpManager } from '../../levelup/levelUpManager';
import { LevelUpApiService, LevelTables } from '../../services/levelup-api.service';
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
  providers: [],
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
  private characterId: string | null = null;
  private levelTables?: LevelTables;
  private serverAttributePoints?: number;
  private isInitialized: boolean = false;
  private sliceFetched: boolean = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private characterStateService: CharacterStateService,
    private levelUpManager: LevelUpManager,
    private levelUpApi: LevelUpApiService,
    private validationService: StepValidationService
  ) {
    super();
  }

  ngOnInit(): void {
    // Offline mode eliminated: rely on server slices only

    // Combine queryParams and character$ to avoid race conditions
    combineLatest([
      this.activatedRoute.queryParams,
      this.characterStateService.character$
    ]).pipe(takeUntil(this.destroy$))
      .subscribe(([params, character]) => {
        this.isLevelUpMode = params['levelUp'] === 'true';
        this.character = character;
        this.characterId = (character as any)?.id || null;

        if (this.character) {
          this.isInitialized = false;
          if (this.characterId && !this.sliceFetched) {
            this.sliceFetched = true;
            this.fetchAttributeSlice(this.characterId);
          } else if (!this.characterId) {
            // Without a characterId, default to zero points; server authority preferred
            this.initializeAttributes();
            this.updateValidation();
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private fetchAttributeSlice(characterId: string): void {
    this.levelUpApi.getAttributeSlice(characterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (slice) => {
          this.serverAttributePoints = slice.pointsForLevel;
          if (this.character && slice.attributes) {
            this.mapAttributesFromSlice(slice.attributes);
            this.characterStateService.updateCharacter(this.character);
          }
          this.initializeAttributes();
          this.updateValidation();
        },
        error: () => {
          // Server health service will handle navigation to error page
          console.error('Failed to load attribute slice, server may be down');
        }
      });
  }

  private mapAttributesFromSlice(attributes: Record<string, number>): void {
    if (!this.character) return;
    this.character.attributes.strength = attributes['strength'] ?? this.character.attributes.strength;
    this.character.attributes.speed = attributes['speed'] ?? this.character.attributes.speed;
    this.character.attributes.awareness = attributes['awareness'] ?? this.character.attributes.awareness;
    this.character.attributes.intellect = attributes['intellect'] ?? this.character.attributes.intellect;
    this.character.attributes['willpower'] = attributes['willpower'] ?? this.character.attributes['willpower'];
    this.character.attributes['presence'] = attributes['presence'] ?? this.character.attributes['presence'];
  }

  // Offline mode removed: no local points tables

  private persistAttributes(): void {
    if (!this.character || !this.characterId) {
      return;
    }

    const payload = {
      strength: this.character.attributes.strength,
      speed: this.character.attributes.speed,
      awareness: this.character.attributes.awareness,
      intellect: this.character.attributes.intellect,
      willpower: this.character.attributes.willpower,
      presence: this.character.attributes.presence
    };

    this.levelUpApi.updateAttributeSlice(this.characterId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {},
        error: () => {}
      });
  }

  // Persist hook called by CharacterCreatorView before navigating to next step
  public persistStep(): void {
    if (this.characterId) {
      this.persistAttributes();
    }
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

    // Always use server points (character always has ID from creation)
    const totalPoints = this.serverAttributePoints ?? 0;
    const useBaseline = this.serverAttributePoints !== undefined;
    
    // Initialize without baseline first
    this.initialize(attributes, totalPoints, false);
    
    // If in level-up mode, set baseline to current values (these are pre-levelup allocations)
    if (useBaseline) {
      this.baselineValues.set('Strength', this.character.attributes.strength);
      this.baselineValues.set('Speed', this.character.attributes.speed);
      this.baselineValues.set('Awareness', this.character.attributes.awareness);
      this.baselineValues.set('Intellect', this.character.attributes.intellect);
      this.baselineValues.set('Willpower', this.character.attributes.willpower);
      this.baselineValues.set('Presence', this.character.attributes.presence);
      // Recalculate points with new baseline
      this.calculatePoints();
    }
    
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
      // Skip broadcasting during level-up to avoid resetting input bindings
      if (!this.isLevelUpMode) {
        this.characterStateService.updateCharacter(this.character);
      }
      this.updateDerivedAttributes();
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
      this.updateDerivedAttributes();
      this.updateValidation();
      // Don't auto-persist on every change - only persist when Next is clicked
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
