import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TalentView } from './talent-view';
import { CharacterStateService } from '../../character/characterStateService';
import { WebsocketService } from '../../services/websocket.service';
import { LevelUpApiService, TalentSlice } from '../../services/levelup-api.service';
import { MatDialogModule } from '@angular/material/dialog';
import { StepValidationService } from '../../services/step-validation.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LevelUpManager } from '../../levelup/levelUpManager';
import { Character } from '../../character/character';
import { By } from '@angular/platform-browser';

describe('TalentView', () => {
  let component: TalentView;
  let fixture: ComponentFixture<TalentView>;
  let characterStateService: CharacterStateService;
  let mockCharacter: Character;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TalentView, MatDialogModule, BrowserAnimationsModule],
      providers: [
        CharacterStateService,
        WebsocketService,
        StepValidationService,
        LevelUpManager,
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({})
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TalentView);
    component = fixture.componentInstance;
    characterStateService = TestBed.inject(CharacterStateService);
    
    // Create a fresh character for each test
    mockCharacter = new Character();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Radiant Path - First Ideal', () => {
    it('should not display "Speak the First Ideal" prompt even when spren is bonded', () => {
      // Grant spren to character
      mockCharacter.radiantPath.grantSpren('Windrunner');
      characterStateService.updateCharacter(mockCharacter);
      fixture.detectChanges();

      // Look for the ideal prompt card
      const idealPrompt = fixture.debugElement.query(By.css('.ideal-prompt'));
      expect(idealPrompt).toBeFalsy();
    });

    it('should not display "Speak the First Ideal" button', () => {
      mockCharacter.radiantPath.grantSpren('Windrunner');
      characterStateService.updateCharacter(mockCharacter);
      fixture.detectChanges();

      // Look for any button with "Speak the Words" text
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const speakButton = buttons.find(btn => 
        btn.nativeElement.textContent.includes('Speak the Words')
      );
      expect(speakButton).toBeFalsy();
    });

    it('should not have speakIdeal method', () => {
      expect((component as any).speakIdeal).toBeUndefined();
    });

    it('should not have getSurgeNames method', () => {
      expect((component as any).getSurgeNames).toBeUndefined();
    });

    it('should still display spren grant notification when pending', () => {
      component.pendingSprenGrant = {
        order: 'Windrunner',
        sprenType: 'Honorspren',
        philosophy: 'I will protect those who cannot protect themselves.',
        surgePair: ['ADHESION', 'GRAVITATION'],
        characterId: 'test-char-id'
      };
      fixture.detectChanges();

      const sprenNotification = fixture.debugElement.query(By.css('.spren-notification'));
      expect(sprenNotification).toBeTruthy();
      expect(sprenNotification.nativeElement.textContent).toContain('Honorspren');
      expect(sprenNotification.nativeElement.textContent).toContain('Windrunner');
    });

    it('should have acceptSpren method for spren grant workflow', () => {
      expect(component.acceptSpren).toBeDefined();
      expect(typeof component.acceptSpren).toBe('function');
    });

    it('should load surge trees when First Ideal is already spoken', () => {
      // Set up character with spren and spoken ideal
      mockCharacter.radiantPath.grantSpren('Windrunner');
      mockCharacter.radiantPath.speakIdeal(mockCharacter.skills);
      
      characterStateService.updateCharacter(mockCharacter);
      fixture.detectChanges();

      // Verify the character state
      expect(mockCharacter.radiantPath.hasSpokenIdeal()).toBe(true);
      
      // Component should handle this gracefully without showing any prompt
      const idealPrompt = fixture.debugElement.query(By.css('.ideal-prompt'));
      expect(idealPrompt).toBeFalsy();
    });
  });
});

