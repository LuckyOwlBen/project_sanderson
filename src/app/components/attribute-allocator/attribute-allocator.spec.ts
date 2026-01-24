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
  let updateCharacterSpy: any;

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
    updateCharacterSpy = vi.spyOn(characterStateService, 'updateCharacter');

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
    expect(levelUpApiService.getAttributeSlice).toHaveBeenCalledWith('char-123', false);

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

    // In creation mode we now also fetch from API to keep server as source of truth
    expect(levelUpApiService.getAttributeSlice).toHaveBeenCalledTimes(2);

    // Re-enter level-up mode with fresh params
    queryParamsSubject.next({ levelUp: 'true' });
    await fixture.whenStable();

    // Now should fetch fresh data again because route params changed
    expect(levelUpApiService.getAttributeSlice).toHaveBeenCalledTimes(3);
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

  it('should fetch attribute slice in creation mode and sync mapped attributes to state service', async () => {
    const testCharacter = new Character();
    testCharacter.id = 'char-123';
    testCharacter.name = 'Test Hero';
    testCharacter.level = 1;

    const slice: AttributeSlice = {
      id: 'char-123',
      level: 1,
      attributes: {
        strength: 9,
        speed: 8,
        awareness: 7,
        intellect: 6,
        willpower: 5,
        presence: 4
      },
      pointsForLevel: 12,
      success: true
    };

    levelUpApiService.getAttributeSlice.mockReturnValue(of(slice));
    characterStateService.updateCharacter(testCharacter);

    // Enter creation mode
    queryParamsSubject.next({ levelUp: 'false' });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(levelUpApiService.getAttributeSlice).toHaveBeenCalledTimes(1);
    expect(levelUpApiService.getAttributeSlice).toHaveBeenCalledWith('char-123', false);
    // One call from test setup, one from component syncing mapped attributes
    expect(updateCharacterSpy).toHaveBeenCalledTimes(2);
    const mappedCharacter = characterStateService.getCharacter();
    expect(mappedCharacter.attributes.strength).toBe(9);
    expect(mappedCharacter.attributes.presence).toBe(4);
    expect(component.remainingPoints).toBe(12);
  });

  it('should persist attributes to API when persistStep is invoked', async () => {
    const testCharacter = new Character();
    testCharacter.id = 'char-999';
    testCharacter.name = 'Persist Hero';
    testCharacter.level = 1;
    testCharacter.attributes.strength = 12;
    testCharacter.attributes.speed = 10;
    testCharacter.attributes.awareness = 8;
    testCharacter.attributes.intellect = 7;
    testCharacter.attributes.willpower = 6;
    testCharacter.attributes.presence = 5;

    const slice: AttributeSlice = {
      id: 'char-999',
      level: 1,
      attributes: {
        strength: 12,
        speed: 10,
        awareness: 8,
        intellect: 7,
        willpower: 6,
        presence: 5
      },
      pointsForLevel: 12,
      success: true
    };

    levelUpApiService.getAttributeSlice.mockReturnValue(of(slice));
    levelUpApiService.updateAttributeSlice.mockReturnValue(of(slice));

    characterStateService.updateCharacter(testCharacter);
    queryParamsSubject.next({ levelUp: 'false' });
    fixture.detectChanges();
    await fixture.whenStable();

    component.persistStep();

    expect(levelUpApiService.updateAttributeSlice).toHaveBeenCalledTimes(1);
    expect(levelUpApiService.updateAttributeSlice).toHaveBeenCalledWith('char-999', {
      strength: 12,
      speed: 10,
      awareness: 8,
      intellect: 7,
      willpower: 6,
      presence: 5
    });
  });
});
