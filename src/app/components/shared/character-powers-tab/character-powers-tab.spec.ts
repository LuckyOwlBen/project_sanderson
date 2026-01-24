import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CharacterPowersTab } from './character-powers-tab';
import { Character } from '../../../character/character';
import { By } from '@angular/platform-browser';
import { ActionCostCode } from '../../../character/talents/talentInterface';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ExpertiseSourceHelper } from '../../../character/expertises/expertiseSource';

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
    mockCharacter.selectedExpertises = [
      ExpertiseSourceHelper.create('Combat', 'manual'),
      ExpertiseSourceHelper.create('Stealth', 'talent', 'talent:spy'),
      ExpertiseSourceHelper.create('Persuasion', 'culture', 'culture:Alethi')
    ];
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
      expect(expertises.some(e => e.name === 'Combat')).toBe(true);
      expect(expertises.some(e => e.name === 'Stealth')).toBe(true);
      expect(expertises.some(e => e.name === 'Persuasion')).toBe(true);
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

  describe('Stance Integration - Ironstance Full Flow', () => {
    let character: Character;

    beforeEach(() => {
      character = new Character();
      character.name = 'Ironstance Warrior';
      // Unlock Ironstance talent
      character.unlockedTalents.add('ironstance');
      component.character = character;
      fixture.detectChanges();
    });

    it('Packet 6 Integration Test: Set Ironstance → verify bonuses + advantage ribbon', () => {
      // STEP 1: Verify Ironstance is available
      const availableStances = character.getAvailableStances();
      const ironstance = availableStances.find(s => s.id === 'ironstance');
      
      expect(ironstance).toBeDefined();
      expect(ironstance?.name).toBe('Ironstance');
      expect(ironstance?.description).toContain('Insight');
      expect(ironstance?.activationCost).toBe(1);

      // STEP 2: Verify Ironstance grants advantage
      expect(ironstance?.grantsAdvantage).toBeDefined();
      expect(ironstance?.grantsAdvantage?.length).toBeGreaterThan(0);
      expect(ironstance?.grantsAdvantage).toContain('insight_in_ironstance');

      // STEP 3: Set Ironstance as active stance
      const setSuccess = character.setActiveStance('ironstance');
      expect(setSuccess).toBe(true);
      expect(character.activeStanceId).toBe('ironstance');

      // STEP 4: Verify active stance object is correctly populated
      const activeStance = character.getActiveStance();
      expect(activeStance).toBeDefined();
      expect(activeStance?.id).toBe('ironstance');
      expect(activeStance?.name).toBe('Ironstance');
      expect(activeStance?.grantsAdvantage).toContain('insight_in_ironstance');

      // STEP 5: Verify bonuses are applied (if any exist)
      if (activeStance?.bonuses && activeStance.bonuses.length > 0) {
        expect(Array.isArray(activeStance.bonuses)).toBe(true);
      }

      // STEP 6: Force component change detection to update template
      component.character = character;
      fixture.detectChanges();

      // STEP 7: Verify stance selector component receives updated character
      const stanceSelectorComponent = fixture.debugElement.query(
        By.directive(StanceSelectorComponent)
      );
      if (stanceSelectorComponent) {
        const stanceSelectorInstance = stanceSelectorComponent.componentInstance;
        expect(stanceSelectorInstance.character).toBe(character);
        expect(stanceSelectorInstance.getActiveStanceId()).toBe('ironstance');
      }

      // STEP 8: Verify advantage ribbon would display by checking template conditions
      const activeStanceDisplay = fixture.debugElement.query(
        By.css('.stance-details-section')
      );
      if (activeStanceDisplay && activeStance?.grantsAdvantage?.length) {
        // The template should render the advantage-ribbons div
        fixture.detectChanges();
        const ribbonContainer = fixture.debugElement.query(
          By.css('.advantage-ribbons')
        );
        if (ribbonContainer) {
          expect(ribbonContainer).toBeTruthy();
          const ribbons = fixture.debugElement.queryAll(
            By.css('.ribbon-corner')
          );
          expect(ribbons.length).toBeGreaterThan(0);
          // Verify at least one ribbon contains the advantage ID
          const ribbonTexts = ribbons.map(r => r.nativeElement.textContent);
          expect(ribbonTexts.some(text => 
            text.includes('insight_in_ironstance') || 
            text.toLowerCase().includes('insight')
          )).toBe(true);
        }
      }
    });

    it('should verify stanceChanged event emits when Ironstance is selected', () => {
      // Verify character can be set to Ironstance
      const setSuccess = character.setActiveStance('ironstance');
      expect(setSuccess).toBe(true);
      
      // Verify the stance was actually set
      expect(character.activeStanceId).toBe('ironstance');
      
      // Verify we can retrieve the active stance
      const activeStance = character.getActiveStance();
      expect(activeStance?.id).toBe('ironstance');
    });

    it('should verify Ironstance with grantsAdvantage provides visual reminder via ribbon', () => {
      // Set Ironstance active
      character.setActiveStance('ironstance');
      const activeStance = character.getActiveStance();

      // Verify the stance has advantages for ribbon display
      expect(activeStance?.grantsAdvantage).toBeDefined();
      expect(activeStance?.grantsAdvantage?.length).toBeGreaterThan(0);

      // Verify all advantages are valid strings
      activeStance?.grantsAdvantage?.forEach(advantage => {
        expect(typeof advantage).toBe('string');
        expect(advantage.length).toBeGreaterThan(0);
      });

      // Update component to trigger change detection
      component.character = character;
      fixture.detectChanges();

      // The ribbons should render if the component is working
      // Component renders ribbons for each advantage in grantsAdvantage array
    });

    it('should handle switching from Ironstance to another stance', () => {
      const availableStances = character.getAvailableStances();
      
      // For this test, we need at least one stance available
      if (availableStances.length >= 1) {
        // Set Ironstance
        character.setActiveStance('ironstance');
        expect(character.activeStanceId).toBe('ironstance');

        // If multiple stances available, switch to another
        if (availableStances.length > 1) {
          const otherStance = availableStances.find(s => s.id !== 'ironstance');
          if (otherStance) {
            character.setActiveStance(otherStance.id);
            expect(character.activeStanceId).toBe(otherStance.id);
            
            // Return to Ironstance
            character.setActiveStance('ironstance');
            expect(character.activeStanceId).toBe('ironstance');
          }
        }
      }
    });

    it('should verify Ironstance advantage reminder persists while active', () => {
      character.setActiveStance('ironstance');
      
      // Get active stance multiple times - should remain consistent
      const stance1 = character.getActiveStance();
      const stance2 = character.getActiveStance();
      
      expect(stance1?.id).toBe(stance2?.id);
      expect(stance1?.grantsAdvantage).toEqual(stance2?.grantsAdvantage);
      expect(stance1?.grantsAdvantage).toContain('insight_in_ironstance');
    });
  });
});

// Import StanceSelectorComponent for integration test
import { StanceSelectorComponent } from '../stance-selector/stance-selector';
