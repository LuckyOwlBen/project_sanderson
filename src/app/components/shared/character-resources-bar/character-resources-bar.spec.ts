import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CharacterResourcesBar } from './character-resources-bar';
import { Character } from '../../../character/character';
import { ResourceTracker } from '../../resource-tracker/resource-tracker';

describe('CharacterResourcesBar', () => {
  let component: CharacterResourcesBar;
  let fixture: ComponentFixture<CharacterResourcesBar>;
  let mockCharacter: Character;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterResourcesBar, ResourceTracker]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CharacterResourcesBar);
    component = fixture.componentInstance;
    
    // Create a mock character with initialized resources
    mockCharacter = new Character();
    mockCharacter.name = 'Test Character';
    mockCharacter.level = 5;
    
    // Set up initial resource values
    (mockCharacter.resources.health as any).currentValue = 15;
    (mockCharacter.resources.health as any).maxValue = 20;
    (mockCharacter.resources.focus as any).currentValue = 8;
    (mockCharacter.resources.focus as any).maxValue = 10;
    (mockCharacter.resources.investiture as any).currentValue = 5;
    (mockCharacter.resources.investiture as any).maxValue = 5;
    
    component.character = mockCharacter;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('healthResource getter', () => {
    it('should return correct health resource data', () => {
      const healthResource = component.healthResource;
      
      expect(healthResource.name).toBe('Health');
      expect(healthResource.current).toBe(15);
      expect(healthResource.max).toBe(20);
      expect(healthResource.icon).toBe('favorite');
      expect(healthResource.color).toBe('#f44336');
    });

    it('should return zero values when character is not set', () => {
      component.character = null as any;
      const healthResource = component.healthResource;
      
      expect(healthResource.current).toBe(0);
      expect(healthResource.max).toBe(0);
    });
  });

  describe('focusResource getter', () => {
    it('should return correct focus resource data', () => {
      const focusResource = component.focusResource;
      
      expect(focusResource.name).toBe('Focus');
      expect(focusResource.current).toBe(8);
      expect(focusResource.max).toBe(10);
      expect(focusResource.icon).toBe('psychology');
      expect(focusResource.color).toBe('#2196f3');
    });

    it('should return zero values when character is not set', () => {
      component.character = null as any;
      const focusResource = component.focusResource;
      
      expect(focusResource.current).toBe(0);
      expect(focusResource.max).toBe(0);
    });
  });

  describe('investitureResource getter', () => {
    it('should return correct investiture resource data', () => {
      const investitureResource = component.investitureResource;
      
      expect(investitureResource.name).toBe('Investiture');
      expect(investitureResource.current).toBe(5);
      expect(investitureResource.max).toBe(5);
      expect(investitureResource.icon).toBe('auto_awesome');
      expect(investitureResource.color).toBe('#9c27b0');
    });

    it('should return zero values when character is not set', () => {
      component.character = null as any;
      const investitureResource = component.investitureResource;
      
      expect(investitureResource.current).toBe(0);
      expect(investitureResource.max).toBe(0);
    });
  });

  describe('onResourceChanged', () => {
    it('should emit resourceChanged event with correct data for Health', () => {
      let emittedEvent: any = null;
      component.resourceChanged.subscribe((event) => {
        emittedEvent = event;
      });

      component.onResourceChanged('Health', 18);

      expect(emittedEvent).toBeTruthy();
      expect(emittedEvent.resourceName).toBe('Health');
      expect(emittedEvent.newValue).toBe(18);
    });

    it('should emit resourceChanged event with correct data for Focus', () => {
      let emittedEvent: any = null;
      component.resourceChanged.subscribe((event) => {
        emittedEvent = event;
      });

      component.onResourceChanged('Focus', 7);

      expect(emittedEvent).toBeTruthy();
      expect(emittedEvent.resourceName).toBe('Focus');
      expect(emittedEvent.newValue).toBe(7);
    });

    it('should emit resourceChanged event with correct data for Investiture', () => {
      let emittedEvent: any = null;
      component.resourceChanged.subscribe((event) => {
        emittedEvent = event;
      });

      component.onResourceChanged('Investiture', 3);

      expect(emittedEvent).toBeTruthy();
      expect(emittedEvent.resourceName).toBe('Investiture');
      expect(emittedEvent.newValue).toBe(3);
    });
  });

  describe('template rendering', () => {
    it('should render three resource trackers', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const resourceTrackers = compiled.querySelectorAll('app-resource-tracker');
      
      expect(resourceTrackers.length).toBe(3);
    });

    it('should have correct container class', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const container = compiled.querySelector('.character-resources-bar');
      
      expect(container).toBeTruthy();
    });
  });
});
