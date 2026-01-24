import { Character } from './character';
import { BonusType } from './bonuses/bonusModule';

describe('Character Stance Bonuses', () => {
  let character: Character;

  // Define test stance talents with bonuses matching the requirements
  const STONESTANCE_TALENT = {
    id: 'stonestance',
    name: 'Stonestance',
    description: 'Learn Stonestance. While in this stance, increase your deflect value by 1.',
    actionCost: 1,
    prerequisites: [],
    tier: 1,
    bonuses: [
      { type: BonusType.DEFLECT, target: 'all', value: 1, condition: 'while in stonestance' }
    ]
  };

  const VINESTANCE_TALENT = {
    id: 'vinestance',
    name: 'Vinestance',
    description: 'Learn Vinestance. Your Physical and Cognitive defenses increase by 1.',
    actionCost: 1,
    prerequisites: [],
    tier: 4,
    bonuses: [
      { type: BonusType.DEFENSE, target: 'physical', value: 1, condition: 'while in vinestance' },
      { type: BonusType.DEFENSE, target: 'cognitive', value: 1, condition: 'while in vinestance' }
    ]
  };

  const BLOODSTANCE_TALENT = {
    id: 'bloodstance',
    name: 'Bloodstance',
    description: 'Learn Bloodstance. Your Physical, Cognitive, and Spiritual defenses decrease by 2.',
    actionCost: 1,
    prerequisites: [],
    tier: 3,
    bonuses: [
      { type: BonusType.DEFENSE, target: 'physical', value: -2, condition: 'while in bloodstance' },
      { type: BonusType.DEFENSE, target: 'cognitive', value: -2, condition: 'while in bloodstance' },
      { type: BonusType.DEFENSE, target: 'spiritual', value: -2, condition: 'while in bloodstance' }
    ]
  };

  beforeEach(() => {
    character = new Character();
    character.name = 'Test Warrior';
  });

  describe('applyStanceBonuses()', () => {
    it('should extract and apply bonuses from stance talent node', () => {
      character.applyStanceBonuses('stonestance', STONESTANCE_TALENT);
      const deflectBonus = character.bonuses.bonuses.getBonusesFor(BonusType.DEFLECT, 'all');
      expect(deflectBonus).toBe(1);
    });

    it('should apply Stonestance with +1 deflect bonus', () => {
      character.applyStanceBonuses('stonestance', STONESTANCE_TALENT);
      const deflectBonus = character.bonuses.bonuses.getBonusesFor(BonusType.DEFLECT, 'all');
      expect(deflectBonus).toBe(1);
    });

    it('should apply Vinestance with +1 physical and cognitive defense', () => {
      character.applyStanceBonuses('vinestance', VINESTANCE_TALENT);
      const physicalDefense = character.bonuses.bonuses.getBonusesFor(BonusType.DEFENSE, 'physical');
      const cognitiveDefense = character.bonuses.bonuses.getBonusesFor(BonusType.DEFENSE, 'cognitive');
      expect(physicalDefense).toBe(1);
      expect(cognitiveDefense).toBe(1);
    });

    it('should apply Bloodstance with -2 defense penalties', () => {
      character.applyStanceBonuses('bloodstance', BLOODSTANCE_TALENT);
      const physicalDefense = character.bonuses.bonuses.getBonusesFor(BonusType.DEFENSE, 'physical');
      const cognitiveDefense = character.bonuses.bonuses.getBonusesFor(BonusType.DEFENSE, 'cognitive');
      const spiritualDefense = character.bonuses.bonuses.getBonusesFor(BonusType.DEFENSE, 'spiritual');
      expect(physicalDefense).toBe(-2);
      expect(cognitiveDefense).toBe(-2);
      expect(spiritualDefense).toBe(-2);
    });

    it('should handle stances with multiple bonuses of same type', () => {
      character.applyStanceBonuses('vinestance', VINESTANCE_TALENT);
      const physicalDefense = character.bonuses.bonuses.getBonusesFor(BonusType.DEFENSE, 'physical');
      const cognitiveDefense = character.bonuses.bonuses.getBonusesFor(BonusType.DEFENSE, 'cognitive');
      expect(physicalDefense).toBe(1);
      expect(cognitiveDefense).toBe(1);
    });

    it('should use correct source identifier "stance:{stanceId}"', () => {
      character.applyStanceBonuses('stonestance', STONESTANCE_TALENT);
      character.activeStanceId = 'stonestance';
      character.clearStanceBonuses();
      const deflectBonus = character.bonuses.bonuses.getBonusesFor(BonusType.DEFLECT, 'all');
      expect(deflectBonus).toBe(0);
    });

    it('should handle stances with no bonuses gracefully', () => {
      const emptyStance = {
        id: 'emptystance',
        name: 'Empty Stance',
        description: 'A stance with no bonuses',
        actionCost: 1,
        prerequisites: [],
        tier: 1,
        bonuses: []
      };
      expect(() => character.applyStanceBonuses('emptystance', emptyStance)).not.toThrow();
      const deflectBonus = character.bonuses.bonuses.getBonusesFor(BonusType.DEFLECT, 'all');
      expect(deflectBonus).toBe(0);
    });

    it('should handle undefined bonuses array', () => {
      const noBonusesStance = {
        id: 'nostance',
        name: 'No Bonuses Stance',
        description: 'A stance without bonuses array',
        actionCost: 1,
        prerequisites: [],
        tier: 1,
        bonuses: undefined
      };
      expect(() => character.applyStanceBonuses('nostance', noBonusesStance)).not.toThrow();
    });
  });

  describe('clearStanceBonuses()', () => {
    it('should remove all bonuses from the active stance', () => {
      character.activeStanceId = 'stonestance';
      character.applyStanceBonuses('stonestance', STONESTANCE_TALENT);
      let deflectBonus = character.bonuses.bonuses.getBonusesFor(BonusType.DEFLECT, 'all');
      expect(deflectBonus).toBe(1);
      character.clearStanceBonuses();
      deflectBonus = character.bonuses.bonuses.getBonusesFor(BonusType.DEFLECT, 'all');
      expect(deflectBonus).toBe(0);
    });

    it('should remove Stonestance deflect bonus', () => {
      character.activeStanceId = 'stonestance';
      character.applyStanceBonuses('stonestance', STONESTANCE_TALENT);
      character.clearStanceBonuses();
      const deflectBonus = character.bonuses.bonuses.getBonusesFor(BonusType.DEFLECT, 'all');
      expect(deflectBonus).toBe(0);
    });

    it('should remove Vinestance defense bonuses', () => {
      character.activeStanceId = 'vinestance';
      character.applyStanceBonuses('vinestance', VINESTANCE_TALENT);
      character.clearStanceBonuses();
      const physicalDefense = character.bonuses.bonuses.getBonusesFor(BonusType.DEFENSE, 'physical');
      const cognitiveDefense = character.bonuses.bonuses.getBonusesFor(BonusType.DEFENSE, 'cognitive');
      expect(physicalDefense).toBe(0);
      expect(cognitiveDefense).toBe(0);
    });

    it('should remove Bloodstance penalty bonuses', () => {
      character.activeStanceId = 'bloodstance';
      character.applyStanceBonuses('bloodstance', BLOODSTANCE_TALENT);
      character.clearStanceBonuses();
      const physicalDefense = character.bonuses.bonuses.getBonusesFor(BonusType.DEFENSE, 'physical');
      const cognitiveDefense = character.bonuses.bonuses.getBonusesFor(BonusType.DEFENSE, 'cognitive');
      const spiritualDefense = character.bonuses.bonuses.getBonusesFor(BonusType.DEFENSE, 'spiritual');
      expect(physicalDefense).toBe(0);
      expect(cognitiveDefense).toBe(0);
      expect(spiritualDefense).toBe(0);
    });

    it('should do nothing if no active stance is set', () => {
      character.activeStanceId = null;
      expect(() => character.clearStanceBonuses()).not.toThrow();
      const deflectBonus = character.bonuses.bonuses.getBonusesFor(BonusType.DEFLECT, 'all');
      expect(deflectBonus).toBe(0);
    });

    it('should not affect bonuses from other sources', () => {
      character.bonuses.bonuses.addBonus('talent:other', { type: BonusType.DEFLECT, target: 'all', value: 2 });
      character.activeStanceId = 'stonestance';
      character.applyStanceBonuses('stonestance', STONESTANCE_TALENT);
      character.clearStanceBonuses();
      const deflectBonus = character.bonuses.bonuses.getBonusesFor(BonusType.DEFLECT, 'all');
      expect(deflectBonus).toBe(2);
    });
  });

  describe('Stance Bonus Lifecycle', () => {
    it('should apply and clear bonuses correctly in sequence', () => {
      character.activeStanceId = 'stonestance';
      character.applyStanceBonuses('stonestance', STONESTANCE_TALENT);
      let deflectBonus = character.bonuses.bonuses.getBonusesFor(BonusType.DEFLECT, 'all');
      expect(deflectBonus).toBe(1);

      character.clearStanceBonuses();
      deflectBonus = character.bonuses.bonuses.getBonusesFor(BonusType.DEFLECT, 'all');
      expect(deflectBonus).toBe(0);

      character.activeStanceId = 'vinestance';
      character.applyStanceBonuses('vinestance', VINESTANCE_TALENT);
      const physicalDefense = character.bonuses.bonuses.getBonusesFor(BonusType.DEFENSE, 'physical');
      const cognitiveDefense = character.bonuses.bonuses.getBonusesFor(BonusType.DEFENSE, 'cognitive');
      expect(physicalDefense).toBe(1);
      expect(cognitiveDefense).toBe(1);

      character.clearStanceBonuses();
      expect(character.bonuses.bonuses.getBonusesFor(BonusType.DEFENSE, 'physical')).toBe(0);
      expect(character.bonuses.bonuses.getBonusesFor(BonusType.DEFENSE, 'cognitive')).toBe(0);
    });

    it('should switch between stances with correct bonus updates', () => {
      character.activeStanceId = 'stonestance';
      character.applyStanceBonuses('stonestance', STONESTANCE_TALENT);
      expect(character.bonuses.bonuses.getBonusesFor(BonusType.DEFLECT, 'all')).toBe(1);
      expect(character.bonuses.bonuses.getBonusesFor(BonusType.DEFENSE, 'physical')).toBe(0);

      character.clearStanceBonuses();
      character.activeStanceId = 'vinestance';
      character.applyStanceBonuses('vinestance', VINESTANCE_TALENT);
      expect(character.bonuses.bonuses.getBonusesFor(BonusType.DEFLECT, 'all')).toBe(0);
      expect(character.bonuses.bonuses.getBonusesFor(BonusType.DEFENSE, 'physical')).toBe(1);
      expect(character.bonuses.bonuses.getBonusesFor(BonusType.DEFENSE, 'cognitive')).toBe(1);
    });

    it('should correctly apply multiple stance bonuses if called multiple times with same stance', () => {
      character.activeStanceId = 'stonestance';
      character.applyStanceBonuses('stonestance', STONESTANCE_TALENT);
      character.applyStanceBonuses('stonestance', STONESTANCE_TALENT);
      const deflectBonus = character.bonuses.bonuses.getBonusesFor(BonusType.DEFLECT, 'all');
      expect(deflectBonus).toBe(2);
    });
  });

  describe('Hardcoding Validation', () => {
    it('should not contain hardcoded bonus values', () => {
      const customStonestance = {
        ...STONESTANCE_TALENT,
        bonuses: [
          { type: BonusType.DEFLECT, target: 'all', value: 3 }
        ]
      };
      character.applyStanceBonuses('stonestance', customStonestance);
      const deflectBonus = character.bonuses.bonuses.getBonusesFor(BonusType.DEFLECT, 'all');
      expect(deflectBonus).toBe(3);
    });

    it('should apply any bonus type, not just specific ones', () => {
      const customStance = {
        id: 'custom',
        name: 'Custom Stance',
        description: 'A custom stance',
        actionCost: 1,
        prerequisites: [],
        tier: 1,
        bonuses: [
          { type: BonusType.SKILL, target: 'athletics', value: 2 },
          { type: BonusType.ATTRIBUTE, target: 'strength', value: 1 }
        ]
      };
      character.applyStanceBonuses('custom', customStance);
      const skillBonus = character.bonuses.bonuses.getBonusesFor(BonusType.SKILL, 'athletics');
      const attributeBonus = character.bonuses.bonuses.getBonusesFor(BonusType.ATTRIBUTE, 'strength');
      expect(skillBonus).toBe(2);
      expect(attributeBonus).toBe(1);
    });
  });
});

