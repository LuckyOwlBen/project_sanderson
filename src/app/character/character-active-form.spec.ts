import { Character } from './character';
import { applyTalentEffects } from './talents/talentEffects';

describe('Character Active Form', () => {
  let character: Character;

  beforeEach(() => {
    character = new Character();
    character.name = 'Test Singer';
  });

  describe('Active Form Tracking', () => {
    it('should start with no active form', () => {
      expect(character.activeForm).toBeUndefined();
    });

    it('should allow setting an active form', () => {
      applyTalentEffects(character, 'forms_of_finesse');
      
      character.setActiveForm('nimbleform');
      
      expect(character.activeForm).toBe('nimbleform');
    });

    it('should allow clearing the active form', () => {
      applyTalentEffects(character, 'forms_of_finesse');
      character.setActiveForm('nimbleform');
      
      character.setActiveForm(undefined);
      
      expect(character.activeForm).toBeUndefined();
    });

    it('should only allow setting forms that are unlocked', () => {
      // Try to set a form that hasn't been unlocked
      expect(() => character.setActiveForm('nimbleform')).toThrow();
      
      // Now unlock it
      applyTalentEffects(character, 'forms_of_finesse');
      
      // Should work now
      expect(() => character.setActiveForm('nimbleform')).not.toThrow();
    });

    it('should get the list of available forms for selection', () => {
      applyTalentEffects(character, 'forms_of_finesse');
      applyTalentEffects(character, 'forms_of_wisdom');
      
      const availableForms = character.getAvailableForms();
      
      expect(availableForms.length).toBe(4); // 2 from each category
      expect(availableForms.find(f => f.id === 'nimbleform')).toBeDefined();
      expect(availableForms.find(f => f.id === 'artform')).toBeDefined();
      expect(availableForms.find(f => f.id === 'meditationform')).toBeDefined();
      expect(availableForms.find(f => f.id === 'scholarform')).toBeDefined();
    });

    it('should return empty array when no forms unlocked', () => {
      const availableForms = character.getAvailableForms();
      expect(availableForms).toEqual([]);
    });
  });

  describe('Active Form Bonuses', () => {
    it('should provide bonuses from nimbleform when active', () => {
      applyTalentEffects(character, 'forms_of_finesse');
      character.setActiveForm('nimbleform');
      
      const bonuses = character.getActiveFormBonuses();
      
      expect(bonuses.length).toBeGreaterThan(0);
      expect(bonuses.some(b => b.target === 'agility')).toBe(true);
    });

    it('should provide bonuses from warform when active', () => {
      applyTalentEffects(character, 'forms_of_resolve');
      character.setActiveForm('warform');
      
      const bonuses = character.getActiveFormBonuses();
      
      expect(bonuses.length).toBeGreaterThan(0);
      expect(bonuses.some(b => b.target === 'strength')).toBe(true);
      expect(bonuses.some(b => b.target === 'vitality')).toBe(true);
    });

    it('should not provide bonuses when no form is active', () => {
      applyTalentEffects(character, 'forms_of_finesse');
      
      const bonuses = character.getActiveFormBonuses();
      
      expect(bonuses).toEqual([]);
    });

    it('should integrate with existing bonus system', () => {
      applyTalentEffects(character, 'forms_of_resolve');
      character.setActiveForm('warform');
      
      // Warform should provide attribute bonuses through bonus module
      const strengthBonus = character.bonuses.bonuses.getBonusesFor('attribute' as any, 'strength');
      expect(strengthBonus).toBeGreaterThanOrEqual(2);
    });

    it('should remove bonuses when form is deactivated', () => {
      applyTalentEffects(character, 'forms_of_finesse');
      character.setActiveForm('nimbleform');
      
      let bonuses = character.getActiveFormBonuses();
      expect(bonuses.length).toBeGreaterThan(0);
      
      character.setActiveForm(undefined);
      
      bonuses = character.getActiveFormBonuses();
      expect(bonuses).toEqual([]);
    });

    it('should switch bonuses when changing forms', () => {
      applyTalentEffects(character, 'forms_of_finesse');
      character.setActiveForm('nimbleform');
      
      let bonuses = character.getActiveFormBonuses();
      expect(bonuses.some(b => b.target === 'agility')).toBe(true);
      
      character.setActiveForm('artform');
      
      bonuses = character.getActiveFormBonuses();
      expect(bonuses.some(b => b.target === 'agility')).toBe(false);
      expect(bonuses.some(b => b.target === 'presence')).toBe(true);
    });
  });

  describe('Form Metadata', () => {
    it('should provide form name for display', () => {
      applyTalentEffects(character, 'forms_of_finesse');
      character.setActiveForm('nimbleform');
      
      const form = character.getActiveFormInfo();
      
      expect(form?.name).toBe('Nimbleform');
    });

    it('should provide form description', () => {
      applyTalentEffects(character, 'forms_of_finesse');
      character.setActiveForm('nimbleform');
      
      const form = character.getActiveFormInfo();
      
      expect(form?.description).toBeDefined();
      expect(form?.description.length).toBeGreaterThan(0);
    });

    it('should return undefined when no form is active', () => {
      const form = character.getActiveFormInfo();
      expect(form).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle unlocking form while it is active', () => {
      applyTalentEffects(character, 'forms_of_finesse');
      character.setActiveForm('nimbleform');
      
      // Unlock more forms
      applyTalentEffects(character, 'forms_of_wisdom');
      
      // Active form should still be nimbleform
      expect(character.activeForm).toBe('nimbleform');
    });

    it('should preserve active form when getting available forms', () => {
      applyTalentEffects(character, 'forms_of_finesse');
      character.setActiveForm('nimbleform');
      
      const forms = character.getAvailableForms();
      
      expect(forms.length).toBeGreaterThan(0);
      expect(character.activeForm).toBe('nimbleform');
    });
  });
});
