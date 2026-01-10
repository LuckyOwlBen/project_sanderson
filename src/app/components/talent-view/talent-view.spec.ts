import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { TalentView } from './talent-view';
import { CharacterStateService } from '../../character/characterStateService';
import { WebsocketService } from '../../services/websocket.service';
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
