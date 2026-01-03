import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CharacterDefensesCard } from './character-defenses-card';
import { Character } from '../../../character/character';
import { By } from '@angular/platform-browser';

describe('CharacterDefensesCard', () => {
  let component: CharacterDefensesCard;
  let fixture: ComponentFixture<CharacterDefensesCard>;
  let mockCharacter: Character;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterDefensesCard]
    }).compileComponents();

    fixture = TestBed.createComponent(CharacterDefensesCard);
    component = fixture.componentInstance;
    
    // Create a mock character
    mockCharacter = new Character();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Defense Calculations', () => {
    beforeEach(() => {
      component.character = mockCharacter;
      fixture.detectChanges();
    });

    it('should calculate physical defense', () => {
      const defense = component.getPhysicalDefense();
      expect(typeof defense).toBe('number');
      expect(defense).toBeGreaterThanOrEqual(0);
    });

    it('should calculate cognitive defense', () => {
      const defense = component.getCognitiveDefense();
      expect(typeof defense).toBe('number');
      expect(defense).toBeGreaterThanOrEqual(0);
    });

    it('should calculate spiritual defense', () => {
      const defense = component.getSpiritualDefense();
      expect(typeof defense).toBe('number');
      expect(defense).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for all defenses when character is null', () => {
      component.character = null;
      
      expect(component.getPhysicalDefense()).toBe(0);
      expect(component.getCognitiveDefense()).toBe(0);
      expect(component.getSpiritualDefense()).toBe(0);
    });
  });

  describe('Display', () => {
    beforeEach(() => {
      component.character = mockCharacter;
      fixture.detectChanges();
    });

    it('should display three defense items', () => {
      const defenseItems = fixture.debugElement.queryAll(By.css('.defense-item'));
      expect(defenseItems.length).toBe(3);
    });

    it('should display defense values', () => {
      const values = fixture.debugElement.queryAll(By.css('.defense-value'));
      expect(values.length).toBe(3);
    });
  });

  // describe('Layout', () => {
  //   beforeEach(() => {
  //     component.character = mockCharacter;
  //     fixture.detectChanges();
  //   });
  // });

  describe('Defense Values Update', () => {
    it('should update defense values when character changes', () => {
      // Create two different characters without triggering change detection
      const char1 = new Character();
      const char2 = new Character();
      char2.attributes.strength = 16;
      
      // Test with first character
      component.character = char1;
      const defense1 = component.getPhysicalDefense();
      
      // Test with second character
      component.character = char2;
      const defense2 = component.getPhysicalDefense();
      
      // Defense values should be different
      expect(defense1).not.toBe(defense2);
      expect(typeof defense1).toBe('number');
      expect(typeof defense2).toBe('number');
    });
  });
});
