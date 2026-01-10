import { Character } from './character';
import { SINGER_FORMS } from './abilities/universalAbilities';

describe('Character - Singer Forms', () => {
  let character: Character;

  beforeEach(() => {
    character = new Character();
    character.name = 'Test Singer';
  });

  describe('unlockSingerForm', () => {
    it('should unlock a Singer form', () => {
      character.unlockSingerForm('nimbleform');
      
      expect(character.unlockedSingerForms).toContain('nimbleform');
      expect(character.hasSingerForm('nimbleform')).toBe(true);
    });

    it('should unlock multiple forms', () => {
      character.unlockSingerForm('nimbleform');
      character.unlockSingerForm('artform');
      
      expect(character.unlockedSingerForms).toHaveLength(2);
      expect(character.hasSingerForm('nimbleform')).toBe(true);
      expect(character.hasSingerForm('artform')).toBe(true);
    });

    it('should not duplicate forms', () => {
      character.unlockSingerForm('nimbleform');
      character.unlockSingerForm('nimbleform');
      
      expect(character.unlockedSingerForms).toHaveLength(1);
    });

    it('should unlock Forms of Finesse', () => {
      character.unlockSingerForm('nimbleform');
      character.unlockSingerForm('artform');
      
      expect(character.hasSingerForm('nimbleform')).toBe(true);
      expect(character.hasSingerForm('artform')).toBe(true);
    });

    it('should unlock Forms of Wisdom', () => {
      character.unlockSingerForm('meditationform');
      character.unlockSingerForm('scholarform');
      
      expect(character.hasSingerForm('meditationform')).toBe(true);
      expect(character.hasSingerForm('scholarform')).toBe(true);
    });

    it('should unlock Forms of Resolve', () => {
      character.unlockSingerForm('warform');
      character.unlockSingerForm('workform');
      
      expect(character.hasSingerForm('warform')).toBe(true);
      expect(character.hasSingerForm('workform')).toBe(true);
    });

    it('should unlock Forms of Destruction', () => {
      character.unlockSingerForm('direform');
      character.unlockSingerForm('stormform');
      
      expect(character.hasSingerForm('direform')).toBe(true);
      expect(character.hasSingerForm('stormform')).toBe(true);
    });

    it('should unlock Forms of Expansion', () => {
      character.unlockSingerForm('envoyform');
      character.unlockSingerForm('relayform');
      
      expect(character.hasSingerForm('envoyform')).toBe(true);
      expect(character.hasSingerForm('relayform')).toBe(true);
    });

    it('should unlock Forms of Mystery', () => {
      character.unlockSingerForm('decayform');
      character.unlockSingerForm('nightform');
      
      expect(character.hasSingerForm('decayform')).toBe(true);
      expect(character.hasSingerForm('nightform')).toBe(true);
    });
  });

  describe('hasSingerForm', () => {
    it('should return false for forms not unlocked', () => {
      expect(character.hasSingerForm('nimbleform')).toBe(false);
      expect(character.hasSingerForm('stormform')).toBe(false);
    });

    it('should return true for unlocked forms', () => {
      character.unlockSingerForm('nimbleform');
      
      expect(character.hasSingerForm('nimbleform')).toBe(true);
    });
  });

  describe('getUniversalAbilities - Singer Forms', () => {
    it('should return no Singer abilities when no forms unlocked', () => {
      const abilities = character.getUniversalAbilities();
      
      const singerAbilities = abilities.filter(a => a.source.includes('Singer Forms'));
      expect(singerAbilities).toHaveLength(0);
    });

    it('should return Change Form when any form unlocked', () => {
      character.unlockSingerForm('nimbleform');
      
      const abilities = character.getUniversalAbilities();
      const changeForm = abilities.find(a => a.id === 'change_form');
      
      expect(changeForm).toBeDefined();
    });

    it('should return unlocked forms as abilities', () => {
      character.unlockSingerForm('nimbleform');
      character.unlockSingerForm('artform');
      
      const abilities = character.getUniversalAbilities();
      
      expect(abilities.find(a => a.id === 'nimbleform')).toBeDefined();
      expect(abilities.find(a => a.id === 'artform')).toBeDefined();
    });

    it('should not return locked forms', () => {
      character.unlockSingerForm('nimbleform');
      
      const abilities = character.getUniversalAbilities();
      
      expect(abilities.find(a => a.id === 'nimbleform')).toBeDefined();
      expect(abilities.find(a => a.id === 'stormform')).toBeUndefined();
    });

    it('should return Unleash Lightning with stormform', () => {
      character.unlockSingerForm('stormform');
      
      const abilities = character.getUniversalAbilities();
      
      expect(abilities.find(a => a.id === 'stormform')).toBeDefined();
      expect(abilities.find(a => a.id === 'unleash_lightning')).toBeDefined();
    });

    it('should combine Radiant and Singer abilities', () => {
      // Speak First Ideal
      character.radiantPath.grantSpren('Windrunner');
      character.radiantPath.speakIdeal(character.skills);
      
      // Unlock Singer forms
      character.unlockSingerForm('nimbleform');
      
      const abilities = character.getUniversalAbilities();
      
      // Should have Radiant abilities
      expect(abilities.find(a => a.id === 'breathe_stormlight')).toBeDefined();
      expect(abilities.find(a => a.id === 'enhance')).toBeDefined();
      expect(abilities.find(a => a.id === 'regenerate')).toBeDefined();
      
      // Should have Singer abilities
      expect(abilities.find(a => a.id === 'nimbleform')).toBeDefined();
      expect(abilities.find(a => a.id === 'change_form')).toBeDefined();
    });
  });

  describe('Singer Forms - Complete Flow', () => {
    it('should handle unlocking all Forms of Finesse', () => {
      character.unlockSingerForm('nimbleform');
      character.unlockSingerForm('artform');
      
      const abilities = character.getUniversalAbilities();
      const formAbilities = abilities.filter(a => 
        a.id === 'nimbleform' || a.id === 'artform'
      );
      
      expect(formAbilities).toHaveLength(2);
    });

    it('should handle progression through form tiers', () => {
      // Tier 1: Forms of Finesse
      character.unlockSingerForm('nimbleform');
      character.unlockSingerForm('artform');
      
      let abilities = character.getUniversalAbilities();
      expect(abilities.find(a => a.id === 'nimbleform')).toBeDefined();
      expect(abilities.find(a => a.id === 'artform')).toBeDefined();
      
      // Tier 4: Forms of Destruction (after Voidspren bond)
      character.unlockSingerForm('direform');
      character.unlockSingerForm('stormform');
      
      abilities = character.getUniversalAbilities();
      expect(abilities.find(a => a.id === 'direform')).toBeDefined();
      expect(abilities.find(a => a.id === 'stormform')).toBeDefined();
      expect(abilities.find(a => a.id === 'unleash_lightning')).toBeDefined();
    });

    it('should maintain form state independently', () => {
      character.unlockSingerForm('nimbleform');
      
      const newCharacter = new Character();
      
      expect(character.hasSingerForm('nimbleform')).toBe(true);
      expect(newCharacter.hasSingerForm('nimbleform')).toBe(false);
    });
  });
});
