import { Character } from './character';
import { ExpertiseSourceHelper } from './expertises/expertiseSource';

describe('Character - Expertise as Skill', () => {
  let character: Character;

  beforeEach(() => {
    character = new Character();
    character.name = 'Test Character';
  });

  describe('getExpertiseSkills', () => {
    it('should return empty array when no expertises selected', () => {
      expect(character.getExpertiseSkills()).toEqual([]);
    });

    it('should return expertise names from all sources', () => {
      character.selectedExpertises = [
        ExpertiseSourceHelper.create('Blacksmithing', 'culture'),
        ExpertiseSourceHelper.create('Cooking', 'talent', 'talent-1'),
        ExpertiseSourceHelper.create('Cartography', 'gm')
      ];

      const expertiseSkills = character.getExpertiseSkills();
      expect(expertiseSkills).toHaveLength(3);
      expect(expertiseSkills).toContain('Blacksmithing');
      expect(expertiseSkills).toContain('Cooking');
      expect(expertiseSkills).toContain('Cartography');
    });

    it('should maintain order of expertises', () => {
      character.selectedExpertises = [
        ExpertiseSourceHelper.create('Zymology', 'culture'),
        ExpertiseSourceHelper.create('Archery', 'talent', 'talent-1'),
        ExpertiseSourceHelper.create('Medicine', 'manual')
      ];

      const expertiseSkills = character.getExpertiseSkills();
      expect(expertiseSkills).toEqual(['Zymology', 'Archery', 'Medicine']);
    });
  });

  describe('hasExpertise', () => {
    beforeEach(() => {
      character.selectedExpertises = [
        ExpertiseSourceHelper.create('Blacksmithing', 'culture'),
        ExpertiseSourceHelper.create('Cooking', 'talent', 'talent-1')
      ];
    });

    it('should return true for existing expertise', () => {
      expect(character.hasExpertise('Blacksmithing')).toBe(true);
      expect(character.hasExpertise('Cooking')).toBe(true);
    });

    it('should return false for non-existing expertise', () => {
      expect(character.hasExpertise('Cartography')).toBe(false);
      expect(character.hasExpertise('Medicine')).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(character.hasExpertise('blacksmithing')).toBe(false);
      expect(character.hasExpertise('COOKING')).toBe(false);
    });

    it('should handle empty expertise list', () => {
      character.selectedExpertises = [];
      expect(character.hasExpertise('Blacksmithing')).toBe(false);
    });
  });

  describe('getExpertiseRank', () => {
    beforeEach(() => {
      character.selectedExpertises = [
        ExpertiseSourceHelper.create('Blacksmithing', 'culture'),
        ExpertiseSourceHelper.create('Cooking', 'talent', 'talent-1')
      ];
    });

    it('should return 1 for existing expertise', () => {
      expect(character.getExpertiseRank('Blacksmithing')).toBe(1);
      expect(character.getExpertiseRank('Cooking')).toBe(1);
    });

    it('should return 0 for non-existing expertise', () => {
      expect(character.getExpertiseRank('Cartography')).toBe(0);
      expect(character.getExpertiseRank('Medicine')).toBe(0);
    });

    it('should be case-sensitive', () => {
      expect(character.getExpertiseRank('blacksmithing')).toBe(0);
      expect(character.getExpertiseRank('COOKING')).toBe(0);
    });

    it('should handle empty expertise list', () => {
      character.selectedExpertises = [];
      expect(character.getExpertiseRank('Blacksmithing')).toBe(0);
    });

    it('should always return 1 or 0 (no multi-rank expertises)', () => {
      character.selectedExpertises = [
        ExpertiseSourceHelper.create('Blacksmithing', 'culture'),
        ExpertiseSourceHelper.create('Blacksmithing', 'talent', 'talent-1') // Duplicate (shouldn't happen but testing)
      ];
      
      // First match should return 1
      expect(character.getExpertiseRank('Blacksmithing')).toBe(1);
    });
  });

  describe('Integration: Expertise as Skill Check', () => {
    beforeEach(() => {
      character.selectedExpertises = [
        ExpertiseSourceHelper.create('Blacksmithing', 'culture'),
        ExpertiseSourceHelper.create('Cooking', 'talent', 'talent-1')
      ];
      character.attributes.setAttribute('intellect', 3);
    });

    it('should calculate expertise skill total (rank + intellect)', () => {
      const expertiseRank = character.getExpertiseRank('Blacksmithing');
      const intellectValue = character.attributes.getAttribute('intellect');
      const total = expertiseRank + intellectValue;

      expect(total).toBe(4); // 1 (rank) + 3 (intellect)
    });

    it('should return 0 total for non-existent expertise', () => {
      const expertiseRank = character.getExpertiseRank('Medicine');
      const intellectValue = character.attributes.getAttribute('intellect');
      const total = expertiseRank + intellectValue;

      expect(total).toBe(3); // 0 (rank) + 3 (intellect) - character doesn't have the expertise
    });

    it('should support multiple expertises with same governing attribute', () => {
      const blacksmithingTotal = character.getExpertiseRank('Blacksmithing') + 
                                 character.attributes.getAttribute('intellect');
      const cookingTotal = character.getExpertiseRank('Cooking') + 
                          character.attributes.getAttribute('intellect');

      expect(blacksmithingTotal).toBe(4);
      expect(cookingTotal).toBe(4);
    });
  });

  describe('Expertise removal impact on skill checks', () => {
    it('should make expertise unavailable as skill after removal', () => {
      character.selectedExpertises = [
        ExpertiseSourceHelper.create('Blacksmithing', 'culture')
      ];

      expect(character.hasExpertise('Blacksmithing')).toBe(true);
      expect(character.getExpertiseRank('Blacksmithing')).toBe(1);

      // Remove expertise
      character.selectedExpertises = [];

      expect(character.hasExpertise('Blacksmithing')).toBe(false);
      expect(character.getExpertiseRank('Blacksmithing')).toBe(0);
      expect(character.getExpertiseSkills()).toEqual([]);
    });
  });
});
