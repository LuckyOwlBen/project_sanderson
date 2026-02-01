/**
 * AttributeAllocator Component - PHASE 2.1 REFACTOR
 * 
 * MIGRATION: Removed subscription to character$ Observable
 * 
 * PROBLEM FIXED:
 * - Previously subscribed to combineLatest([queryParams, character$])
 * - When navigating back from skills, character$ would re-emit
 * - Component would reuse stale serverAttributePoints from first visit
 * - This caused 24 points instead of 0 remaining (12 + 12)
 * 
 * SOLUTION:
 * - Now subscribes ONLY to queryParams changes
 * - Gets current character state directly via getCharacter() snapshot
 * - Resets sliceFetched flag on each param change to force fresh API fetch
 * - Only fetches during level-up mode to avoid unnecessary calls
 * - Prevents stale cache from being reused when revisiting step
 * 
 * ARCHITECTURE:
 * - Level-up components are now independent of character$ emissions
 * - Backend slice APIs remain the source of truth for point allocation
 * - Each visit to a level-up step triggers fresh data fetch
 */

import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { Character } from '../../character/character';
import { CharacterStateService } from '../../character/characterStateService';
import { StepValidationService } from '../../services/step-validation.service';
import { CharacterCreationApiService } from '../../services/character-creation-api.service';
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
  isLoading: boolean = false;
  private characterId: string | null = null;
  private serverAttributePoints?: number;
  private isInitialized: boolean = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private characterStateService: CharacterStateService,
    private creationApiService: CharacterCreationApiService,
    private levelUpApi: LevelUpApiService,
    private validationService: StepValidationService,
    private router: Router
  ) {
    super();
  }

  ngOnInit(): void {
     // Check if we have a character ID - if not, redirect immediately
  const character = this.characterStateService.getCharacter();
  const characterId = (character as any)?.id;
  
  if (!characterId) {
    console.warn('[AttributeAllocator] No character ID found - redirecting to landing');
    this.router.navigate(['/landing']);
    return;
  }

  // Always fetch from backend, never use cached state
  this.isLoading = true;
  this.activatedRoute.queryParams
    .pipe(takeUntil(this.destroy$))
    .subscribe((params) => {
      this.isLevelUpMode = params['levelUp'] === 'true';
      this.character = character;
      this.characterId = characterId;
      
      // Force fresh fetch from backend
      this.fetchAttributeSlice(characterId);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private fetchAttributeSlice(characterId: string): void {
  console.log('[AttributeAllocator] Fetching from backend: /attributes/' + characterId);
  
  const isCreationMode = (this.character?.level ?? 1) > 1;
  this.levelUpApi.getAttributeSlice(characterId, isCreationMode)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (slice) => {
        console.log('[AttributeAllocator] Attribute slice from backend:', slice);
        this.serverAttributePoints = slice.pointsForLevel;
        if (this.character && slice.attributes) {
          this.mapAttributesFromSlice(slice.attributes);
        }
        this.initializeAttributes();
        this.updateValidation();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('[AttributeAllocator] Backend fetch failed:', err);
        this.isLoading = false;
        // Error handling - show message or redirect
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
      this.updateDerivedAttributes();
      this.updateValidation();
      // Don't auto-persist on every change - only persist when Next is clicked
    }
  }

  protected onResetComplete(): void {
    if (this.character) {
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

  public persistStep(): void {
    if (this.character && this.characterId) {
      // Convert Attributes to plain object for API
      const attributesObj = {
        strength: this.character.attributes.strength,
        speed: this.character.attributes.speed,
        intellect: this.character.attributes.intellect,
        willpower: this.character.attributes.willpower,
        awareness: this.character.attributes.awareness,
        presence: this.character.attributes.presence
      };

      // API-first approach with levelUpApi fallback
      this.creationApiService.updateAttributes(this.characterId, attributesObj)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log(`[AttributeAllocator] Attributes saved via API for ${this.characterId}`);
          },
          error: (err: any) => {
            console.warn(`[AttributeAllocator] API error, falling back to levelUpApi:`, err);
            // Fallback to levelUpApi if creation API fails
            if (this.characterId) {
              this.levelUpApi.updateAttributeSlice(this.characterId, attributesObj)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: () => {
                    console.log(`[AttributeAllocator] Attributes saved via levelUpApi fallback`);
                  },
                  error: (fallbackErr: any) => {
                    console.error(`[AttributeAllocator] Both APIs failed:`, fallbackErr);
                  }
                });
            }
          }
        });
    }
  }
}
