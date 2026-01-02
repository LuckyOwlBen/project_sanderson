import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CharacterSheetHeader } from './character-sheet-header';
import { Character } from '../../../character/character';
import { By } from '@angular/platform-browser';

describe('CharacterSheetHeader', () => {
  let component: CharacterSheetHeader;
  let fixture: ComponentFixture<CharacterSheetHeader>;
  let mockCharacter: Character;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterSheetHeader]
    }).compileComponents();

    fixture = TestBed.createComponent(CharacterSheetHeader);
    component = fixture.componentInstance;
    
    // Create a mock character
    mockCharacter = new Character();
    mockCharacter.name = 'Test Character';
    mockCharacter.level = 5;
    (mockCharacter as any).ancestry = 'Human';
    mockCharacter.paths = ['Windrunner'];
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Character Display', () => {
    it('should display character name', () => {
      component.character = mockCharacter;
      fixture.detectChanges();

      const h1 = fixture.debugElement.query(By.css('h1'));
      expect(h1.nativeElement.textContent).toBe('Test Character');
    });

    it('should display "Unnamed Character" when character has no name', () => {
      mockCharacter.name = '';
      component.character = mockCharacter;
      fixture.detectChanges();

      const h1 = fixture.debugElement.query(By.css('h1'));
      expect(h1.nativeElement.textContent).toBe('Unnamed Character');
    });

    it('should display character level', () => {
      component.character = mockCharacter;
      fixture.detectChanges();

      const subtitle = fixture.debugElement.query(By.css('.header-subtitle'));
      expect(subtitle.nativeElement.textContent).toContain('Level 5');
    });

    it('should display character ancestry', () => {
      component.character = mockCharacter;
      fixture.detectChanges();

      const subtitle = fixture.debugElement.query(By.css('.header-subtitle'));
      expect(subtitle.nativeElement.textContent).toContain('Human');
    });

    it('should display character paths', () => {
      component.character = mockCharacter;
      fixture.detectChanges();

      const subtitle = fixture.debugElement.query(By.css('.header-subtitle'));
      expect(subtitle.nativeElement.textContent).toContain('Windrunner');
    });

    it('should display multiple paths with comma separation', () => {
      mockCharacter.paths = ['Windrunner', 'Edgedancer'];
      component.character = mockCharacter;
      fixture.detectChanges();

      const subtitle = fixture.debugElement.query(By.css('.header-subtitle'));
      expect(subtitle.nativeElement.textContent).toContain('Windrunner');
      expect(subtitle.nativeElement.textContent).toContain('Edgedancer');
      expect(subtitle.nativeElement.textContent).toContain(',');
    });

    it('should display default level 1 when character is null', () => {
      component.character = null;
      fixture.detectChanges();

      const subtitle = fixture.debugElement.query(By.css('.header-subtitle'));
      expect(subtitle.nativeElement.textContent).toContain('Level 1');
    });

    it('should display "Unknown" ancestry when character is null', () => {
      component.character = null;
      fixture.detectChanges();

      const subtitle = fixture.debugElement.query(By.css('.header-subtitle'));
      expect(subtitle.nativeElement.textContent).toContain('Unknown');
    });
  });

  describe('Button Actions', () => {
    beforeEach(() => {
      component.character = mockCharacter;
      fixture.detectChanges();
    });

    it('should emit save event when Save button is clicked', () => {
      const emitSpy = vi.spyOn(component.save, 'emit');

      const saveButton = fixture.debugElement.queryAll(By.css('button'))[0];
      saveButton.nativeElement.click();

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should emit export event when Export button is clicked', () => {
      const emitSpy = vi.spyOn(component.export, 'emit');

      const exportButton = fixture.debugElement.queryAll(By.css('button'))[1];
      exportButton.nativeElement.click();

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should emit navigateBack event when Character List button is clicked', () => {
      const emitSpy = vi.spyOn(component.navigateBack, 'emit');

      const backButton = fixture.debugElement.queryAll(By.css('button'))[2];
      backButton.nativeElement.click();

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should have mat-raised-button on Save button', () => {
      const saveButton = fixture.debugElement.queryAll(By.css('button'))[0];
      expect(saveButton.nativeElement.getAttribute('mat-raised-button')).not.toBeNull();
    });

    it('should have mat-button on Export button', () => {
      const exportButton = fixture.debugElement.queryAll(By.css('button'))[1];
      expect(exportButton.nativeElement.getAttribute('mat-button')).not.toBeNull();
    });

    it('should have mat-button on Character List button', () => {
      const backButton = fixture.debugElement.queryAll(By.css('button'))[2];
      expect(backButton.nativeElement.getAttribute('mat-button')).not.toBeNull();
    });
  });

  describe('Button Icons', () => {
    beforeEach(() => {
      component.character = mockCharacter;
      fixture.detectChanges();
    });

    it('should display save icon on Save button', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const saveIcon = buttons[0].query(By.css('mat-icon'));
      expect(saveIcon.nativeElement.textContent).toBe('save');
    });

    it('should display download icon on Export button', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const exportIcon = buttons[1].query(By.css('mat-icon'));
      expect(exportIcon.nativeElement.textContent).toBe('download');
    });

    it('should display list icon on Character List button', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const backIcon = buttons[2].query(By.css('mat-icon'));
      expect(backIcon.nativeElement.textContent).toBe('list');
    });
  });

  describe('Layout', () => {
    it('should have header-left and header-actions sections', () => {
      component.character = mockCharacter;
      fixture.detectChanges();

      const headerLeft = fixture.debugElement.query(By.css('.header-left'));
      const headerActions = fixture.debugElement.query(By.css('.header-actions'));

      expect(headerLeft).toBeTruthy();
      expect(headerActions).toBeTruthy();
    });

    it('should have 3 action buttons', () => {
      component.character = mockCharacter;
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('.header-actions button'));
      expect(buttons.length).toBe(3);
    });

    it('should include mat-divider', () => {
      component.character = mockCharacter;
      fixture.detectChanges();

      const divider = fixture.debugElement.query(By.css('mat-divider'));
      expect(divider).toBeTruthy();
    });
  });
});
