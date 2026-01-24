import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CultureSelector } from './culture-selector';
import { CharacterStateService } from '../../character/characterStateService';
import { StepValidationService } from '../../services/step-validation.service';
import { Character } from '../../character/character';
import { Ancestry } from '../../character/ancestry/ancestry';
import { ALETHI_CULTURE } from '../../character/culture/alethi';
import { AZISH_CULTURE } from '../../character/culture/azish';
import { CharacterStorageService } from '../../services/character-storage.service';

describe('CultureSelector', () => {
  let component: CultureSelector;
  let characterStateService: CharacterStateService;
  let validationService: StepValidationService;
  let storageService: any;
  let mockCharacter: Character;

  beforeEach(() => {
    mockCharacter = new Character();
    storageService = {
      saveCharacter: vi.fn().mockReturnValue(of({ success: true, id: 'c1' }))
    };

    TestBed.configureTestingModule({
      imports: [CultureSelector],
      providers: [
        CharacterStateService,
        StepValidationService,
        { provide: CharacterStorageService, useValue: storageService }
      ]
    });
    
    characterStateService = TestBed.inject(CharacterStateService);
    validationService = TestBed.inject(StepValidationService);
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(CultureSelector);
    component = fixture.componentInstance;
    component.ngOnInit();
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize with empty confirmed cultures and invalid step', () => {
      const fixture = TestBed.createComponent(CultureSelector);
      component = fixture.componentInstance;
      component.ngOnInit();
      expect(component.confirmedCultures).toEqual([]);
      expect(validationService.isStepValid(1)).toBe(false);
      expect(component.showValidation).toBe(true);
    });

    it('should initialize culture infos from all cultures', () => {
      const fixture = TestBed.createComponent(CultureSelector);
      component = fixture.componentInstance;
      component.ngOnInit();
      expect(component.allCultureInfos.length).toBeGreaterThan(0);
    });
  });

  describe('Ancestry Restrictions', () => {
    it('should filter out Listener culture for human characters', () => {
      mockCharacter.ancestry = Ancestry.HUMAN;
      characterStateService.updateCharacter(mockCharacter);
      
      const fixture = TestBed.createComponent(CultureSelector);
      component = fixture.componentInstance;
      component.ngOnInit();

      const listenerCulture = component.allCultureInfos.find(c => c.name === 'Listener');
      expect(listenerCulture).toBeUndefined();
    });

    it('should include Listener culture for singer characters', () => {
      mockCharacter.ancestry = Ancestry.SINGER;
      characterStateService.updateCharacter(mockCharacter);

      const fixture = TestBed.createComponent(CultureSelector);
      component = fixture.componentInstance;
      component.ngOnInit();

      const listenerCulture = component.allCultureInfos.find(c => c.name === 'Listener');
      expect(listenerCulture).toBeDefined();
      expect(listenerCulture?.name).toBe('Listener');
    });

    it('should include non-restricted cultures for all ancestries', () => {
      mockCharacter.ancestry = Ancestry.HUMAN;
      characterStateService.updateCharacter(mockCharacter);

      const fixture = TestBed.createComponent(CultureSelector);
      component = fixture.componentInstance;
      component.ngOnInit();

      const alethiCulture = component.allCultureInfos.find(c => c.name === 'Alethi');
      expect(alethiCulture).toBeDefined();
    });

    it('should re-initialize cultures when ancestry changes', () => {
      mockCharacter.ancestry = Ancestry.HUMAN;
      characterStateService.updateCharacter(mockCharacter);

      const fixture = TestBed.createComponent(CultureSelector);
      component = fixture.componentInstance;
      component.ngOnInit();

      let listenerCulture = component.allCultureInfos.find(c => c.name === 'Listener');
      expect(listenerCulture).toBeUndefined();

      mockCharacter.ancestry = Ancestry.SINGER;
      characterStateService.updateCharacter(mockCharacter);
      component.ngOnInit();

      listenerCulture = component.allCultureInfos.find(c => c.name === 'Listener');
      expect(listenerCulture).toBeDefined();
    });
  });

  describe('Culture Selection', () => {
    beforeEach(() => {
      mockCharacter.ancestry = Ancestry.HUMAN;
      characterStateService.updateCharacter(mockCharacter);
      
      const fixture = TestBed.createComponent(CultureSelector);
      component = fixture.componentInstance;
      component.ngOnInit();
    });

    it('should set selectedCulture when viewing culture details', () => {
      const cultureInfo = component.allCultureInfos[0];
      component.viewCultureDetails(cultureInfo);
      
      expect(component.selectedCulture).toBe(cultureInfo);
    });

    it('should clear selectedCulture when going back to selection', () => {
      component.selectedCulture = component.allCultureInfos[0];
      component.backToSelection();
      
      expect(component.selectedCulture).toBeNull();
    });

    it('should add culture and clear selection when confirming', () => {
      const cultureInfo = component.allCultureInfos[0];
      component.selectedCulture = cultureInfo;
      component.confirmCulture();
      const cultures = characterStateService.getCharacter().cultures;
      expect(cultures.some(c => c.name === cultureInfo.culture.name)).toBeTruthy();
      expect(component.selectedCulture).toBeNull();
      expect(validationService.isStepValid(1)).toBe(true);
    });

    it('should not add culture when none is selected', () => {
      component.selectedCulture = null;
      component.confirmCulture();

      const cultures = characterStateService.getCharacter().cultures;
      expect(cultures.length).toBe(0);
      expect(validationService.isStepValid(1)).toBe(false);
    });

    it('should remove culture when requested', () => {
      const cultureInfo = component.allCultureInfos[0];
      characterStateService.updateCharacter({ cultures: [cultureInfo.culture] } as any);
      component.confirmedCultures = [cultureInfo.culture];

      component.removeCulture(cultureInfo);

      const cultures = characterStateService.getCharacter().cultures;
      expect(cultures.some(c => c.name === cultureInfo.culture.name)).toBeFalsy();
      expect(validationService.isStepValid(1)).toBe(false);
    });
  });

  describe('Culture Lists', () => {
    beforeEach(async () => {
      mockCharacter.ancestry = Ancestry.HUMAN;
      mockCharacter.cultures = [ALETHI_CULTURE];
      characterStateService.updateCharacter(mockCharacter);
      
      const fixture = TestBed.createComponent(CultureSelector);
      component = fixture.componentInstance;
      component.ngOnInit();
      
      expect(component.confirmedCultures.length).toBe(1);
    });

    it('should filter out confirmed cultures from available list', () => {
      const availableCultures = component.availableCultureInfos;
      const hasAlethi = availableCultures.some(c => c.name === 'Alethi');
      
      expect(hasAlethi).toBeFalsy();
    });

    it('should show confirmed cultures in selected list', () => {
      const selectedCultures = component.selectedCultureInfos;
      const hasAlethi = selectedCultures.some(c => c.name === 'Alethi');
      
      expect(hasAlethi).toBeTruthy();
      expect(selectedCultures.length).toBe(1);
    });
  });

  describe('Validation', () => {
    it('should be invalid with no cultures', () => {
      mockCharacter.cultures = [];
      characterStateService.updateCharacter(mockCharacter);

      const fixture = TestBed.createComponent(CultureSelector);
      component = fixture.componentInstance;
      component.ngOnInit();

      expect(component.canProgress).toBeFalsy();
      expect(validationService.isStepValid(1)).toBe(false);
    });

    it('should be valid with one culture', () => {
      mockCharacter.cultures = [ALETHI_CULTURE];
      characterStateService.updateCharacter(mockCharacter);

      const fixture = TestBed.createComponent(CultureSelector);
      component = fixture.componentInstance;
      component.ngOnInit();

      expect(component.canProgress).toBeTruthy();
      expect(validationService.isStepValid(1)).toBe(true);
    });

    it('should show validation when no cultures are selected', () => {
      mockCharacter.cultures = [];
      characterStateService.updateCharacter(mockCharacter);

      const fixture = TestBed.createComponent(CultureSelector);
      component = fixture.componentInstance;
      component.ngOnInit();

      expect(component.showValidation).toBeTruthy();
    });

    it('should hide validation when cultures are selected', () => {
      mockCharacter.cultures = [ALETHI_CULTURE];
      characterStateService.updateCharacter(mockCharacter);

      const fixture = TestBed.createComponent(CultureSelector);
      component = fixture.componentInstance;
      component.ngOnInit();

      expect(component.showValidation).toBeFalsy();
    });
  });

  describe('Culture Limit', () => {
    it('should allow selecting up to 2 cultures', () => {
      mockCharacter.cultures = [ALETHI_CULTURE];
      characterStateService.updateCharacter(mockCharacter);

      const fixture = TestBed.createComponent(CultureSelector);
      component = fixture.componentInstance;
      component.ngOnInit();

      expect(component.isMaxCulturesSelected).toBeFalsy();
    });

    it('should indicate max cultures when 2 are selected', () => {
      mockCharacter.cultures = [ALETHI_CULTURE, AZISH_CULTURE];
      characterStateService.updateCharacter(mockCharacter);

      const fixture = TestBed.createComponent(CultureSelector);
      component = fixture.componentInstance;
      component.ngOnInit();

      expect(component.isMaxCulturesSelected).toBeTruthy();
    });
  });

  describe('Image Handling', () => {
    beforeEach(() => {
      const fixture = TestBed.createComponent(CultureSelector);
      component = fixture.componentInstance;
      component.ngOnInit();
    });

    it('should generate correct image URL for cultures', () => {
      const cultureInfo = component.allCultureInfos.find(c => c.name === 'Alethi');
      expect(cultureInfo?.imageUrl).toBe('/images/cultures/alethi.jpg');
    });

    it('should generate image placeholder for all cultures', () => {
      const cultureInfo = component.allCultureInfos.find(c => c.name === 'Alethi');
      expect(cultureInfo?.imagePlaceholder).toContain('linear-gradient');
    });

    it('should have default placeholder for unknown cultures', () => {
      const placeholder = (component as any).getImagePlaceholder('UnknownCulture');
      expect(placeholder).toBe('linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
    });
  });

  describe('Persistence', () => {
    it('should persist when character has an id', () => {
      const fixture = TestBed.createComponent(CultureSelector);
      component = fixture.componentInstance;
      const char = new Character();
      (char as any).id = 'char-123';
      characterStateService.updateCharacter(char);

      component.persistStep();
      expect(storageService.saveCharacter).toHaveBeenCalledWith(char);
    });
  });
});
