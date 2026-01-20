import { InvestitureManager } from './investitureManager';
import { Attributes } from '../attributes/attributes';

describe('InvestitureManager', () => {
  let investitureManager: InvestitureManager;
  let mockAttributes: Attributes;

  beforeEach(() => {
    mockAttributes = new Attributes();
    mockAttributes.strength = 3;
    mockAttributes.speed = 3;
    mockAttributes.intellect = 3;
    mockAttributes.willpower = 3;
    mockAttributes.presence = 2;
    mockAttributes.awareness = 4;
  });

  describe('investiture visibility', () => {
    it('should initialize with investiture inactive', () => {
      investitureManager = new InvestitureManager(mockAttributes, 0);
      expect(investitureManager.isActive()).toBe(false);
    });

    it('should have max value of 0 when investiture is inactive', () => {
      investitureManager = new InvestitureManager(mockAttributes, 0);
      expect(investitureManager.max).toBe(0);
    });

    it('should hide investiture on character sheet when inactive', () => {
      investitureManager = new InvestitureManager(mockAttributes, 0);
      expect(investitureManager.isActive()).toBe(false);
      expect(investitureManager.max).toBe(0);
    });
  });

  describe('investiture activation', () => {
    it('should activate investiture when unlocked', () => {
      investitureManager = new InvestitureManager(mockAttributes, 0);
      investitureManager.unlock();
      expect(investitureManager.isActive()).toBe(true);
    });

    it('should recalculate max after unlocking', () => {
      investitureManager = new InvestitureManager(mockAttributes, 0);
      investitureManager.unlock();
      investitureManager.recalculateMax(mockAttributes, 0);
      expect(investitureManager.max).toBeGreaterThan(0);
    });
  });

  describe('max investiture calculation', () => {
    beforeEach(() => {
      investitureManager = new InvestitureManager(mockAttributes, 0);
      investitureManager.unlock();
    });

    it('should calculate max as 2 + higher of (awareness or presence)', () => {
      // With awareness: 4, presence: 2, max should be 2 + 4 = 6
      investitureManager.recalculateMax(mockAttributes, 0);
      expect(investitureManager.max).toBe(6);
    });

    it('should use awareness if awareness is higher than presence', () => {
      const attrs = new Attributes();
      attrs.awareness = 5;
      attrs.presence = 2;
      investitureManager.recalculateMax(attrs, 0);
      expect(investitureManager.max).toBe(7); // 2 + 5
    });

    it('should use presence if presence is higher than awareness', () => {
      const attrs = new Attributes();
      attrs.presence = 4;
      attrs.awareness = 2;
      investitureManager.recalculateMax(attrs, 0);
      expect(investitureManager.max).toBe(6); // 2 + 4
    });

    it('should use the same value if awareness and presence are equal', () => {
      const attrs = new Attributes();
      attrs.awareness = 3;
      attrs.presence = 3;
      investitureManager.recalculateMax(attrs, 0);
      expect(investitureManager.max).toBe(5); // 2 + 3
    });

    it('should include bonuses in max calculation', () => {
      investitureManager.recalculateMax(mockAttributes, 3);
      // 2 + max(4, 2) + 3 = 9
      expect(investitureManager.max).toBe(9);
    });

    it('should handle zero attributes', () => {
      const attrs = new Attributes();
      attrs.awareness = 0;
      attrs.presence = 0;
      investitureManager.recalculateMax(attrs, 0);
      expect(investitureManager.max).toBe(2); // 2 + max(0, 0) = 2
    });

    it('should handle high attribute values', () => {
      const attrs = new Attributes();
      attrs.awareness = 10;
      attrs.presence = 8;
      investitureManager.recalculateMax(attrs, 5);
      expect(investitureManager.max).toBe(17); // 2 + 10 + 5
    });
  });

  describe('investiture spending and restoration', () => {
    beforeEach(() => {
      investitureManager = new InvestitureManager(mockAttributes, 0);
      investitureManager.unlock();
      investitureManager.recalculateMax(mockAttributes, 0);
    });

    it('should allow spending investiture when active and sufficient', () => {
      // Max is 6, spend 3
      expect(investitureManager.expendInvestiture(3)).toBe(true);
      expect(investitureManager.current).toBe(3);
    });

    it('should not allow spending more investiture than available', () => {
      expect(investitureManager.expendInvestiture(10)).toBe(false);
      expect(investitureManager.current).toBe(6);
    });

    it('should restore investiture between encounters', () => {
      investitureManager.expendInvestiture(4);
      expect(investitureManager.current).toBe(2);

      investitureManager.restoreFully();
      expect(investitureManager.current).toBe(6);
    });

    it('should not exceed max when restoring', () => {
      investitureManager.expendInvestiture(2);
      expect(investitureManager.current).toBe(4);

      investitureManager.regainInvestiture(5);
      expect(investitureManager.current).toBe(6); // Capped at max
    });

    it('should handle partial restoration', () => {
      investitureManager.expendInvestiture(3);
      expect(investitureManager.current).toBe(3);

      investitureManager.regainInvestiture(2);
      expect(investitureManager.current).toBe(5);
    });
  });

  describe('investiture after max changes', () => {
    it('should cap current value at new max when max decreases', () => {
      investitureManager = new InvestitureManager(mockAttributes, 5);
      investitureManager.unlock();
      investitureManager.recalculateMax(mockAttributes, 5);
      // Max is 2 + 4 + 5 = 11, current starts at 11

      const newAttrs = new Attributes();
      newAttrs.awareness = 2;
      newAttrs.presence = 2;
      investitureManager.recalculateMax(newAttrs, 5);
      // New max is 2 + 2 + 5 = 9
      expect(investitureManager.max).toBe(9);
      expect(investitureManager.current).toBeLessThanOrEqual(9);
    });
  });

  describe('investiture state serialization', () => {
    it('should preserve active state when serializing', () => {
      investitureManager = new InvestitureManager(mockAttributes, 0);
      investitureManager.unlock();
      investitureManager.recalculateMax(mockAttributes, 0);
      investitureManager.expendInvestiture(2);

      const state = investitureManager.toJSON();
      expect(state.isActive).toBe(true);
      expect(state.current).toBe(investitureManager.current);
      expect(state.max).toBe(investitureManager.max);
    });

    it('should restore active state when deserializing', () => {
      investitureManager = new InvestitureManager(mockAttributes, 0);
      const state = {
        isActive: true,
        current: 3,
        max: 6
      };
      investitureManager.fromJSON(state);
      expect(investitureManager.isActive()).toBe(true);
    });
  });

  describe('investiture with bonuses', () => {
    it('should recalculate correctly when bonus changes', () => {
      investitureManager = new InvestitureManager(mockAttributes, 2);
      investitureManager.unlock();
      investitureManager.recalculateMax(mockAttributes, 2);
      expect(investitureManager.max).toBe(8); // 2 + 4 + 2

      investitureManager.recalculateMax(mockAttributes, 5);
      expect(investitureManager.max).toBe(11); // 2 + 4 + 5
    });
  });
});
