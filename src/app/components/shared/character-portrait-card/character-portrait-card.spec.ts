import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CharacterPortraitCard } from './character-portrait-card';
import { Character } from '../../../character/character';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { of, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('CharacterPortraitCard', () => {
  let component: CharacterPortraitCard;
  let fixture: ComponentFixture<CharacterPortraitCard>;
  let mockCharacter: Character;
  let mockDialog: any;
  let mockDialogRef: any;

  beforeEach(async () => {
    mockDialogRef = {
      afterClosed: () => of(null)
    };

    mockDialog = {
      open: vi.fn().mockReturnValue(mockDialogRef),
      openDialogs: [],
      afterOpened: new Subject(),
      afterAllClosed: new Subject(),
      _getAfterAllClosed: () => new Subject()
    };

    await TestBed.configureTestingModule({
      imports: [CharacterPortraitCard, NoopAnimationsModule],
      providers: [
        { provide: MatDialog, useValue: mockDialog }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CharacterPortraitCard);
    component = fixture.componentInstance;
    
    // Create a mock character
    mockCharacter = new Character();
    mockCharacter.name = 'Test Character';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Portrait Display', () => {
    it('should display character name', () => {
      component.character = mockCharacter;
      fixture.detectChanges();

      const nameOverlay = fixture.debugElement.query(By.css('.character-name-overlay'));
      expect(nameOverlay.nativeElement.textContent).toBe('Test Character');
    });

    it('should display default "Character" when name is empty', () => {
      mockCharacter.name = '';
      component.character = mockCharacter;
      fixture.detectChanges();

      const nameOverlay = fixture.debugElement.query(By.css('.character-name-overlay'));
      expect(nameOverlay.nativeElement.textContent).toBe('Character');
    });

    it('should pass portraitUrl to app-character-image', () => {
      component.character = mockCharacter;
      component.portraitUrl = 'test-image.jpg';
      fixture.detectChanges();

      const characterImage = fixture.debugElement.query(By.css('app-character-image'));
      expect(characterImage).toBeTruthy();
    });

    it('should display character-image with large size', () => {
      component.character = mockCharacter;
      fixture.detectChanges();

      const characterImage = fixture.debugElement.query(By.css('app-character-image'));
      expect(characterImage).toBeTruthy();
    });
  });
  //TBD
  // describe('Portrait Upload', () => {
  //   beforeEach(async () => {
  //     component.character = mockCharacter;
  //     component.characterId = 'test-id';
  //     fixture.detectChanges();
  //     await fixture.whenStable();
  //   });
  // });

  describe('Button Display', () => {
    it('should show "Add Portrait" when no portrait exists', () => {
      component.character = mockCharacter;
      (component.character as any).portraitUrl = null;
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('button'));
      expect(button.nativeElement.textContent).toContain('Add Portrait');
    });

    it('should show "Change Portrait" when portrait exists', () => {
      component.character = mockCharacter;
      (component.character as any).portraitUrl = 'existing-image.jpg';
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('button'));
      expect(button.nativeElement.textContent).toContain('Change Portrait');
    });

    it('should show add_photo_alternate icon when no portrait', () => {
      component.character = mockCharacter;
      (component.character as any).portraitUrl = null;
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('button'));
      const icon = button.query(By.css('mat-icon'));
      expect(icon.nativeElement.textContent.trim()).toBe('add_photo_alternate');
    });

    it('should show edit icon when portrait exists', () => {
      component.character = mockCharacter;
      (component.character as any).portraitUrl = 'existing-image.jpg';
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('button'));
      const icon = button.query(By.css('mat-icon'));
      expect(icon.nativeElement.textContent.trim()).toBe('edit');
    });
  });

  describe('getPortraitUrl', () => {
    it('should return portrait URL from character', () => {
      component.character = mockCharacter;
      (component.character as any).portraitUrl = 'test-portrait.jpg';

      expect(component.getPortraitUrl()).toBe('test-portrait.jpg');
    });

    it('should return null when character has no portrait', () => {
      component.character = mockCharacter;

      expect(component.getPortraitUrl()).toBeNull();
    });

    it('should return null when character is null', () => {
      component.character = null;

      expect(component.getPortraitUrl()).toBeNull();
    });
  });

  describe('Layout', () => {
    it('should have portrait-header section', () => {
      component.character = mockCharacter;
      fixture.detectChanges();

      const header = fixture.debugElement.query(By.css('.portrait-header'));
      expect(header).toBeTruthy();
    });

    it('should have portrait-image-container section', () => {
      component.character = mockCharacter;
      fixture.detectChanges();

      const container = fixture.debugElement.query(By.css('.portrait-image-container'));
      expect(container).toBeTruthy();
    });

    it('should have portrait-actions section', () => {
      component.character = mockCharacter;
      fixture.detectChanges();

      const actions = fixture.debugElement.query(By.css('.portrait-actions'));
      expect(actions).toBeTruthy();
    });
  });
});
