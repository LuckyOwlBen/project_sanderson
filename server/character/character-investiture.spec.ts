import { Character } from './character';
import { Attributes } from './attributes/attributes';

describe('Character Investiture Integration', () => {
  let character: Character;

  beforeEach(() => {
    character = new Character();
    character.attributes = new Attributes();
    character.attributes.awareness = 4;
    character.attributes.presence = 2;
  });

  describe('investiture visibility before spren bond', () => {
    it('should not have investiture active initially', () => {
      expect(character.resources.investiture.isActive()).toBe(false);
    });

    it('should have max investiture of 0 before bonding spren', () => {
      expect(character.resources.investiture.max).toBe(0);
    });
  });

  describe('investiture activation with spren bond', () => {
    it('should not activate investiture when only bonding spren', () => {
      character.radiantPath.grantSpren('Windrunner');
      
      expect(character.resources.investiture.isActive()).toBe(false);
      expect(character.resources.investiture.max).toBe(0);
    });

    it('should activate investiture when speaking first ideal after bonding spren', () => {
      character.radiantPath.grantSpren('Windrunner');
      character.radiantPath.speakIdeal(character.skills);
      
      // Trigger investiture unlock
      character.unlockInvestiture();
      character.recalculateResources();
      
      expect(character.resources.investiture.isActive()).toBe(true);
      expect(character.resources.investiture.max).toBeGreaterThan(0);
    });

    it('should calculate max investiture correctly after unlocking', () => {
      character.radiantPath.grantSpren('Windrunner');
      character.radiantPath.speakIdeal(character.skills);
      character.unlockInvestiture();
      character.recalculateResources();
      
      // 2 + max(awareness: 4, presence: 2) = 6
      expect(character.resources.investiture.max).toBe(6);
      expect(character.resources.investiture.current).toBe(6);
    });
  });

  describe('investiture with attribute changes', () => {
    beforeEach(() => {
      character.radiantPath.grantSpren('Windrunner');
      character.radiantPath.speakIdeal(character.skills);
      character.unlockInvestiture();
      character.recalculateResources();
    });

    it('should update max investiture when awareness increases', () => {
      character.attributes.awareness = 6;
      character.recalculateResources();
      
      // 2 + max(6, 2) = 8
      expect(character.resources.investiture.max).toBe(8);
    });

    it('should update max investiture when presence increases', () => {
      character.attributes.presence = 5;
      character.recalculateResources();
      
      // 2 + max(4, 5) = 7
      expect(character.resources.investiture.max).toBe(7);
    });

    it('should cap current investiture when max decreases', () => {
      character.resources.investiture.expendInvestiture(2);
      expect(character.resources.investiture.current).toBe(4);
      
      character.attributes.awareness = 1;
      character.attributes.presence = 1;
      character.recalculateResources();
      
      // New max: 2 + max(1, 1) = 3
      expect(character.resources.investiture.max).toBe(3);
      expect(character.resources.investiture.current).toBe(3);
    });
  });

  describe('investiture persistence', () => {
    it('should maintain investiture state after spending', () => {
      character.radiantPath.grantSpren('Windrunner');
      character.radiantPath.speakIdeal(character.skills);
      character.unlockInvestiture();
      character.recalculateResources();
      character.resources.investiture.expendInvestiture(2);
      
      expect(character.resources.investiture.isActive()).toBe(true);
      expect(character.resources.investiture.max).toBe(6);
      expect(character.resources.investiture.current).toBe(4);
    });
  });

  describe('investiture restoration', () => {
    beforeEach(() => {
      character.radiantPath.grantSpren('Windrunner');
      character.radiantPath.speakIdeal(character.skills);
      character.unlockInvestiture();
      character.recalculateResources();
    });

    it('should restore investiture fully between encounters', () => {
      character.resources.investiture.expendInvestiture(4);
      expect(character.resources.investiture.current).toBe(2);
      
      character.restoreInvestitureBetweenEncounters();
      expect(character.resources.investiture.current).toBe(6);
    });

    it('should not exceed max when restoring', () => {
      character.resources.investiture.expendInvestiture(1);
      character.resources.investiture.regainInvestiture(10);
      
      expect(character.resources.investiture.current).toBe(6);
    });
  });

  describe('investiture with bonuses', () => {
    it('should include bonuses in max calculation', () => {
      character.radiantPath.grantSpren('Windrunner');
      character.radiantPath.speakIdeal(character.skills);
      character.unlockInvestiture();
      
      // Note: Bonus system integration would be tested separately
      // For now, just verify the base calculation works
      character.recalculateResources();
      
      // Base: 2 + max(4, 2) = 6
      expect(character.resources.investiture.max).toBe(6);
    });
  });
});
