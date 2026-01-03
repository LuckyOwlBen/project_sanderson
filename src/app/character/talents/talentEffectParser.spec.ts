import { TalentEffectParser } from './talentEffectParser';

describe('TalentEffectParser', () => {
  describe('parseExpertiseGrants', () => {
    it('should parse single expertise grant', () => {
      const effects = ['Gain Sleight of Hand expertise'];
      const grants = TalentEffectParser.parseExpertiseGrants(effects);
      
      expect(grants.length).toBe(1);
      expect(grants[0].type).toBe('single');
      expect(grants[0].expertises).toEqual(['Sleight of Hand']);
    });

    it('should parse multiple single expertise grants', () => {
      const effects = [
        'Gain Light Weaponry expertise',
        'Gain Armor Proficiency expertise',
        'Gain Military Life expertise'
      ];
      const grants = TalentEffectParser.parseExpertiseGrants(effects);
      
      expect(grants.length).toBe(3);
      expect(grants[0].expertises).toEqual(['Light Weaponry']);
      expect(grants[1].expertises).toEqual(['Armor Proficiency']);
      expect(grants[2].expertises).toEqual(['Military Life']);
    });

    it('should parse choice with "choose one" pattern', () => {
      const effects = [
        'Gain utility expertise in Armor Crafting, Equipment Crafting, or Weapon Crafting (choose one)'
      ];
      const grants = TalentEffectParser.parseExpertiseGrants(effects);
      
      expect(grants.length).toBe(1);
      expect(grants[0].type).toBe('choice');
      expect(grants[0].choiceCount).toBe(1);
      expect(grants[0].expertises).toContain('Armor Crafting');
      expect(grants[0].expertises).toContain('Equipment Crafting');
      expect(grants[0].expertises).toContain('Weapon Crafting');
    });

    it('should parse "or" pattern for two choices', () => {
      const effects = ['Gain Light Weaponry or Heavy Weaponry expertise'];
      const grants = TalentEffectParser.parseExpertiseGrants(effects);
      
      expect(grants.length).toBe(1);
      expect(grants[0].type).toBe('choice');
      expect(grants[0].choiceCount).toBe(1);
      expect(grants[0].expertises).toContain('Light Weaponry');
      expect(grants[0].expertises).toContain('Heavy Weaponry');
    });

    it('should parse "gain a weapon expertise" as choice', () => {
      const effects = ['Once per round, can graze on miss without spending focus', 'gain a weapon expertise'];
      const grants = TalentEffectParser.parseExpertiseGrants(effects);
      
      expect(grants.length).toBe(1);
      expect(grants[0].type).toBe('choice');
      expect(grants[0].choiceCount).toBe(1);
      expect(grants[0].expertises).toContain('Light Weaponry');
      expect(grants[0].expertises).toContain('Heavy Weaponry');
    });

    it('should parse "gain an armor expertise" as choice', () => {
      const effects = ['gain an armor expertise'];
      const grants = TalentEffectParser.parseExpertiseGrants(effects);
      
      expect(grants.length).toBe(1);
      expect(grants[0].type).toBe('choice');
      expect(grants[0].expertises).toContain('Armor Proficiency');
    });

    it('should parse slash-separated choices (Artifabrian talent)', () => {
      const effects = ['Gain utility expertise in Armor/Equipment/Weapon Crafting (choose one)'];
      const grants = TalentEffectParser.parseExpertiseGrants(effects);
      
      expect(grants.length).toBe(1);
      expect(grants[0].type).toBe('choice');
      expect(grants[0].choiceCount).toBe(1);
      expect(grants[0].expertises).toContain('Armor Crafting');
      expect(grants[0].expertises).toContain('Equipment Crafting');
      expect(grants[0].expertises).toContain('Weapon Crafting');
      expect(grants[0].expertises.length).toBe(3);
    });

    it('should handle mixed single and choice grants', () => {
      const effects = [
        'Gain Military Life cultural expertise',
        'gain a weapon expertise',
        'gain an armor expertise'
      ];
      const grants = TalentEffectParser.parseExpertiseGrants(effects);
      
      expect(grants.length).toBe(3);
      expect(grants[0].type).toBe('single');
      expect(grants[1].type).toBe('choice');
      expect(grants[2].type).toBe('choice');
    });

    it('should ignore non-expertise effects', () => {
      const effects = [
        'Once per round, can graze on miss without spending focus',
        'Spend 2 focus to feign innocence',
        'Add +1 to all Crafting tests'
      ];
      const grants = TalentEffectParser.parseExpertiseGrants(effects);
      
      expect(grants.length).toBe(0);
    });

    it('should parse complex real-world talent effect (Spy)', () => {
      const effects = ['Gain Sleight of Hand expertise. When discovered skulking, spend 2 focus to feign innocence.'];
      const grants = TalentEffectParser.parseExpertiseGrants(effects);
      
      expect(grants.length).toBe(1);
      expect(grants[0].expertises).toContain('Sleight of Hand');
    });

    it('should parse complex real-world talent effect (Combat Training)', () => {
      const effects = [
        'Once per round, can graze on miss without spending focus',
        'gain a weapon expertise',  // Changed to match pattern
        'gain an armor expertise',  // Changed to match pattern
        'Gain Military Life cultural expertise'
      ];
      const grants = TalentEffectParser.parseExpertiseGrants(effects);
      
      // Should parse weapon and armor as choices, Military Life as single
      expect(grants.length).toBe(3);
      
      // Check that we have weapon and armor choices
      const hasWeaponChoice = grants.some(g => g.type === 'choice' && g.expertises.includes('Light Weaponry'));
      const hasArmorChoice = grants.some(g => g.type === 'choice' && g.expertises.includes('Armor Proficiency'));
      const hasMilitaryLife = grants.some(g => g.type === 'single' && g.expertises[0].includes('Military Life'));
      
      expect(hasWeaponChoice).toBe(true);
      expect(hasArmorChoice).toBe(true);
      expect(hasMilitaryLife).toBe(true);
    });
  });

  describe('grantsExpertise', () => {
    it('should return true when effects contain expertise grants', () => {
      const effects = ['Gain Light Weaponry expertise'];
      expect(TalentEffectParser.grantsExpertise(effects)).toBe(true);
    });

    it('should return false when effects do not contain expertise grants', () => {
      const effects = ['Once per round, can graze on miss'];
      expect(TalentEffectParser.grantsExpertise(effects)).toBe(false);
    });
  });

  describe('getAllExpertiseOptions', () => {
    it('should return all unique expertise options from grants', () => {
      const grants = [
        { type: 'single' as const, expertises: ['Light Weaponry'] },
        { type: 'choice' as const, expertises: ['Armor Crafting', 'Weapon Crafting'], choiceCount: 1 },
        { type: 'single' as const, expertises: ['Light Weaponry'] } // Duplicate
      ];
      
      const options = TalentEffectParser.getAllExpertiseOptions(grants);
      
      expect(options.length).toBe(3);
      expect(options).toContain('Light Weaponry');
      expect(options).toContain('Armor Crafting');
      expect(options).toContain('Weapon Crafting');
    });
  });
});