// =========================================
// PHASE 2.3 REFACTOR TESTS
// =========================================
describe('TalentView - Fresh Backend Data on Route Change', () => {
  let component: TalentView;
  let fixture: ComponentFixture<TalentView>;
  let levelUpApiService: any;
  let characterStateService: CharacterStateService;
  let queryParamsSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    levelUpApiService = {
      getTalentSlice: vi.fn(),
      getTalentForLevel: vi.fn(),
      getTables: vi.fn().mockReturnValue(of({
        attributePointsPerLevel: [12],
        skillPointsPerLevel: [5],
        healthPerLevel: [10],
        healthStrengthBonusLevels: [],
        maxSkillRanksPerLevel: [5],
        skillRanksPerLevel: [1],
        talentPointsPerLevel: [1]
      }))
    };

    queryParamsSubject = new BehaviorSubject({});

    await TestBed.configureTestingModule({
      imports: [TalentView, MatDialogModule, BrowserAnimationsModule],
      providers: [
        CharacterStateService,
        WebsocketService,
        StepValidationService,
        LevelUpManager,
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

    fixture = TestBed.createComponent(TalentView);
    component = fixture.componentInstance;
  });

  it('should fetch fresh talent data only when route params change, not when character$ emits', async () => {
    const testCharacter = new Character();
    testCharacter.id = 'char-123';
    testCharacter.name = 'Test Hero';
    testCharacter.level = 1;
    testCharacter.paths = ['Windrunner'];

    const talentForLevelData = {
      talentPoints: 1,
      previouslySelectedTalents: [],
      requiresSingerSelection: false,
      ancestry: null,
      level: 1,
      mainPath: 'Windrunner'
    };

    levelUpApiService.getTalentForLevel.mockReturnValue(of(talentForLevelData));
    
    // Set initial character in state
    characterStateService.updateCharacter(testCharacter);
    
    // Emit route params to trigger the component's queryParams subscription
    queryParamsSubject.next({ levelUp: 'true' });
    fixture.detectChanges();
    await fixture.whenStable();

    // Should have called API once on initial load
    expect(levelUpApiService.getTalentForLevel).toHaveBeenCalledTimes(1);
    expect(levelUpApiService.getTalentForLevel).toHaveBeenCalledWith('char-123', false);

    // Now emit character$ again (simulating navigating back from another step)
    const updatedCharacter = new Character();
    updatedCharacter.id = 'char-123';
    updatedCharacter.name = 'Test Hero';
    updatedCharacter.level = 1;
    updatedCharacter.paths = ['Windrunner'];
    updatedCharacter.unlockedTalents.add('some-talent');
    characterStateService.updateCharacter(updatedCharacter);
    await fixture.whenStable();

    // Should NOT have called API again - it should ignore character$ emissions
    expect(levelUpApiService.getTalentForLevel).toHaveBeenCalledTimes(1);
  });

  it('should reset sliceLoaded flag when entering level-up mode', async () => {
    const testCharacter = new Character();
    testCharacter.id = 'char-123';
    testCharacter.name = 'Test Hero';
    testCharacter.level = 1;
    testCharacter.paths = ['Skybreaker'];

    const talentData = {
      talentPoints: 1,
      previouslySelectedTalents: [],
      requiresSingerSelection: false,
      ancestry: null,
      level: 1,
      mainPath: 'Skybreaker'
    };

    // Set character BEFORE changing route params
    characterStateService.updateCharacter(testCharacter);
    
    levelUpApiService.getTalentForLevel.mockReturnValue(of(talentData));

    // Now emit route params with level-up mode
    queryParamsSubject.next({ levelUp: 'true' });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(levelUpApiService.getTalentForLevel).toHaveBeenCalledTimes(1);

    // Simulate exiting level-up mode
    queryParamsSubject.next({ levelUp: 'false' });
    await fixture.whenStable();

    // Should not fetch when leaving level-up mode
    expect(levelUpApiService.getTalentForLevel).toHaveBeenCalledTimes(1);

    // Re-enter level-up mode with fresh params
    queryParamsSubject.next({ levelUp: 'true' });
    await fixture.whenStable();

    // Now should fetch fresh data again because route params changed
    expect(levelUpApiService.getTalentForLevel).toHaveBeenCalledTimes(2);
  });
});
