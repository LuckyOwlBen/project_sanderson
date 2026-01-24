import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Subject, of } from 'rxjs';
import { ExpertiseSelector } from './expertise-selector';
import { CharacterStateService } from '../../character/characterStateService';
import { StepValidationService } from '../../services/step-validation.service';
import { LevelUpManager } from '../../levelup/levelUpManager';
import { CharacterStorageService } from '../../services/character-storage.service';
import { Character } from '../../character/character';
import { ALL_EXPERTISES, CULTURAL_EXPERTISES } from '../../character/expertises/allExpertises';
import { ExpertiseSource } from '../../character/expertises/expertiseSource';

describe('ExpertiseSelector', () => {
  let component: ExpertiseSelector;
  let fixture: ComponentFixture<ExpertiseSelector>;
  let mockCharacterState: Partial<CharacterStateService>;
  let mockValidationService: Partial<StepValidationService>;
  let mockLevelUpManager: Partial<LevelUpManager>;
  let mockStorageService: Partial<CharacterStorageService>;
  let queryParamsSubject: BehaviorSubject<any>;
  let pointsChangedSubject: Subject<void>;
  let addExpertiseCalls: any[];
  let removeExpertiseCalls: any[];
  let setStepValidCalls: any[];
  let testCharacter: Character;

  beforeEach(async () => {
    testCharacter = new Character();
    testCharacter.id = 'char-123';
    testCharacter.attributes.intellect = 3;
    testCharacter.cultures = [
      { name: 'Alethi', id: 'alethi' } as any,
      { name: 'Thaylen', id: 'thaylen' } as any
    ];
    
    queryParamsSubject = new BehaviorSubject<any>({});
    pointsChangedSubject = new Subject<void>();

    addExpertiseCalls = [];
    removeExpertiseCalls = [];
    setStepValidCalls = [];

    mockCharacterState = {
      getCharacter: () => testCharacter,
      updateCharacter: () => {},
      addExpertise: (...args: any[]) => {
        addExpertiseCalls.push(args);
      },
      removeExpertise: (...args: any[]) => {
        removeExpertiseCalls.push(args);
      }
    };

    mockValidationService = {
      setStepValid: (...args: any[]) => {
        setStepValidCalls.push(args);
      }
    };

    mockLevelUpManager = {
      pointsChanged$: pointsChangedSubject
    };

    mockStorageService = {
      loadCharacter: () => of(testCharacter),
      saveCharacter: () => of({ success: true, id: 'char-123' })
    };

    await TestBed.configureTestingModule({
      imports: [ExpertiseSelector],
      providers: [
        { provide: CharacterStateService, useValue: mockCharacterState },
        { provide: StepValidationService, useValue: mockValidationService },
        { provide: LevelUpManager, useValue: mockLevelUpManager },
        { provide: CharacterStorageService, useValue: mockStorageService },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: queryParamsSubject.asObservable()
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExpertiseSelector);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    queryParamsSubject.complete();
    pointsChangedSubject.complete();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with ALL_EXPERTISES', () => {
      expect(component.availableExpertises).toEqual(ALL_EXPERTISES);
      expect(component.availableExpertises.length).toBeGreaterThan(CULTURAL_EXPERTISES.length);
    });

    it('should subscribe to character state on init', () => {
      fixture.detectChanges();
      
      expect(component.character).toBeTruthy();
      expect(component.character?.attributes.intellect).toBe(3);
    });

    it('should extract cultural expertises from character cultures', () => {
      fixture.detectChanges();
      
      expect(component.culturalExpertises).toContain('Alethi');
      expect(component.culturalExpertises).toContain('Thaylen');
      expect(component.culturalExpertises.length).toBe(2);
    });

    it('should auto-add cultural expertises on first initialization', () => {
      fixture.detectChanges();
      
      expect(addExpertiseCalls).toContainEqual(['Alethi', 'culture', 'culture:Alethi']);
      expect(addExpertiseCalls).toContainEqual(['Thaylen', 'culture', 'culture:Thaylen']);
    });

    it('should calculate available points based on intellect', () => {
      fixture.detectChanges();
      
      expect(component.totalPoints).toBe(3);
      expect(component.availablePoints).toBe(3); // None selected yet beyond cultural
    });
  });

  describe('Category Helpers', () => {
    it('should return correct icon for each category', () => {
      expect(component.getCategoryIcon('cultural')).toBe('public');
      expect(component.getCategoryIcon('weapon')).toBe('military_tech');
      expect(component.getCategoryIcon('armor')).toBe('shield');
      expect(component.getCategoryIcon('utility')).toBe('construction');
      expect(component.getCategoryIcon('specialist')).toBe('engineering');
      expect(component.getCategoryIcon('unknown')).toBe('help');
    });

    it('should return correct title for each category', () => {
      expect(component.getCategoryTitle('cultural')).toBe('Cultural Expertises');
      expect(component.getCategoryTitle('weapon')).toBe('Weapon Proficiencies');
      expect(component.getCategoryTitle('armor')).toBe('Armor Proficiencies');
      expect(component.getCategoryTitle('utility')).toBe('Utility Proficiencies');
      expect(component.getCategoryTitle('specialist')).toBe('Crafting Specializations');
    });

    it('should return correct description for each category', () => {
      expect(component.getCategoryDescription('cultural')).toContain('cultures');
      expect(component.getCategoryDescription('weapon')).toContain('weapons');
      expect(component.getCategoryDescription('armor')).toContain('armor');
      expect(component.getCategoryDescription('utility')).toContain('tools');
      expect(component.getCategoryDescription('specialist')).toContain('crafting');
    });

    it('should return all categories', () => {
      const categories = component.categories;
      expect(categories).toEqual(['cultural', 'weapon', 'armor', 'utility', 'specialist']);
    });
  });

  describe('Expertise Filtering', () => {
    it('should filter expertises by category correctly', () => {
      const culturalExpertises = component.getExpertisesByCategory('cultural');
      const weaponExpertises = component.getExpertisesByCategory('weapon');
      const armorExpertises = component.getExpertisesByCategory('armor');
      
      expect(culturalExpertises.every(e => e.category === 'cultural')).toBe(true);
      expect(weaponExpertises.every(e => e.category === 'weapon')).toBe(true);
      expect(armorExpertises.every(e => e.category === 'armor')).toBe(true);
      
      expect(culturalExpertises.length).toBeGreaterThan(0);
      expect(weaponExpertises.length).toBeGreaterThan(0);
      expect(armorExpertises.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-existent category', () => {
      const result = component.getExpertisesByCategory('nonexistent');
      expect(result).toEqual([]);
    });
  });

  describe('Expertise Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should identify cultural expertise correctly', () => {
      const alethiExpertise = CULTURAL_EXPERTISES.find(e => e.name === 'Alethi')!;
      const vedenExpertise = CULTURAL_EXPERTISES.find(e => e.name === 'Veden')!;
      
      expect(component.isCulturalExpertise(alethiExpertise)).toBe(true);
      expect(component.isCulturalExpertise(vedenExpertise)).toBe(false);
    });

    it('should allow selecting expertise with available points', () => {
      const vedenExpertise = CULTURAL_EXPERTISES.find(e => e.name === 'Veden')!;
      
      expect(component.canSelectExpertise(vedenExpertise)).toBe(true);
    });

    it('should not allow selecting expertise without available points', () => {
      component.availablePoints = 0;
      const vedenExpertise = CULTURAL_EXPERTISES.find(e => e.name === 'Veden')!;
      
      expect(component.canSelectExpertise(vedenExpertise)).toBe(false);
    });

    it('should always allow selecting cultural expertise', () => {
      component.availablePoints = 0;
      const alethiExpertise = CULTURAL_EXPERTISES.find(e => e.name === 'Alethi')!;
      
      expect(component.canSelectExpertise(alethiExpertise)).toBe(true);
    });

    it('should not allow selecting already selected expertise', () => {
      const vedenExpertise = CULTURAL_EXPERTISES.find(e => e.name === 'Veden')!;
      component.selectedExpertises.push({ name: 'Veden', source: 'manual' });
      
      expect(component.canSelectExpertise(vedenExpertise)).toBe(false);
    });

    it('should toggle expertise selection on/off', () => {
      const vedenExpertise = CULTURAL_EXPERTISES.find(e => e.name === 'Veden')!;
      
      // Select
      component.toggleExpertise(vedenExpertise);
      expect(addExpertiseCalls).toContainEqual(['Veden', 'manual']);
      
      // Setup for deselect
      component.selectedExpertises = [{ name: 'Veden', source: 'manual' }];
      removeExpertiseCalls.length = 0;
      
      // Deselect
      component.toggleExpertise(vedenExpertise);
      expect(removeExpertiseCalls).toContainEqual(['Veden']);
    });

    it('should identify selected expertise correctly', () => {
      component.selectedExpertises = [
        { name: 'Veden', source: 'manual' },
        { name: 'Light Weaponry', source: 'manual' }
      ];
      
      const vedenExpertise = CULTURAL_EXPERTISES.find(e => e.name === 'Veden')!;
      const alethiExpertise = CULTURAL_EXPERTISES.find(e => e.name === 'Alethi')!;
      
      expect(component.isExpertiseSelected(vedenExpertise)).toBe(true);
      expect(component.isExpertiseSelected(alethiExpertise)).toBe(false);
    });

    it('should allow deselecting selected expertise', () => {
      component.selectedExpertises = [{ name: 'Veden', source: 'manual' }];
      const vedenExpertise = CULTURAL_EXPERTISES.find(e => e.name === 'Veden')!;
      
      expect(component.canDeselectExpertise(vedenExpertise)).toBe(true);
    });

    it('should remove expertise by name', () => {
      component.removeExpertiseByName('Veden');
      expect(removeExpertiseCalls).toContainEqual(['Veden']);
    });
  });

  describe('Points Calculation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should calculate total points from intellect', () => {
      expect(component.totalPoints).toBe(3);
    });

    it('should exclude cultural expertises from points calculation', () => {
      component.selectedExpertises = [
        { name: 'Alethi', source: 'culture', sourceId: 'culture:Alethi' },
        { name: 'Thaylen', source: 'culture', sourceId: 'culture:Thaylen' },
        { name: 'Veden', source: 'manual' }
      ];
      
      // Manually trigger calculation
      (component as any).calculateAvailablePoints();
      
      expect(component.availablePoints).toBe(2); // 3 total - 1 manual selection
    });

    it('should update available points after selection', () => {
      const initialPoints = component.availablePoints;
      component.selectedExpertises = [
        { name: 'Veden', source: 'manual' }
      ];
      
      (component as any).calculateAvailablePoints();
      
      expect(component.availablePoints).toBe(initialPoints - 1);
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should validate as invalid when too many expertises selected', () => {
      component.availablePoints = -1;
      (component as any).updateValidation();
      
      expect(setStepValidCalls).toContainEqual([5, false]);
      expect(component.validationMessage).toContain('too many');
    });

    it('should validate as valid when points are available', () => {
      component.availablePoints = 2;
      (component as any).updateValidation();
      
      expect(setStepValidCalls).toContainEqual([5, true]);
      expect(component.validationMessage).toContain('remaining');
    });

    it('should validate as valid when all points allocated', () => {
      component.availablePoints = 0;
      (component as any).updateValidation();
      
      expect(setStepValidCalls).toContainEqual([5, true]);
      expect(component.validationMessage).toContain('allocated');
    });

    it('should emit pending change when points available', () => {
      let emittedValue: boolean | undefined;
      component.pendingChange.subscribe(val => emittedValue = val);
      component.availablePoints = 1;
      
      (component as any).checkPendingStatus();
      
      expect(emittedValue).toBe(true);
    });

    it('should not emit pending change when all points used', () => {
      let emittedValue: boolean | undefined;
      component.pendingChange.subscribe(val => emittedValue = val);
      component.availablePoints = 0;
      
      (component as any).checkPendingStatus();
      
      expect(emittedValue).toBe(false);
    });
  });

  describe('Source Badge', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return correct source badge for expertise', () => {
      component.selectedExpertises = [
        { name: 'Veden', source: 'manual' },
        { name: 'Alethi', source: 'culture', sourceId: 'culture:Alethi' }
      ];
      
      // Note: This test depends on ExpertiseSourceHelper implementation
      expect(component.getSourceBadge('Veden')).toBeTruthy();
      expect(component.getSourceBadge('Alethi')).toBeTruthy();
    });

    it('should return empty string for non-existent expertise', () => {
      expect(component.getSourceBadge('NonExistent')).toBe('');
    });

    it('should determine if expertise can be removed', () => {
      component.selectedExpertises = [
        { name: 'Veden', source: 'manual' },
        { name: 'LockedExpertise', source: 'gm' }
      ];
      
      // Manual expertises can typically be removed
      expect(component.canRemoveExpertise('Veden')).toBe(true);
      // GM-granted might not be removable (depends on ExpertiseSourceHelper)
      expect(component.canRemoveExpertise('NonExistent')).toBe(false);
    });
  });

  describe('Lifecycle', () => {
    it('should subscribe to pointsChanged$ on init', () => {
      let emitted = false;
      component.pendingChange.subscribe(() => emitted = true);
      fixture.detectChanges();
      
      pointsChangedSubject.next();
      
      // Should trigger pending status check
      expect(emitted).toBe(true);
    });

    it('should attempt to scroll to top on init', () => {
      // This test just verifies the component initializes without error
      // Actual scrolling behavior is difficult to test in unit tests
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should complete subjects on destroy', () => {
      fixture.detectChanges();
      
      // Verify ngOnDestroy doesn't throw
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('All Categories Display', () => {
    it('should have expertises in all categories', () => {
      const categories = ['cultural', 'weapon', 'armor', 'utility', 'specialist'];
      
      categories.forEach(category => {
        const expertises = component.getExpertisesByCategory(category);
        expect(expertises.length).toBeGreaterThan(0);
      });
    });

    it('should render all category sections', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const categorySections = compiled.querySelectorAll('.category-section');
      
      expect(categorySections.length).toBe(5); // cultural, weapon, armor, utility, specialist
    });
  });
});
