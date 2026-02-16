import { Character } from '../character';
import { applyTalentEffects, getTalentEffectPreview } from './talentEffects';
import { SINGER_FORMS } from '../abilities/universalAbilities';

describe('Talent Effects', () => {
  let character: Character;

  beforeEach(() => {
    character = new Character();
    character.name = 'Test Character';
  });

  describe('applyTalentEffects', () => {
    it('should grant forms when Forms of Finesse unlocked', () => {
      applyTalentEffects(character, 'forms_of_finesse');
      
      expect(character.hasSingerForm('nimbleform')).toBe(true);
      expect(character.hasSingerForm('artform')).toBe(true);
      expect(character.unlockedSingerForms).toHaveLength(2);
    });

    it('should grant forms when Forms of Wisdom unlocked', () => {
      applyTalentEffects(character, 'forms_of_wisdom');
      
      expect(character.hasSingerForm('meditationform')).toBe(true);
      expect(character.hasSingerForm('scholarform')).toBe(true);
    });

    it('should grant forms when Forms of Resolve unlocked', () => {
      applyTalentEffects(character, 'forms_of_resolve');
      
      expect(character.hasSingerForm('warform')).toBe(true);
      expect(character.hasSingerForm('workform')).toBe(true);
    });

    it('should grant forms when Forms of Destruction unlocked', () => {
      applyTalentEffects(character, 'forms_of_destruction');
      
      expect(character.hasSingerForm('direform')).toBe(true);
      expect(character.hasSingerForm('stormform')).toBe(true);
    });

    it('should grant forms when Forms of Expansion unlocked', () => {
      applyTalentEffects(character, 'forms_of_expansion');
      
      expect(character.hasSingerForm('envoyform')).toBe(true);
      expect(character.hasSingerForm('relayform')).toBe(true);
    });

    it('should grant forms when Forms of Mystery unlocked', () => {
      applyTalentEffects(character, 'forms_of_mystery');
      
      expect(character.hasSingerForm('decayform')).toBe(true);
      expect(character.hasSingerForm('nightform')).toBe(true);
    });

    it('should handle non-Singer talents gracefully', () => {
      const initialFormCount = character.unlockedSingerForms.length;
      
      applyTalentEffects(character, 'some_other_talent');
      
      expect(character.unlockedSingerForms).toHaveLength(initialFormCount);
    });

    it('should handle multiple talent unlocks', () => {
      applyTalentEffects(character, 'forms_of_finesse');
      applyTalentEffects(character, 'forms_of_wisdom');
      
      expect(character.unlockedSingerForms).toHaveLength(4);
      expect(character.hasSingerForm('nimbleform')).toBe(true);
      expect(character.hasSingerForm('artform')).toBe(true);
      expect(character.hasSingerForm('meditationform')).toBe(true);
      expect(character.hasSingerForm('scholarform')).toBe(true);
    });

    it('should not duplicate forms on re-unlock', () => {
      applyTalentEffects(character, 'forms_of_finesse');
      applyTalentEffects(character, 'forms_of_finesse');
      
      expect(character.unlockedSingerForms).toHaveLength(2);
    });
  });

  describe('getTalentEffectPreview', () => {
    it('should show forms for Forms of Finesse', () => {
      const effects = getTalentEffectPreview('forms_of_finesse');
      
      expect(effects).toHaveLength(1);
      expect(effects[0]).toContain('nimbleform');
      expect(effects[0]).toContain('artform');
    });

    it('should show forms for Forms of Destruction', () => {
      const effects = getTalentEffectPreview('forms_of_destruction');
      
      expect(effects).toHaveLength(1);
      expect(effects[0]).toContain('direform');
      expect(effects[0]).toContain('stormform');
    });

    it('should return empty array for non-Singer talents', () => {
      const effects = getTalentEffectPreview('some_other_talent');
      
      expect(effects).toEqual([]);
    });

    it('should show all form categories correctly', () => {
      const talents = [
        'forms_of_finesse',
        'forms_of_wisdom',
        'forms_of_resolve',
        'forms_of_destruction',
        'forms_of_expansion',
        'forms_of_mystery'
      ];

      talents.forEach(talentId => {
        const effects = getTalentEffectPreview(talentId);
        expect(effects.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Integration - Talent Effects with Universal Abilities', () => {
    it('should make forms available as universal abilities after unlock', () => {
      // Start with no abilities
      let abilities = character.getUniversalAbilities();
      expect(abilities.find(a => a.id === 'nimbleform')).toBeUndefined();
      
      // Unlock Forms of Finesse
      applyTalentEffects(character, 'forms_of_finesse');
      
      // Should now have forms as abilities
      abilities = character.getUniversalAbilities();
      expect(abilities.find(a => a.id === 'nimbleform')).toBeDefined();
      expect(abilities.find(a => a.id === 'artform')).toBeDefined();
      expect(abilities.find(a => a.id === 'change_form')).toBeDefined();
    });

    it('should grant Unleash Lightning with stormform', () => {
      applyTalentEffects(character, 'forms_of_destruction');
      
      const abilities = character.getUniversalAbilities();
      expect(abilities.find(a => a.id === 'unleash_lightning')).toBeDefined();
    });

    it('should handle progressive form unlocking', () => {
      // Unlock tier 1 forms
      applyTalentEffects(character, 'forms_of_finesse');
      let abilities = character.getUniversalAbilities();
      let formCount = abilities.filter(a => SINGER_FORMS.find(f => f.id === a.id)).length;
      expect(formCount).toBe(2); // nimbleform, artform
      
      // Unlock more tier 1 forms
      applyTalentEffects(character, 'forms_of_wisdom');
      abilities = character.getUniversalAbilities();
      formCount = abilities.filter(a => SINGER_FORMS.find(f => f.id === a.id)).length;
      expect(formCount).toBe(4); // + meditationform, scholarform
      
      // Unlock tier 4 forms
      applyTalentEffects(character, 'forms_of_destruction');
      abilities = character.getUniversalAbilities();
      formCount = abilities.filter(a => SINGER_FORMS.find(f => f.id === a.id)).length;
      expect(formCount).toBe(6); // + direform, stormform
    });
  });
});
