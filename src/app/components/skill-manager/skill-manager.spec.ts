import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SkillManager } from './skill-manager';
import { CharacterStateService } from '../../character/characterStateService';
import { LevelUpManager } from '../../levelup/levelUpManager';
import { LevelUpApiService, SkillSlice } from '../../services/levelup-api.service';
import { StepValidationService } from '../../services/step-validation.service';
import { Character } from '../../character/character';
import { SkillType } from '../../character/skills/skillTypes';

describe('SkillManager - Fresh Backend Data on Route Change', () => {
  let component: SkillManager;
  let fixture: ComponentFixture<SkillManager>;
  let levelUpApiService: any;
  let characterStateService: CharacterStateService;
  let queryParamsSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    levelUpApiService = {
      getSkillSlice: vi.fn(),
      updateSkillSlice: vi.fn()
    };

    queryParamsSubject = new BehaviorSubject({ levelUp: 'true' });

    await TestBed.configureTestingModule({
      imports: [SkillManager],
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

    fixture = TestBed.createComponent(SkillManager);
    component = fixture.componentInstance;
  });

  it('should fetch fresh skill slice only when route params change, not when character$ emits', async () => {
    // Setup: Create a test character
    const testCharacter = new Character();
    testCharacter.id = 'char-123';
    testCharacter.name = 'Test Hero';
    testCharacter.level = 1;
    testCharacter.skills.setSkillRank(SkillType.AGILITY, 1);
    testCharacter.skills.setSkillRank(SkillType.ATHLETICS, 1);

    // Mock the getSkillSlice to return specific points
    const slice1: SkillSlice = {
      id: 'char-123',
      level: 1,
      skills: {
        [SkillType.AGILITY]: 1,
        [SkillType.ATHLETICS]: 1
      },
      pointsForLevel: 5,
      maxRank: 5,
      ranksPerLevel: 1,
      success: true
    };

    levelUpApiService.getSkillSlice.mockReturnValue(of(slice1));

    // Set initial character in state
    characterStateService.updateCharacter(testCharacter);
    fixture.detectChanges();
    await fixture.whenStable();

    // Should have called API once on initial route params
    expect(levelUpApiService.getSkillSlice).toHaveBeenCalledTimes(1);
    expect(levelUpApiService.getSkillSlice).toHaveBeenCalledWith('char-123');

    // Now emit character$ again (simulating navigating back from talents step)
    const updatedCharacter = new Character();
    updatedCharacter.id = 'char-123';
    updatedCharacter.name = 'Test Hero';
    updatedCharacter.level = 1;
    updatedCharacter.skills.setSkillRank(SkillType.AGILITY, 2); // Different value
    characterStateService.updateCharacter(updatedCharacter);
    await fixture.whenStable();

    // Should NOT have called API again - it should ignore character$ emissions
    // and only react to route param changes
    expect(levelUpApiService.getSkillSlice).toHaveBeenCalledTimes(1);
  });

  it('should reset isFetchingSlice flag when route params indicate new level-up session', async () => {
    const testCharacter = new Character();
    testCharacter.id = 'char-123';
    testCharacter.name = 'Test Hero';
    testCharacter.level = 1;

    const slice: SkillSlice = {
      id: 'char-123',
      level: 1,
      skills: {
        [SkillType.AGILITY]: 1
      },
      pointsForLevel: 5,
      maxRank: 5,
      ranksPerLevel: 1,
      success: true
    };

    // Set character BEFORE changing route params
    characterStateService.updateCharacter(testCharacter);
    
    levelUpApiService.getSkillSlice.mockReturnValue(of(slice));

    // Now emit route params with level-up mode
    queryParamsSubject.next({ levelUp: 'true' });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(levelUpApiService.getSkillSlice).toHaveBeenCalledTimes(1);

    // Simulate exiting level-up mode
    queryParamsSubject.next({ levelUp: 'false' });
    await fixture.whenStable();

    // Should not fetch when leaving level-up mode
    expect(levelUpApiService.getSkillSlice).toHaveBeenCalledTimes(1);

    // Re-enter level-up mode with fresh params
    queryParamsSubject.next({ levelUp: 'true' });
    await fixture.whenStable();

    // Now should fetch fresh data again because route params changed
    expect(levelUpApiService.getSkillSlice).toHaveBeenCalledTimes(2);
  });

  it('should set baseline values correctly for level-up mode to calculate remaining skill points', async () => {
    const testCharacter = new Character();
    testCharacter.id = 'char-123';
    testCharacter.name = 'Test Hero';
    testCharacter.level = 2;
    testCharacter.skills.setSkillRank(SkillType.AGILITY, 2); // Already have 1 rank from level 1
    testCharacter.skills.setSkillRank(SkillType.ATHLETICS, 1);

    const slice: SkillSlice = {
      id: 'char-123',
      level: 2,
      skills: {
        [SkillType.AGILITY]: 2,
        [SkillType.ATHLETICS]: 1
      },
      pointsForLevel: 5, // Server says: 5 points available for THIS level
      maxRank: 5,
      ranksPerLevel: 1,
      success: true
    };

    levelUpApiService.getSkillSlice.mockReturnValue(of(slice));
    characterStateService.updateCharacter(testCharacter);

    fixture.detectChanges();
    await fixture.whenStable();

    // Should use the current skill values as baseline (pre-level-up state)
    // and calculate remaining points as: pointsForLevel - (newValues - baselineValues)
    expect(component['serverSkillPoints']).toBe(5);
    expect(component.remainingPoints).toBe(5);
  });
});
