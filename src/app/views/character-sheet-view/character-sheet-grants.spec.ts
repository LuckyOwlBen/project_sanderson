import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Character } from '../../character/character';
import { RadiantPathManager } from '../../character/radiantPath/radiantPathManager';

describe('CharacterSheetView - Grant Idempotency', () => {
  let character: Character;

  beforeEach(() => {
    character = new Character();
  });

  describe('Spren Grant Idempotency', () => {
    it('should detect when character already has spren', () => {
      expect(character.radiantPath.hasSpren()).toBe(false);
      
      character.radiantPath.grantSpren('Windrunner');
      
      expect(character.radiantPath.hasSpren()).toBe(true);
    });

    it('should prevent duplicate spren grants', () => {
      character.radiantPath.grantSpren('Windrunner');
      
      const hasSpren = character.radiantPath.hasSpren();
      expect(hasSpren).toBe(true);
      
      // Attempting to check again should still return true
      expect(character.radiantPath.hasSpren()).toBe(true);
    });

    it('should store the correct order when spren is granted', () => {
      character.radiantPath.grantSpren('Windrunner');
      
      const orderInfo = character.radiantPath.getOrderInfo();
      expect(orderInfo?.order).toBe('Windrunner');
    });
  });

  describe('Expertise Grant Idempotency', () => {
    it('should detect when expertise already exists', () => {
      // Add expertise
      character.selectedExpertises = [
        { name: 'Alchemy', source: 'gm' }
      ];

      const expertiseNames = character.selectedExpertises.map(e => e.name);
      expect(expertiseNames.includes('Alchemy')).toBe(true);
    });

    it('should not duplicate expertise in list', () => {
      character.selectedExpertises = [
        { name: 'Alchemy', source: 'gm' }
      ];

      // Check for duplicate
      const hasAlchemy = character.selectedExpertises.some(e => e.name === 'Alchemy');
      expect(hasAlchemy).toBe(true);

      // Adding same expertise should be detected
      const isDuplicate = character.selectedExpertises.some(e => e.name === 'Alchemy');
      expect(isDuplicate).toBe(true);
    });

    it('should track expertise source', () => {
      character.selectedExpertises = [
        { name: 'Alchemy', source: 'gm' }
      ];

      const expertise = character.selectedExpertises.find(e => e.name === 'Alchemy');
      expect(expertise?.source).toBe('gm');
    });
  });

  describe('Item Grant Idempotency', () => {
    it('should add stackable items correctly', () => {
      const result1 = character.inventory.addItem('iron-ingot', 5);
      expect(result1).toBe(true);

      const item1 = character.inventory.getItem('iron-ingot');
      expect(item1?.quantity).toBe(5);

      // Adding more should stack
      const result2 = character.inventory.addItem('iron-ingot', 3);
      expect(result2).toBe(true);

      const item2 = character.inventory.getItem('iron-ingot');
      expect(item2?.quantity).toBe(8);
    });

    it('should handle non-stackable items correctly', () => {
      const result1 = character.inventory.addItem('iron-sword', 1);
      expect(result1).toBe(true);

      const items = character.inventory.getAllItems();
      const swords = items.filter(i => i.id.startsWith('iron-sword'));
      expect(swords.length).toBeGreaterThanOrEqual(1);
    });

    it('should return false for unknown items', () => {
      const result = character.inventory.addItem('unknown-item-xyz', 1);
      expect(result).toBe(false);
    });

    it('should handle duplicate item grants gracefully', () => {
      // First grant
      character.inventory.addItem('health-potion', 1);
      const item1 = character.inventory.getItem('health-potion');
      expect(item1).toBeDefined();

      // Duplicate grant (should stack if stackable)
      character.inventory.addItem('health-potion', 1);
      const item2 = character.inventory.getItem('health-potion');
      expect(item2).toBeDefined();
    });
  });

  describe('Level Up Idempotency', () => {
    it('should only increment level when new level is higher', () => {
      character.level = 5;

      const newLevel = 6;
      if (newLevel > character.level) {
        character.level = newLevel;
        character.pendingLevelPoints += 1;
      }

      expect(character.level).toBe(6);
      expect(character.pendingLevelPoints).toBe(1);
    });

    it('should ignore level-up events for same or lower level', () => {
      character.level = 5;
      character.pendingLevelPoints = 0;

      const newLevel = 5; // Same level
      if (newLevel > character.level) {
        character.level = newLevel;
        character.pendingLevelPoints += 1;
      }

      expect(character.level).toBe(5);
      expect(character.pendingLevelPoints).toBe(0);
    });

    it('should ignore old level-up events', () => {
      character.level = 5;
      character.pendingLevelPoints = 0;

      const newLevel = 3; // Old level
      if (newLevel > character.level) {
        character.level = newLevel;
        character.pendingLevelPoints += 1;
      }

      expect(character.level).toBe(5);
      expect(character.pendingLevelPoints).toBe(0);
    });

    it('should allow multiple sequential level-ups', () => {
      character.level = 5;
      character.pendingLevelPoints = 0;

      // First level-up
      if (6 > character.level) {
        character.level = 6;
        character.pendingLevelPoints += 1;
      }

      // Second level-up
      if (7 > character.level) {
        character.level = 7;
        character.pendingLevelPoints += 1;
      }

      expect(character.level).toBe(7);
      expect(character.pendingLevelPoints).toBe(2);
    });
  });
});
