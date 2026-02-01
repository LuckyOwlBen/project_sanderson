import { TalentEffectParser } from './talentEffectParser';
import { TalentNode, ActionCostCode } from './talentInterface';

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

  describe('parseExpertiseGrantsFromTalent - Structured Data Migration', () => {
    
    it('should parse fixed expertise grants from killing_edge', () => {
      const talent: TalentNode = {
        id: 'killing_edge',
        name: 'Killing Edge',
        description: 'Test',
        actionCost: ActionCostCode.Passive,
        prerequisites: [],
        tier: 1,
        bonuses: [],
        expertiseGrants: [
          { type: 'fixed', expertises: ['Knives', 'Slings'] }
        ]
      };

      const grants = TalentEffectParser.parseExpertiseGrantsFromTalent(talent);
      
      expect(grants).toHaveLength(1);
      expect(grants[0].type).toBe('single');
      expect(grants[0].expertises).toEqual(['Knives', 'Slings']);
    });

    it('should parse choice from options in shard_training', () => {
      const talent: TalentNode = {
        id: 'shard_training',
        name: 'Shard Training',
        description: 'Test',
        actionCost: ActionCostCode.Special,
        prerequisites: [],
        tier: 1,
        bonuses: [],
        expertiseGrants: [
          { type: 'fixed', expertises: ['Shardplate'] },
          { type: 'choice', choiceCount: 1, options: ['Grandbows', 'Shardblades', 'Warhammers'] }
        ]
      };

      const grants = TalentEffectParser.parseExpertiseGrantsFromTalent(talent);
      
      expect(grants).toHaveLength(2);
      expect(grants[0].type).toBe('single');
      expect(grants[0].expertises).toEqual(['Shardplate']);
      expect(grants[1].type).toBe('choice');
      expect(grants[1].expertises).toEqual(['Grandbows', 'Shardblades', 'Warhammers']);
      expect(grants[1].choiceCount).toBe(1);
    });

    it('should parse category-based choices from combat_training', () => {
      const talent: TalentNode = {
        id: 'combat_training',
        name: 'Combat Training',
        description: 'Test',
        actionCost: ActionCostCode.Special,
        prerequisites: [],
        tier: 1,
        bonuses: [],
        expertiseGrants: [
          { type: 'category', choiceCount: 1, category: 'weapon' },
          { type: 'category', choiceCount: 1, category: 'armor' },
          { type: 'fixed', expertises: ['Military Life'] }
        ]
      };

      const grants = TalentEffectParser.parseExpertiseGrantsFromTalent(talent);
      
      expect(grants).toHaveLength(3);
      expect(grants[0].type).toBe('choice');
      expect(grants[0].expertises).toContain('Light Weaponry');
      expect(grants[0].expertises).toContain('Heavy Weaponry');
      expect(grants[1].type).toBe('choice');
      expect(grants[1].expertises).toContain('Armor Proficiency');
      expect(grants[2].type).toBe('single');
      expect(grants[2].expertises).toEqual(['Military Life']);
    });

    it('should parse single fixed expertise from lessons_in_patience', () => {
      const talent: TalentNode = {
        id: 'lessons_in_patience',
        name: 'Lessons in Patience',
        description: 'Test',
        actionCost: ActionCostCode.Passive,
        prerequisites: [],
        tier: 2,
        bonuses: [],
        expertiseGrants: [
          { type: 'fixed', expertises: ['Motivational Speech'] }
        ]
      };

      const grants = TalentEffectParser.parseExpertiseGrantsFromTalent(talent);
      
      expect(grants).toHaveLength(1);
      expect(grants[0].type).toBe('single');
      expect(grants[0].expertises).toEqual(['Motivational Speech']);
    });

    it('should fallback to text parsing when no structured data exists', () => {
      const talent: TalentNode = {
        id: 'legacy_talent',
        name: 'Legacy Talent',
        description: 'Test',
        actionCost: ActionCostCode.Passive,
        prerequisites: [],
        tier: 1,
        bonuses: [],
        otherEffects: ['Gain Sleight of Hand expertise']
      };

      const grants = TalentEffectParser.parseExpertiseGrantsFromTalent(talent);
      
      expect(grants).toHaveLength(1);
      expect(grants[0].type).toBe('single');
      expect(grants[0].expertises).toContain('Sleight of Hand');
    });

    it('should prefer structured data over otherEffects when both exist', () => {
      const talent: TalentNode = {
        id: 'hybrid_talent',
        name: 'Hybrid Talent',
        description: 'Test',
        actionCost: ActionCostCode.Passive,
        prerequisites: [],
        tier: 1,
        bonuses: [],
        expertiseGrants: [
          { type: 'fixed', expertises: ['Structured Expertise'] }
        ],
        otherEffects: ['Gain Text Expertise expertise']
      };

      const grants = TalentEffectParser.parseExpertiseGrantsFromTalent(talent);
      
      expect(grants).toHaveLength(1);
      expect(grants[0].expertises).toEqual(['Structured Expertise']);
    });
  });

  describe('Trait Grant Validation', () => {
    it('should store trait grants on killing_edge talent', () => {
      const talent: TalentNode = {
        id: 'killing_edge',
        name: 'Killing Edge',
        description: 'Test',
        actionCost: ActionCostCode.Passive,
        prerequisites: [],
        tier: 1,
        bonuses: [],
        expertiseGrants: [
          { type: 'fixed', expertises: ['Knives', 'Slings'] }
        ],
        traitGrants: [
          { targetItems: ['knife', 'sling'], traits: ['Deadly', 'Quickdraw'], expert: true }
        ]
      };

      expect(talent.traitGrants).toBeDefined();
      expect(talent.traitGrants).toHaveLength(1);
      expect(talent.traitGrants![0].targetItems).toEqual(['knife', 'sling']);
      expect(talent.traitGrants![0].traits).toEqual(['Deadly', 'Quickdraw']);
      expect(talent.traitGrants![0].expert).toBe(true);
    });
  });
});
