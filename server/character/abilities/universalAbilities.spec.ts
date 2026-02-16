import { 
  UniversalAbility, 
  getAvailableAbilities, 
  getSingerFormAbilities,
  formatActionCost,
  RADIANT_UNIVERSAL_ABILITIES,
  SINGER_FORMS,
  SINGER_FORM_ABILITIES
} from './universalAbilities';

describe('Universal Abilities', () => {
  describe('RADIANT_UNIVERSAL_ABILITIES', () => {
    it('should contain Breathe Stormlight, Enhance, and Regenerate', () => {
      expect(RADIANT_UNIVERSAL_ABILITIES).toHaveLength(3);
      
      const abilityIds = RADIANT_UNIVERSAL_ABILITIES.map(a => a.id);
      expect(abilityIds).toContain('breathe_stormlight');
      expect(abilityIds).toContain('enhance');
      expect(abilityIds).toContain('regenerate');
    });

    it('should have Breathe Stormlight with 2 action cost', () => {
      const breatheStormlight = RADIANT_UNIVERSAL_ABILITIES.find(a => a.id === 'breathe_stormlight');
      expect(breatheStormlight).toBeDefined();
      expect(breatheStormlight!.actionCost).toBe(2);
      expect(breatheStormlight!.canUseWhileUnconscious).toBe(true);
    });

    it('should have Enhance with Investiture cost', () => {
      const enhance = RADIANT_UNIVERSAL_ABILITIES.find(a => a.id === 'enhance');
      expect(enhance).toBeDefined();
      expect(enhance!.actionCost).toBe(1);
      expect(enhance!.resourceCost).toBeDefined();
      expect(enhance!.resourceCost!.resourceType).toBe('investiture');
      expect(enhance!.resourceCost!.amount).toBe(1);
    });

    it('should have Regenerate as free action', () => {
      const regenerate = RADIANT_UNIVERSAL_ABILITIES.find(a => a.id === 'regenerate');
      expect(regenerate).toBeDefined();
      expect(regenerate!.actionCost).toBe('free');
      expect(regenerate!.canUseWhileUnconscious).toBe(true);
    });
  });

  describe('SINGER_FORMS', () => {
    it('should contain all 13 Singer forms', () => {
      expect(SINGER_FORMS).toHaveLength(13);
      
      const formIds = SINGER_FORMS.map(f => f.id);
      expect(formIds).toContain('nimbleform');
      expect(formIds).toContain('artform');
      expect(formIds).toContain('meditationform');
      expect(formIds).toContain('scholarform');
      expect(formIds).toContain('warform');
      expect(formIds).toContain('workform');
      expect(formIds).toContain('direform');
      expect(formIds).toContain('stormform');
      expect(formIds).toContain('envoyform');
      expect(formIds).toContain('relayform');
      expect(formIds).toContain('decayform');
      expect(formIds).toContain('nightform');
    });

    it('should have all forms as passive abilities', () => {
      SINGER_FORMS.forEach(form => {
        expect(form.actionCost).toBe('passive');
      });
    });

    it('should have correct effects for nimbleform', () => {
      const nimbleform = SINGER_FORMS.find(f => f.id === 'nimbleform');
      expect(nimbleform).toBeDefined();
      expect(nimbleform!.effects).toContain('Speed +1');
      expect(nimbleform!.effects).toContain('Focus +2');
    });

    it('should have correct effects for stormform', () => {
      const stormform = SINGER_FORMS.find(f => f.id === 'stormform');
      expect(stormform).toBeDefined();
      expect(stormform!.effects).toContain('Strength +1');
      expect(stormform!.effects).toContain('Speed +1');
      expect(stormform!.effects).toContain('Physical Deflect +1');
      expect(stormform!.effects).toContain('Grants Unleash Lightning ability (see below)');
    });
  });

  describe('SINGER_FORM_ABILITIES', () => {
    it('should contain Change Form and Unleash Lightning', () => {
      expect(SINGER_FORM_ABILITIES).toHaveLength(2);
      
      const abilityIds = SINGER_FORM_ABILITIES.map(a => a.id);
      expect(abilityIds).toContain('change_form');
      expect(abilityIds).toContain('unleash_lightning');
    });

    it('should have Change Form with 3 action cost', () => {
      const changeForm = SINGER_FORM_ABILITIES.find(a => a.id === 'change_form');
      expect(changeForm).toBeDefined();
      expect(changeForm!.actionCost).toBe(3);
    });

    it('should have Unleash Lightning with resource cost', () => {
      const unleashLightning = SINGER_FORM_ABILITIES.find(a => a.id === 'unleash_lightning');
      expect(unleashLightning).toBeDefined();
      expect(unleashLightning!.actionCost).toBe(2);
      expect(unleashLightning!.resourceCost).toBeDefined();
      expect(unleashLightning!.resourceCost!.resourceType).toBe('focus');
    });
  });

  describe('getAvailableAbilities', () => {
    it('should return empty array when First Ideal not spoken', () => {
      const abilities = getAvailableAbilities(false);
      expect(abilities).toEqual([]);
    });

    it('should return Radiant abilities when First Ideal spoken', () => {
      const abilities = getAvailableAbilities(true);
      expect(abilities).toHaveLength(3);
      expect(abilities).toEqual(RADIANT_UNIVERSAL_ABILITIES);
    });
  });

  describe('getSingerFormAbilities', () => {
    it('should return empty array when no forms unlocked', () => {
      const abilities = getSingerFormAbilities([]);
      expect(abilities).toEqual([]);
    });

    it('should include Change Form when any form is unlocked', () => {
      const abilities = getSingerFormAbilities(['nimbleform']);
      
      const changeForm = abilities.find(a => a.id === 'change_form');
      expect(changeForm).toBeDefined();
    });

    it('should return correct forms when multiple forms unlocked', () => {
      const abilities = getSingerFormAbilities(['nimbleform', 'artform']);
      
      expect(abilities.length).toBeGreaterThanOrEqual(3); // 2 forms + change form
      expect(abilities.find(a => a.id === 'nimbleform')).toBeDefined();
      expect(abilities.find(a => a.id === 'artform')).toBeDefined();
      expect(abilities.find(a => a.id === 'change_form')).toBeDefined();
    });

    it('should include Unleash Lightning when stormform unlocked', () => {
      const abilities = getSingerFormAbilities(['stormform']);
      
      expect(abilities.find(a => a.id === 'stormform')).toBeDefined();
      expect(abilities.find(a => a.id === 'unleash_lightning')).toBeDefined();
    });

    it('should not include Unleash Lightning for other forms', () => {
      const abilities = getSingerFormAbilities(['nimbleform', 'warform']);
      
      expect(abilities.find(a => a.id === 'unleash_lightning')).toBeUndefined();
    });

    it('should handle all Forms of Finesse', () => {
      const abilities = getSingerFormAbilities(['nimbleform', 'artform']);
      
      expect(abilities.find(a => a.id === 'nimbleform')).toBeDefined();
      expect(abilities.find(a => a.id === 'artform')).toBeDefined();
    });

    it('should handle all Forms of Destruction', () => {
      const abilities = getSingerFormAbilities(['direform', 'stormform']);
      
      expect(abilities.find(a => a.id === 'direform')).toBeDefined();
      expect(abilities.find(a => a.id === 'stormform')).toBeDefined();
      expect(abilities.find(a => a.id === 'unleash_lightning')).toBeDefined();
    });
  });

  describe('formatActionCost', () => {
    it('should format numeric action costs', () => {
      expect(formatActionCost(1)).toBe('1 Action');
      expect(formatActionCost(2)).toBe('2 Actions');
      expect(formatActionCost(3)).toBe('3 Actions');
    });

    it('should format free action', () => {
      expect(formatActionCost('free')).toBe('Free Action');
    });

    it('should format reaction', () => {
      expect(formatActionCost('reaction')).toBe('Reaction');
    });

    it('should format special', () => {
      expect(formatActionCost('special')).toBe('Special');
    });

    it('should format passive', () => {
      expect(formatActionCost('passive')).toBe('Passive');
    });
  });
});
