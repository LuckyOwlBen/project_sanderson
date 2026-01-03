import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CharacterPowersTab } from './character-powers-tab';
import { Character } from '../../../character/character';
import { By } from '@angular/platform-browser';
import { ActionCostCode } from '../../../character/talents/talentInterface';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('CharacterPowersTab', () => {
  let component: CharacterPowersTab;
  let fixture: ComponentFixture<CharacterPowersTab>;
  let mockCharacter: Character;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterPowersTab, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(CharacterPowersTab);
    component = fixture.componentInstance;
    
    // Create a mock character
    mockCharacter = new Character();
    mockCharacter.selectedExpertises = ['Combat', 'Stealth', 'Persuasion'];
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Expertises Display', () => {
    beforeEach(() => {
      component.character = mockCharacter;
      fixture.detectChanges();
    });

    it('should display selected expertises', () => {
      const expertises = component.getSelectedExpertises();
      expect(expertises.length).toBe(3);
      expect(expertises).toContain('Combat');
      expect(expertises).toContain('Stealth');
      expect(expertises).toContain('Persuasion');
    });

    it('should return empty array when character has no expertises', () => {
      mockCharacter.selectedExpertises = [];
      const expertises = component.getSelectedExpertises();
      expect(expertises).toEqual([]);
    });

    it('should return empty array when character is null', () => {
      component.character = null;
      const expertises = component.getSelectedExpertises();
      expect(expertises).toEqual([]);
    });

    it('should display expertise items in DOM', () => {
      const expertiseItems = fixture.debugElement.queryAll(By.css('.expertise-item'));
      expect(expertiseItems.length).toBe(3);
    });
  });

  describe('Expertises Display - Empty State', () => {
    it('should display empty message when no expertises', async () => {
      // Create a fresh character and fixture to avoid expression changed error
      const freshCharacter = new Character();
      freshCharacter.selectedExpertises = [];
      component.character = freshCharacter;
      fixture.detectChanges();
      await fixture.whenStable();

      const emptyText = fixture.debugElement.query(By.css('.expertises-list .empty-text'));
      expect(emptyText).toBeTruthy();
      expect(emptyText.nativeElement.textContent).toContain('No expertises selected');
    });
  });

  describe('Powers Display', () => {
    it('should get powers from unlocked talents', () => {
      component.character = mockCharacter;
      const powers = component.getPowers();
      expect(Array.isArray(powers)).toBeTruthy();
    });

    it('should return empty array when character is null', () => {
      component.character = null;
      const powers = component.getPowers();
      expect(powers).toEqual([]);
    });

    it('should display empty message when no powers unlocked', () => {
      component.character = mockCharacter;
      fixture.detectChanges();

      const emptyText = fixture.debugElement.query(By.css('.powers-list .empty-text'));
      expect(emptyText).toBeTruthy();
      expect(emptyText.nativeElement.textContent).toContain('No powers unlocked yet');
    });
  });

  describe('Action Cost Display', () => {
    it('should format Passive action cost', () => {
      const display = component.getActionCostDisplay(ActionCostCode.Passive);
      expect(display).toBe('Passive');
    });

    it('should format Reaction action cost', () => {
      const display = component.getActionCostDisplay(ActionCostCode.Reaction);
      expect(display).toBe('Reaction');
    });

    it('should format Special action cost', () => {
      const display = component.getActionCostDisplay(ActionCostCode.Special);
      expect(display).toBe('Special');
    });

    it('should format Free action cost', () => {
      const display = component.getActionCostDisplay(ActionCostCode.Free);
      expect(display).toBe('Free Action');
    });

    it('should format 1 action cost', () => {
      const display = component.getActionCostDisplay(1);
      expect(display).toBe('1 Action');
    });

    it('should format 2 actions cost', () => {
      const display = component.getActionCostDisplay(2);
      expect(display).toBe('2 Actions');
    });

    it('should format 3 actions cost', () => {
      const display = component.getActionCostDisplay(3);
      expect(display).toBe('3 Actions');
    });
  });

  describe('Bonus Display', () => {
    it('should return empty array for power with no bonuses', () => {
      const power: any = { bonuses: [] };
      const display = component.getBonusDisplay(power);
      expect(display).toEqual([]);
    });

    it('should format bonus with value and type', () => {
      const power: any = {
        bonuses: [{ value: 2, type: 'Strength' }]
      };
      const display = component.getBonusDisplay(power);
      expect(display[0]).toContain('+2');
      expect(display[0]).toContain('Strength');
    });

    it('should format bonus with negative value', () => {
      const power: any = {
        bonuses: [{ value: -1, type: 'Speed' }]
      };
      const display = component.getBonusDisplay(power);
      expect(display[0]).toContain('-1');
    });

    it('should format bonus with target', () => {
      const power: any = {
        bonuses: [{ value: 3, type: 'bonus', target: 'Attack rolls' }]
      };
      const display = component.getBonusDisplay(power);
      expect(display[0]).toContain('to Attack rolls');
    });

    it('should format bonus with condition', () => {
      const power: any = {
        bonuses: [{ value: 2, type: 'bonus', condition: 'when flanking' }]
      };
      const display = component.getBonusDisplay(power);
      expect(display[0]).toContain('(when flanking)');
    });

    it('should handle multiple bonuses', () => {
      const power: any = {
        bonuses: [
          { value: 2, type: 'Strength' },
          { value: 1, type: 'Dexterity' }
        ]
      };
      const display = component.getBonusDisplay(power);
      expect(display.length).toBe(2);
    });
  });

  describe('Other Effects Display', () => {
    it('should return empty array for power with no effects', () => {
      const power: any = {};
      const effects = component.getOtherEffects(power);
      expect(effects).toEqual([]);
    });

    it('should format grants advantage', () => {
      const power: any = {
        grantsAdvantage: ['Stealth', 'Persuasion']
      };
      const effects = component.getOtherEffects(power);
      expect(effects[0]).toContain('Grants Advantage on:');
      expect(effects[0]).toContain('Stealth');
      expect(effects[0]).toContain('Persuasion');
    });

    it('should format grants disadvantage', () => {
      const power: any = {
        grantsDisadvantage: ['Intimidation']
      };
      const effects = component.getOtherEffects(power);
      expect(effects[0]).toContain('Grants Disadvantage on:');
      expect(effects[0]).toContain('Intimidation');
    });

    it('should include other effects', () => {
      const power: any = {
        otherEffects: ['You gain darkvision', 'You can breathe underwater']
      };
      const effects = component.getOtherEffects(power);
      expect(effects.length).toBe(2);
      expect(effects).toContain('You gain darkvision');
      expect(effects).toContain('You can breathe underwater');
    });

    it('should combine all effect types', () => {
      const power: any = {
        grantsAdvantage: ['Stealth'],
        grantsDisadvantage: ['Intimidation'],
        otherEffects: ['Custom effect']
      };
      const effects = component.getOtherEffects(power);
      expect(effects.length).toBe(3);
    });
  });

  describe('Layout', () => {
    beforeEach(() => {
      component.character = mockCharacter;
      fixture.detectChanges();
    });

    it('should have powers card', () => {
      const powersCard = fixture.debugElement.query(By.css('.powers-card'));
      expect(powersCard).toBeTruthy();
    });

    it('should have expertises card', () => {
      const expertisesCard = fixture.debugElement.query(By.css('.stats-card'));
      expect(expertisesCard).toBeTruthy();
    });
  });
});
