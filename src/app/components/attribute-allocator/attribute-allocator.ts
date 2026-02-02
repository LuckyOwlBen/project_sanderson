import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, filter } from 'rxjs';
import { StepValidationService } from '../../services/step-validation.service';
import { CharacterIdentityService } from '../../services/character-identity.service';
import { AttributesApiService, AttributesState } from '../../services/attributes-api.service';
import { ValueStepper } from '../value-stepper/value-stepper';
import { BaseAllocator } from '../shared/base-allocator';

type AttributeKey = 'strength' | 'speed' | 'awareness' | 'intellect' | 'willpower' | 'presence';

interface AttributeConfig {
  name: string;
  key: AttributeKey;
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
  
  movementSpeed: number = 0;
  recoveryDie: string = '';
  derivedHealth: number = 0;
  derivedFocus: number = 0;
  finalized: boolean = false;
  isLoading: boolean = false;
  private characterId: string | null = null;

  constructor(
    private identityService: CharacterIdentityService,
    private attributesApi: AttributesApiService,
    private validationService: StepValidationService
  ) {
    super();
  }

  ngOnInit(): void {
    // Load attributes whenever character is set or changes
    this.identityService.currentCharacterId$
      .pipe(
        takeUntil(this.destroy$),
        filter((id): id is string => id !== null)
      )
      .subscribe((characterId) => {
        // Reload if character changes
        if (this.characterId !== characterId) {
          this.characterId = characterId;
          this.loadAttributes(characterId);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAttributes(characterId: string): void {
    if (this.isLoading) return; // Prevent multiple simultaneous loads
    
    this.isLoading = true;
    this.attributesApi.getAttributes(characterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (state) => {
          console.log('[AttributeAllocator] Loaded attributes:', state);
          this.applyAttributesState(state);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('[AttributeAllocator] Failed to load attributes:', err);
          this.isLoading = false;
          // Don't initialize defaults - wait for successful API response
          // This prevents overwriting server state with client defaults
        }
      });
  }
  

  private applyAttributesState(state: AttributesState): void {
    this.finalized = state.finalized;
    this.derivedHealth = state.derived.health;
    this.derivedFocus = state.derived.focus;
    this.movementSpeed = state.derived.movement;
    this.recoveryDie = state.derived.recovery;

    const attributes: AttributeConfig[] = [
      { name: 'Strength', key: 'strength', currentValue: state.strength },
      { name: 'Speed', key: 'speed', currentValue: state.speed },
      { name: 'Awareness', key: 'awareness', currentValue: state.awareness },
      { name: 'Intellect', key: 'intellect', currentValue: state.intellect },
      { name: 'Willpower', key: 'willpower', currentValue: state.willpower },
      { name: 'Presence', key: 'presence', currentValue: state.presence }
    ];

    // Initialize with data and ensure values aren't reset
    this.initialize(attributes, state.totalPoints, false);
    
    // Force recalculation to ensure remainingPoints is correct
    this.updateValidation();
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
  }

  protected onItemChanged(item: AttributeConfig, newValue: number): void {
    this.updateValidation();
    // Derived attributes are backend-calculated; updated on save
  }

  protected onResetComplete(): void {
    this.updateValidation();
    // Derived attributes are backend-calculated; updated on save
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

  public persistStep(): void {
    if (!this.characterId) return;

    const attributesObj = this.items.reduce((acc, item) => {
      acc[item.key] = item.currentValue;
      return acc;
    }, {} as Record<AttributeKey, number>);

    this.attributesApi.updateAttributes(this.characterId, attributesObj)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (state) => {
          console.log(`[AttributeAllocator] Attributes saved for ${this.characterId}`);
          // Update derived attributes from server response
          this.derivedHealth = state.derived.health;
          this.derivedFocus = state.derived.focus;
          this.movementSpeed = state.derived.movement;
          this.recoveryDie = state.derived.recovery;
        },
        error: (err: any) => {
          console.error(`[AttributeAllocator] Failed to save attributes:`, err);
        }
      });
  }

  // TrackBy function for ngFor to prevent unnecessary re-renders
  trackByAttributeKey(index: number, item: AttributeConfig): string {
    return item.key;
  }
}
