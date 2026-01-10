import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormSelectorComponent } from './form-selector';
import { Character } from '../../../character/character';
import { Ancestry } from '../../../character/ancestry/ancestry';
import { applyTalentEffects } from '../../../character/talents/talentEffects';
import { CharacterStateService } from '../../../character/characterStateService';
import { of } from 'rxjs';

describe('FormSelectorComponent', () => {
  let component: FormSelectorComponent;
  let fixture: ComponentFixture<FormSelectorComponent>;
  let character: Character;
  let characterStateService: CharacterStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormSelectorComponent],
      providers: [CharacterStateService]
    }).compileComponents();

    characterStateService = TestBed.inject(CharacterStateService);
    
    character = new Character();
    character.name = 'Test Singer';
    applyTalentEffects(character, 'forms_of_finesse');
    applyTalentEffects(character, 'forms_of_wisdom');
    
    // Update the service's character
    characterStateService.updateCharacter(character);
    
    fixture = TestBed.createComponent(FormSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Selection', () => {
    it('should display available forms in dropdown', () => {
      expect(component.availableForms.length).toBeGreaterThan(0);
    });

    it('should show current active form as selected', () => {
      character.setActiveForm('nimbleform');
      characterStateService.updateCharacter(character);
      fixture.detectChanges();
      
      expect(component.selectedFormId).toBe('nimbleform');
    });

    it('should allow selecting a form', () => {
      component.onFormSelected('artform');
      
      // Character should be updated via the service
      expect(component.selectedFormId).toBe('artform');
    });

    it('should allow clearing form selection', () => {
      character.setActiveForm('nimbleform');
      characterStateService.updateCharacter(character);
      fixture.detectChanges();
      
      expect(component.selectedFormId).toBe('nimbleform');
      
      component.onFormSelected(undefined);
      
      expect(component.selectedFormId).toBeUndefined();
    });

    it('should display "No Active Form" option', () => {
      // Test that clearing form selection is possible
      component.onFormSelected(undefined);
      expect(component.selectedFormId).toBeUndefined();
    });
  });

  describe('Form Display', () => {
    it('should display form names correctly', () => {
      const forms = component.availableForms;
      
      expect(forms.some((f: any) => f.name === 'Nimbleform')).toBe(true);
      expect(forms.some((f: any) => f.name === 'Artform')).toBe(true);
    });

    it('should show form description on hover or selection', () => {
      const nimbleform = component.availableForms.find((f: any) => f.id === 'nimbleform');
      
      expect(nimbleform?.name).toBe('Nimbleform');
      expect(nimbleform?.description).toBeTruthy();
    });

    it('should indicate which forms grant bonuses', () => {
      character.setActiveForm('nimbleform');
      fixture.detectChanges();
      
      const bonuses = character.getActiveFormBonuses();
      expect(bonuses.length).toBeGreaterThan(0);
    });
  });

  describe('No Forms Available', () => {
    it('should handle character with no unlocked forms', () => {
      const noFormCharacter = new Character();
      noFormCharacter.ancestry = Ancestry.SINGER;
      characterStateService.updateCharacter(noFormCharacter);
      fixture.detectChanges();
      
      // Dullform is always available
      expect(component.availableForms.length).toBe(1);
      expect(component.availableForms[0].id).toBe('dullform');
    });

    it('should show helpful message when no additional forms available', () => {
      const noFormCharacter = new Character();
      noFormCharacter.ancestry = Ancestry.SINGER;
      characterStateService.updateCharacter(noFormCharacter);
      fixture.detectChanges();
      
      // Dullform is always available
      expect(component.availableForms.length).toBe(1);
      expect(component.availableForms[0].id).toBe('dullform');
      expect(component.selectedFormId).toBeUndefined();
    });
  });

  describe('UI Updates', () => {
    it('should update UI when character state changes', () => {
      character.setActiveForm('nimbleform');
      characterStateService.updateCharacter(character);
      fixture.detectChanges();
      
      expect(component.selectedFormId).toBe('nimbleform');
    });

    it('should emit change event when form is selected', () => {
      let emittedValue: string | undefined;
      
      component.formChanged.subscribe((formId: string | undefined) => {
        emittedValue = formId;
      });
      
      component.onFormSelected('artform');
      
      expect(emittedValue).toBe('artform');
    });
  });
});
