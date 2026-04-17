import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

// Initialize TestBed before anything else
const testBed = getTestBed();
try {
  testBed.initTestEnvironment(
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting(),
  );
} catch (e) {
  // Already initialized, that's fine
}

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
    it('should initialize culture infos from all cultures', () => {
      const fixture = TestBed.createComponent(CultureSelector);
      component = fixture.componentInstance;
      component.ngOnInit();
      expect(component.allCultureInfos.length).toBeGreaterThan(0);
    });
  });

  describe('Ancestry Restrictions', () => {
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

    it('should not add culture when none is selected', () => {
      component.selectedCulture = null;
      component.confirmCulture();

      const cultures = characterStateService.getCharacter().cultures;
      expect(cultures.length).toBe(0);
      expect(validationService.isStepValid(1)).toBe(false);
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

  });
});
