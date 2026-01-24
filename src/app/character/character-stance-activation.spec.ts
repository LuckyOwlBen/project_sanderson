import { Character } from './character';
import { Stance } from './attacks/attackInterfaces';

describe('Character - Stance Activation', () => {
  let character: Character;

  beforeEach(() => {
    character = new Character();
    character.name = 'Test Warrior';
  });

  describe('activeStanceId property', () => {
    it('should initialize with null activeStanceId', () => {
      expect(character.activeStanceId).toBeNull();
    });

    it('should allow direct property assignment', () => {
      character.activeStanceId = 'test-stance';
      expect(character.activeStanceId).toBe('test-stance');
    });

    it('should allow setting back to null', () => {
      character.activeStanceId = 'test-stance';
      character.activeStanceId = null;
      expect(character.activeStanceId).toBeNull();
    });
  });

  describe('setActiveStance', () => {
    it('should set activeStanceId to null when passed null', () => {
      character.activeStanceId = 'some-stance';
      
      const result = character.setActiveStance(null);
      
      expect(result).toBe(true);
      expect(character.activeStanceId).toBeNull();
    });

    it('should return false when setting an unavailable stance', () => {
      const result = character.setActiveStance('nonexistent-stance-id');
      
      expect(result).toBe(false);
      expect(character.activeStanceId).toBeNull();
    });

    it('should set activeStanceId when stance is available', () => {
      const availableStances = character.getAvailableStances();
      
      if (availableStances.length > 0) {
        const stanceId = availableStances[0].id;
        const result = character.setActiveStance(stanceId);
        
        expect(result).toBe(true);
        expect(character.activeStanceId).toBe(stanceId);
      }
    });

    it('should allow switching between available stances', () => {
      const availableStances = character.getAvailableStances();
      
      if (availableStances.length >= 2) {
        const stance1Id = availableStances[0].id;
        const stance2Id = availableStances[1].id;
        
        character.setActiveStance(stance1Id);
        expect(character.activeStanceId).toBe(stance1Id);
        
        character.setActiveStance(stance2Id);
        expect(character.activeStanceId).toBe(stance2Id);
      }
    });

    it('should deactivate stance when setting to null after having an active stance', () => {
      const availableStances = character.getAvailableStances();
      
      if (availableStances.length > 0) {
        const stanceId = availableStances[0].id;
        character.setActiveStance(stanceId);
        expect(character.activeStanceId).toBe(stanceId);
        
        const result = character.setActiveStance(null);
        expect(result).toBe(true);
        expect(character.activeStanceId).toBeNull();
      }
    });
  });

  describe('getActiveStance', () => {
    it('should return null when no stance is active', () => {
      const activeStance = character.getActiveStance();
      
      expect(activeStance).toBeNull();
    });

    it('should return the active Stance object when a stance is active', () => {
      const availableStances = character.getAvailableStances();
      
      if (availableStances.length > 0) {
        const stanceId = availableStances[0].id;
        character.setActiveStance(stanceId);
        
        const activeStance = character.getActiveStance();
        
        expect(activeStance).not.toBeNull();
        expect(activeStance?.id).toBe(stanceId);
        expect(activeStance?.name).toBeDefined();
        expect(activeStance?.description).toBeDefined();
      }
    });

    it('should return null when activeStanceId is set to invalid value', () => {
      character.activeStanceId = 'invalid-stance-id';
      
      const activeStance = character.getActiveStance();
      
      expect(activeStance).toBeNull();
    });

    it('should return null after deactivating a stance', () => {
      const availableStances = character.getAvailableStances();
      
      if (availableStances.length > 0) {
        const stanceId = availableStances[0].id;
        character.setActiveStance(stanceId);
        expect(character.getActiveStance()).not.toBeNull();
        
        character.setActiveStance(null);
        const activeStance = character.getActiveStance();
        
        expect(activeStance).toBeNull();
      }
    });

    it('should return correct Stance object when switching between stances', () => {
      const availableStances = character.getAvailableStances();
      
      if (availableStances.length >= 2) {
        const stance1 = availableStances[0];
        const stance2 = availableStances[1];
        
        character.setActiveStance(stance1.id);
        expect(character.getActiveStance()?.id).toBe(stance1.id);
        expect(character.getActiveStance()?.name).toBe(stance1.name);
        
        character.setActiveStance(stance2.id);
        expect(character.getActiveStance()?.id).toBe(stance2.id);
        expect(character.getActiveStance()?.name).toBe(stance2.name);
      }
    });
  });

  describe('State consistency', () => {
    it('should maintain consistency between activeStanceId and getActiveStance()', () => {
      const availableStances = character.getAvailableStances();
      
      if (availableStances.length > 0) {
        const stanceId = availableStances[0].id;
        
        character.setActiveStance(stanceId);
        const activeStance = character.getActiveStance();
        
        expect(character.activeStanceId).toBe(stanceId);
        expect(activeStance?.id).toBe(character.activeStanceId);
      }
    });

    it('should handle rapid stance changes correctly', () => {
      const availableStances = character.getAvailableStances();
      
      if (availableStances.length >= 3) {
        const stance1Id = availableStances[0].id;
        const stance2Id = availableStances[1].id;
        const stance3Id = availableStances[2].id;
        
        character.setActiveStance(stance1Id);
        expect(character.getActiveStance()?.id).toBe(stance1Id);
        
        character.setActiveStance(stance2Id);
        expect(character.getActiveStance()?.id).toBe(stance2Id);
        
        character.setActiveStance(stance3Id);
        expect(character.getActiveStance()?.id).toBe(stance3Id);
        
        character.setActiveStance(null);
        expect(character.getActiveStance()).toBeNull();
      }
    });

    it('should remain consistent after multiple activate/deactivate cycles', () => {
      const availableStances = character.getAvailableStances();
      
      if (availableStances.length > 0) {
        const stanceId = availableStances[0].id;
        
        for (let i = 0; i < 5; i++) {
          character.setActiveStance(stanceId);
          expect(character.activeStanceId).toBe(stanceId);
          expect(character.getActiveStance()?.id).toBe(stanceId);
          
          character.setActiveStance(null);
          expect(character.activeStanceId).toBeNull();
          expect(character.getActiveStance()).toBeNull();
        }
      }
    });
  });
});
