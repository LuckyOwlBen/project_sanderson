import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AttributeAllocator } from './attribute-allocator';
import { CharacterStateService } from '../../character/characterStateService';
import { LevelUpManager } from '../../levelup/levelUpManager';
import { LevelUpApiService, AttributeSlice } from '../../services/levelup-api.service';
import { Character } from '../../character/character';
import { StepValidationService } from '../../services/step-validation.service';

describe('AttributeAllocator - Fresh Backend Data on Route Change', () => {
  let component: AttributeAllocator;
  let fixture: ComponentFixture<AttributeAllocator>;
  let levelUpApiService: any;
  let characterStateService: CharacterStateService;
  let queryParamsSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    levelUpApiService = {
      getAttributeSlice: vi.fn(),
      updateAttributeSlice: vi.fn()
    };

    queryParamsSubject = new BehaviorSubject({ levelUp: 'true' });

    await TestBed.configureTestingModule({
      imports: [AttributeAllocator],
      providers: [
        CharacterStateService,
        LevelUpManager,
        StepValidationService,
        { provide: LevelUpApiService, useValue: levelUpApiService },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: queryParamsSubject.asObservable()
          }
        }
      ]
    }).compileComponents();

    levelUpApiService = TestBed.inject(LevelUpApiService);
    characterStateService = TestBed.inject(CharacterStateService);

    fixture = TestBed.createComponent(AttributeAllocator);
    component = fixture.componentInstance;
  });

  it('should fetch fresh attribute slice only when route params change, not when character$ emits', async () => {
    // Setup: Create a test character
    const testCharacter = new Character();
    testCharacter.id = 'char-123';
    testCharacter.name = 'Test Hero';
    testCharacter.level = 1;
    testCharacter.attributes.strength = 10;
    testCharacter.attributes.speed = 10;

    // Mock the getAttributeSlice to return specific points
    const slice1: AttributeSlice = {
      id: 'char-123',
      level: 1,
      attributes: {
        strength: 10,
        speed: 10,
        awareness: 10,
        intellect: 10,
        willpower: 10,
        presence: 10
      },
      pointsForLevel: 12,
      success: true
    };

    levelUpApiService.getAttributeSlice.mockReturnValue(of(slice1));

    // Set initial character in state
    characterStateService.updateCharacter(testCharacter);
    fixture.detectChanges();
    await fixture.whenStable();

    // Should have called API once on initial route params
    expect(levelUpApiService.getAttributeSlice).toHaveBeenCalledTimes(1);
    expect(levelUpApiService.getAttributeSlice).toHaveBeenCalledWith('char-123');

    // Now emit character$ again (simulating navigating back from skills step)
    const updatedCharacter = new Character();
    updatedCharacter.id = 'char-123';
    updatedCharacter.name = 'Test Hero';
    updatedCharacter.level = 1;
    updatedCharacter.attributes.strength = 11; // Different value
    characterStateService.updateCharacter(updatedCharacter);
    await fixture.whenStable();

    // Should NOT have called API again - it should ignore character$ emissions
    // and only react to route param changes
    expect(levelUpApiService.getAttributeSlice).toHaveBeenCalledTimes(1);
  });

  it('should reset sliceFetched flag when route params indicate new level-up session', async () => {
    const testCharacter = new Character();
    testCharacter.id = 'char-123';
    testCharacter.name = 'Test Hero';
    testCharacter.level = 1;

    const slice: AttributeSlice = {
      id: 'char-123',
      level: 1,
      attributes: {
        strength: 10,
        speed: 10,
        awareness: 10,
        intellect: 10,
        willpower: 10,
        presence: 10
      },
      pointsForLevel: 12,
      success: true
    };

    // Set character BEFORE changing route params
    characterStateService.updateCharacter(testCharacter);
    
    levelUpApiService.getAttributeSlice.mockReturnValue(of(slice));

    // Now emit route params with level-up mode
    queryParamsSubject.next({ levelUp: 'true' });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(levelUpApiService.getAttributeSlice).toHaveBeenCalledTimes(1);

    // Simulate exiting level-up mode
    queryParamsSubject.next({ levelUp: 'false' });
    await fixture.whenStable();

    // Should not fetch when leaving level-up mode (no characterId or different route)
    expect(levelUpApiService.getAttributeSlice).toHaveBeenCalledTimes(1);

    // Re-enter level-up mode with fresh params
    queryParamsSubject.next({ levelUp: 'true' });
    await fixture.whenStable();

    // Now should fetch fresh data again because route params changed
    expect(levelUpApiService.getAttributeSlice).toHaveBeenCalledTimes(2);
  });

  it('should set baseline values correctly for level-up mode to calculate remaining points', async () => {
    const testCharacter = new Character();
    testCharacter.id = 'char-123';
    testCharacter.name = 'Test Hero';
    testCharacter.level = 2;
    testCharacter.attributes.strength = 11; // Already have 1 point from level 1
    testCharacter.attributes.speed = 10;
    testCharacter.attributes.awareness = 10;
    testCharacter.attributes.intellect = 10;
    testCharacter.attributes.willpower = 10;
    testCharacter.attributes.presence = 10;

    const slice: AttributeSlice = {
      id: 'char-123',
      level: 2,
      attributes: {
        strength: 11,
        speed: 10,
        awareness: 10,
        intellect: 10,
        willpower: 10,
        presence: 10
      },
      pointsForLevel: 12, // Server says: 12 points available for THIS level
      success: true
    };

    levelUpApiService.getAttributeSlice.mockReturnValue(of(slice));
    characterStateService.updateCharacter(testCharacter);

    fixture.detectChanges();
    await fixture.whenStable();

    // Should use the current attribute values as baseline (pre-level-up state)
    // and calculate remaining points as: pointsForLevel - (newValues - baselineValues)
    expect(component['serverAttributePoints']).toBe(12);
    expect(component.remainingPoints).toBe(12);
  });
});
