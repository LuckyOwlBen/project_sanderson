import { Character } from '../character';
import { applyTalentEffects } from '../talents/talentEffects';

describe('Universal Abilities Integration', () => {
  let character: Character;

  beforeEach(() => {
    character = new Character();
    character.name = 'Integration Test Character';
  });

  describe('Complete Radiant + Singer Flow', () => {
    it('should handle character with both Radiant and Singer abilities', () => {
      // Start as Windrunner
      character.radiantPath.grantSpren('Windrunner');
      character.radiantPath.speakIdeal(character.skills);

      // Unlock Singer forms
      applyTalentEffects(character, 'forms_of_finesse');

      const abilities = character.getUniversalAbilities();

      // Should have 3 Radiant abilities
      expect(abilities.find(a => a.id === 'breathe_stormlight')).toBeDefined();
      expect(abilities.find(a => a.id === 'enhance')).toBeDefined();
      expect(abilities.find(a => a.id === 'regenerate')).toBeDefined();

      // Should have 2 Singer forms + Change Form
      expect(abilities.find(a => a.id === 'nimbleform')).toBeDefined();
      expect(abilities.find(a => a.id === 'artform')).toBeDefined();
      expect(abilities.find(a => a.id === 'change_form')).toBeDefined();

      // Total should be at least 6
      expect(abilities.length).toBeGreaterThanOrEqual(6);
    });

    it('should handle multiple Singer form categories', () => {
      // Unlock multiple form categories
      applyTalentEffects(character, 'forms_of_finesse');
      applyTalentEffects(character, 'forms_of_wisdom');
      applyTalentEffects(character, 'forms_of_resolve');

      const abilities = character.getUniversalAbilities();
      const singerForms = abilities.filter(a => 
        a.source.includes('Singer Forms') && a.actionCost === 'passive'
      );

      // Should have 6 forms (2 from each category)
      expect(singerForms.length).toBe(6);
    });

    it('should handle Voidspren-bonded Singer unlocking destruction forms', () => {
      // Unlock tier 4 forms (requires Voidspren bond)
      applyTalentEffects(character, 'forms_of_destruction');

      const abilities = character.getUniversalAbilities();

      // Should have direform and stormform
      expect(abilities.find(a => a.id === 'direform')).toBeDefined();
      expect(abilities.find(a => a.id === 'stormform')).toBeDefined();

      // Should have Unleash Lightning
      expect(abilities.find(a => a.id === 'unleash_lightning')).toBeDefined();
    });
  });

  describe('Ability Properties Validation', () => {
    beforeEach(() => {
      character.radiantPath.grantSpren('Windrunner');
      character.radiantPath.speakIdeal(character.skills);
      applyTalentEffects(character, 'forms_of_finesse');
      applyTalentEffects(character, 'forms_of_destruction');
    });

    it('should have correct action costs for all abilities', () => {
      const abilities = character.getUniversalAbilities();

      abilities.forEach(ability => {
        expect(ability.actionCost).toBeDefined();
        expect(['passive', 'free', 'reaction', 'special', 1, 2, 3]).toContain(ability.actionCost);
      });
    });

    it('should have effects defined for all abilities', () => {
      const abilities = character.getUniversalAbilities();

      abilities.forEach(ability => {
        expect(ability.effects).toBeDefined();
        expect(ability.effects!.length).toBeGreaterThan(0);
      });
    });

    it('should have valid categories for all abilities', () => {
      const abilities = character.getUniversalAbilities();
      const validCategories = [
        'Radiant Universal',
        'Radiant Order Specific',
        'Item Granted',
        'Condition',
        'Special Rule',
        'Other'
      ];

      abilities.forEach(ability => {
        expect(validCategories).toContain(ability.category);
      });
    });

    it('should have sources defined for all abilities', () => {
      const abilities = character.getUniversalAbilities();

      abilities.forEach(ability => {
        expect(ability.source).toBeDefined();
        expect(ability.source.length).toBeGreaterThan(0);
      });
    });
  });

  describe('State Persistence', () => {
    it('should maintain unlocked forms across ability queries', () => {
      applyTalentEffects(character, 'forms_of_finesse');

      // Query multiple times
      const abilities1 = character.getUniversalAbilities();
      const abilities2 = character.getUniversalAbilities();

      expect(abilities1.length).toBe(abilities2.length);
      expect(abilities1.find(a => a.id === 'nimbleform')).toBeDefined();
      expect(abilities2.find(a => a.id === 'nimbleform')).toBeDefined();
    });

    it('should accumulate forms as talents are unlocked', () => {
      let abilities = character.getUniversalAbilities();
      const initialCount = abilities.length;

      applyTalentEffects(character, 'forms_of_finesse');
      abilities = character.getUniversalAbilities();
      expect(abilities.length).toBeGreaterThan(initialCount);

      const afterFinesseCount = abilities.length;

      applyTalentEffects(character, 'forms_of_wisdom');
      abilities = character.getUniversalAbilities();
      expect(abilities.length).toBeGreaterThan(afterFinesseCount);
    });
  });

  describe('Special Ability Conditions', () => {
    it('should only grant Unleash Lightning with stormform', () => {
      applyTalentEffects(character, 'forms_of_finesse');
      
      let abilities = character.getUniversalAbilities();
      expect(abilities.find(a => a.id === 'unleash_lightning')).toBeUndefined();

      applyTalentEffects(character, 'forms_of_destruction');
      abilities = character.getUniversalAbilities();
      expect(abilities.find(a => a.id === 'unleash_lightning')).toBeDefined();
    });

    it('should mark unconscious-usable abilities correctly', () => {
      character.radiantPath.grantSpren('Windrunner');
      character.radiantPath.speakIdeal(character.skills);

      const abilities = character.getUniversalAbilities();

      const breatheStormlight = abilities.find(a => a.id === 'breathe_stormlight');
      const regenerate = abilities.find(a => a.id === 'regenerate');
      const enhance = abilities.find(a => a.id === 'enhance');

      expect(breatheStormlight!.canUseWhileUnconscious).toBe(true);
      expect(regenerate!.canUseWhileUnconscious).toBe(true);
      expect(enhance!.canUseWhileUnconscious).toBeFalsy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty character gracefully', () => {
      const abilities = character.getUniversalAbilities();
      expect(abilities).toBeDefined();
      expect(Array.isArray(abilities)).toBe(true);
    });

    it('should handle duplicate form unlocks gracefully', () => {
      applyTalentEffects(character, 'forms_of_finesse');
      const firstCount = character.getUniversalAbilities().length;

      applyTalentEffects(character, 'forms_of_finesse');
      const secondCount = character.getUniversalAbilities().length;

      expect(firstCount).toBe(secondCount);
    });

    it('should handle unlocking all form categories', () => {
      const allFormTalents = [
        'forms_of_finesse',
        'forms_of_wisdom',
        'forms_of_resolve',
        'forms_of_destruction',
        'forms_of_expansion',
        'forms_of_mystery'
      ];

      allFormTalents.forEach(talent => {
        applyTalentEffects(character, talent);
      });

      const abilities = character.getUniversalAbilities();
      
      // Should have all 12 forms (from Singer Forms source)
      const singerFormPassives = abilities.filter(a => 
        a.source.includes('Singer Forms') && a.actionCost === 'passive'
      );
      expect(singerFormPassives.length).toBe(12);
      
      // Should have Change Form action
      const changeForm = abilities.find(a => a.id === 'change_form');
      expect(changeForm).toBeDefined();
      expect(changeForm?.actionCost).toBe(3);
      
      // Should have Unleash Lightning action (granted by stormform)
      const unleashLightning = abilities.find(a => a.id === 'unleash_lightning');
      expect(unleashLightning).toBeDefined();
      expect(unleashLightning?.actionCost).toBe(2);
      
      // Verify all 12 forms are present
      const formIds = [
        'nimbleform', 'artform',
        'meditationform', 'scholarform',
        'warform', 'workform',
        'direform', 'stormform',
        'decayform', 'envoyform',
        'nightform', 'relayform'
      ];
      
      formIds.forEach(formId => {
        expect(abilities.find(a => a.id === formId)).toBeDefined();
      });
    });
  });
});
