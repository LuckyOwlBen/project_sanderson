import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CultureSelector } from './culture-selector';
import { CharacterStateService } from '../../character/characterStateService';
import { StepValidationService } from '../../services/step-validation.service';
import { Character } from '../../character/character';
import { Ancestry } from '../../character/ancestry/ancestry';
import { LISTENER_CULTURE } from '../../character/culture/listener';
import { ALETHI_CULTURE } from '../../character/culture/alethi';
import { AZISH_CULTURE } from '../../character/culture/azish';
import { BehaviorSubject } from 'rxjs';
import { CulturalInterface } from '../../character/culture/culturalInterface';

describe('CultureSelector', () => {
  let component: CultureSelector;
  let characterStateService: any;
  let validationService: any;
  let mockCharacter: Character;
  let character$: BehaviorSubject<Character>;

  beforeEach(() => {
    mockCharacter = new Character();
    character$ = new BehaviorSubject<Character>(mockCharacter);

    characterStateService = {
      addCulture: vi.fn(),
      removeCulture: vi.fn(),
      character$: character$
    };
    
    validationService = {
      setStepValid: vi.fn()
    };

    TestBed.configureTestingModule({
      imports: [CultureSelector],
      providers: [
        { provide: CharacterStateService, useValue: characterStateService },
        { provide: StepValidationService, useValue: validationService }
      ]
    });

    // Don't create the component yet - tests will do it after setting up character state
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(CultureSelector);
    component = fixture.componentInstance;
    component.ngOnInit();
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize with empty confirmed cultures', () => {
      const fixture = TestBed.createComponent(CultureSelector);
      component = fixture.componentInstance;
      component.ngOnInit();
      expect(component.confirmedCultures).toEqual([]);
    });

    it('should initialize culture infos from all cultures', () => {
      const fixture = TestBed.createComponent(CultureSelector);
      component = fixture.componentInstance;
      component.ngOnInit();
      expect(component.allCultureInfos.length).toBeGreaterThan(0);
    });

    it('should set validation to invalid when no cultures selected', async () => {
      const fixture = TestBed.createComponent(CultureSelector);
      component = fixture.componentInstance;
      component.ngOnInit();
      await vi.waitFor(() => {
        expect(validationService.setStepValid).toHaveBeenCalledWith(1, false);
      });
    });
  });

  describe('Ancestry Restrictions', () => {
    it('should filter out Listener culture for human characters', () => {
      mockCharacter.ancestry = Ancestry.HUMAN;
      character$.next(mockCharacter);
      
      const fixture = TestBed.createComponent(CultureSelector);
      component = fixture.componentInstance;
      component.ngOnInit();

      const listenerCulture = component.allCultureInfos.find(c => c.name === 'Listener');
      expect(listenerCulture).toBeUndefined();
    });

    it('should include Listener culture for singer characters', () => {
      mockCharacter.ancestry = Ancestry.SINGER;
      character$.next(mockCharacter);

      const fixture = TestBed.createComponent(CultureSelector);
      component = fixture.componentInstance;
      component.ngOnInit();

      const listenerCulture = component.allCultureInfos.find(c => c.name === 'Listener');
      expect(listenerCulture).toBeDefined();
      expect(listenerCulture?.name).toBe('Listener');
    });

    it('should include non-restricted cultures for all ancestries', () => {
      mockCharacter.ancestry = Ancestry.HUMAN;
      character$.next(mockCharacter);

      const fixture = TestBed.createComponent(CultureSelector);
      component = fixture.componentInstance;
      component.ngOnInit();

      const alethiCulture = component.allCultureInfos.find(c => c.name === 'Alethi');
      expect(alethiCulture).toBeDefined();
    });

    it('should re-initialize cultures when ancestry changes', async () => {
      mockCharacter.ancestry = Ancestry.HUMAN;
      character$.next(mockCharacter);

      const fixture = TestBed.createComponent(CultureSelector);
      component = fixture.componentInstance;
      component.ngOnInit();

      let listenerCulture = component.allCultureInfos.find(c => c.name === 'Listener');
      expect(listenerCulture).toBeUndefined();

      // Change to Singer
      mockCharacter.ancestry = Ancestry.SINGER;
      character$.next(mockCharacter);

      await vi.waitFor(() => {
        const listenerCulture = component.allCultureInfos.find(c => c.name === 'Listener');
        expect(listenerCulture).toBeDefined();
      });
    });
  });

  describe('Culture Selection', () => {
    beforeEach(() => {
      mockCharacter.ancestry = Ancestry.HUMAN;
      character$.next(mockCharacter);
      
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

      expect(characterStateService.addCulture).toHaveBeenCalledWith(cultureInfo.culture);
      expect(component.selectedCulture).toBeNull();
    });

    it('should not add culture when none is selected', () => {
      component.selectedCulture = null;
      component.confirmCulture();

      expect(characterStateService.addCulture).not.toHaveBeenCalled();
    });

    it('should remove culture when requested', () => {
      const cultureInfo = component.allCultureInfos[0];
      component.removeCulture(cultureInfo);

      expect(characterStateService.removeCulture).toHaveBeenCalledWith(cultureInfo.culture);
    });
  });

  describe('Culture Lists', () => {
    beforeEach(async () => {
      mockCharacter.ancestry = Ancestry.HUMAN;
      mockCharacter.cultures = [ALETHI_CULTURE];
      character$.next(mockCharacter);
      
      const fixture = TestBed.createComponent(CultureSelector);
      component = fixture.componentInstance;
      component.ngOnInit();
      
      // Wait for ngOnInit subscription to process
      await vi.waitFor(() => {
        expect(component.confirmedCultures.length).toBe(1);
      });
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
    it('should be invalid with no cultures', async () => {
      mockCharacter.cultures = [];
      character$.next(mockCharacter);

      const fixture = TestBed.createComponent(CultureSelector);
      component = fixture.componentInstance;
      component.ngOnInit();

      expect(component.canProgress).toBeFalsy();
      await vi.waitFor(() => {
        expect(validationService.setStepValid).toHaveBeenCalledWith(1, false);
      });
    });

    it('should be valid with one culture', async () => {
      mockCharacter.cultures = [ALETHI_CULTURE];
      character$.next(mockCharacter);

      const fixture = TestBed.createComponent(CultureSelector);
      component = fixture.componentInstance;
      component.ngOnInit();

      await vi.waitFor(() => {
        expect(component.canProgress).toBeTruthy();
        expect(validationService.setStepValid).toHaveBeenCalledWith(1, true);
      });
    });

    it('should show validation when no cultures are selected', async () => {
      mockCharacter.cultures = [];
      character$.next(mockCharacter);

      const fixture = TestBed.createComponent(CultureSelector);
      component = fixture.componentInstance;
      component.ngOnInit();

      await vi.waitFor(() => {
        expect(component.showValidation).toBeTruthy();
      });
    });

    it('should hide validation when cultures are selected', async () => {
      mockCharacter.cultures = [ALETHI_CULTURE];
      character$.next(mockCharacter);

      const fixture = TestBed.createComponent(CultureSelector);
      component = fixture.componentInstance;
      component.ngOnInit();

      await vi.waitFor(() => {
        expect(component.showValidation).toBeFalsy();
      });
    });
  });

  describe('Culture Limit', () => {
    it('should allow selecting up to 2 cultures', async () => {
      mockCharacter.cultures = [ALETHI_CULTURE];
      character$.next(mockCharacter);

      const fixture = TestBed.createComponent(CultureSelector);
      component = fixture.componentInstance;
      component.ngOnInit();

      await vi.waitFor(() => {
        expect(component.isMaxCulturesSelected).toBeFalsy();
      });
    });

    it('should indicate max cultures when 2 are selected', async () => {
      mockCharacter.cultures = [ALETHI_CULTURE, AZISH_CULTURE];
      character$.next(mockCharacter);

      const fixture = TestBed.createComponent(CultureSelector);
      component = fixture.componentInstance;
      component.ngOnInit();

      await vi.waitFor(() => {
        expect(component.isMaxCulturesSelected).toBeTruthy();
      });
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
      // Test the fallback by accessing the private method through any
      const placeholder = (component as any).getImagePlaceholder('UnknownCulture');
      expect(placeholder).toBe('linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
    });
  });

  describe('Component Lifecycle', () => {
    it('should unsubscribe on destroy', () => {
      const fixture = TestBed.createComponent(CultureSelector);
      component = fixture.componentInstance;
      component.ngOnInit();
      
      const destroySpy = vi.spyOn((component as any).destroy$, 'next');
      const completeSpy = vi.spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
