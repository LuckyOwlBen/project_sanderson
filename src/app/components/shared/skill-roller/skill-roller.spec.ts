import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SkillRoller, SkillCheckResult, SkillOption } from './skill-roller';
import { Character } from '../../../character/character';
import { ExpertiseSourceHelper } from '../../../character/expertises/expertiseSource';
import { SkillType } from '../../../character/skills/skillTypes';

describe('SkillRoller', () => {
  let component: SkillRoller;
  let fixture: ComponentFixture<SkillRoller>;
  let character: Character;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillRoller]
    }).compileComponents();

    fixture = TestBed.createComponent(SkillRoller);
    component = fixture.componentInstance;
    
    // Create test character
    character = new Character();
    character.name = 'Test Character';
    character.attributes.setAttribute('strength', 3);
    character.attributes.setAttribute('intellect', 4);
    character.skills.setSkillRank(SkillType.ATHLETICS, 2);
    character.skills.setSkillRank(SkillType.STEALTH, 1);
    character.selectedExpertises = [
      ExpertiseSourceHelper.create('Blacksmithing', 'culture'),
      ExpertiseSourceHelper.create('Cooking', 'talent', 'talent-1')
    ];
    
    component.character = character;
    component.updateAvailableSkills(); // Manually trigger skills update for testing
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getAvailableSkills', () => {
    it('should return all regular skills', () => {
      const skills = component.getAvailableSkills();
      const regularSkills = skills.filter((s: SkillOption) => s.type === 'regular');
      expect(regularSkills.length).toBeGreaterThan(0);
    });

    it('should return surge skills', () => {
      const skills = component.getAvailableSkills();
      const surgeSkills = skills.filter((s: SkillOption) => s.type === 'surge');
      expect(surgeSkills.length).toBeGreaterThan(0);
    });

    it('should include expertise skills with Intellect as governing attribute', () => {
      const skills = component.getAvailableSkills();
      const expertiseSkills = skills.filter((s: SkillOption) => s.type === 'expertise');
      
      expect(expertiseSkills.length).toBe(2);
      expect(expertiseSkills[0].name).toBe('Blacksmithing');
      expect(expertiseSkills[0].associatedAttribute).toBe('Intellect');
      expect(expertiseSkills[0].attributeValue).toBe(4);
      expect(expertiseSkills[0].rank).toBe(1);
      expect(expertiseSkills[0].modifier).toBe(5); // 1 rank + 4 intellect
      
      expect(expertiseSkills[1].name).toBe('Cooking');
      expect(expertiseSkills[1].associatedAttribute).toBe('Intellect');
      expect(expertiseSkills[1].modifier).toBe(5);
    });

    it('should calculate correct modifiers for regular skills', () => {
      const skills = component.getAvailableSkills();
      const athletics = skills.find((s: SkillOption) => s.name === 'Athletics');
      
      expect(athletics).toBeDefined();
      expect(athletics!.rank).toBe(2);
      expect(athletics!.attributeValue).toBe(3); // Strength
      expect(athletics!.modifier).toBe(5); // 2 rank + 3 strength
    });

    it('should sort skills alphabetically', () => {
      const skills = component.getAvailableSkills();
      const names = skills.map((s: SkillOption) => s.name);
      const sortedNames = [...names].sort();
      
      expect(names).toEqual(sortedNames);
    });

    it('should handle character with no expertises', () => {
      character.selectedExpertises = [];
      component.updateAvailableSkills();
      const skills = component.getAvailableSkills();
      const expertiseSkills = skills.filter((s: SkillOption) => s.type === 'expertise');
      
      expect(expertiseSkills.length).toBe(0);
    });

    it('should return empty array when no character', () => {
      component.character = null;
      component.updateAvailableSkills();
      const skills = component.getAvailableSkills();
      
      expect(skills).toEqual([]);
    });
  });

  describe('rollSkillCheck', () => {
    beforeEach(() => {
      const skills = component.getAvailableSkills();
      component.selectedSkill = skills.find((s: SkillOption) => s.name === 'Athletics')!;
    });

    it('should generate a result with d20 roll between 1 and 20', () => {
      component.rollSkillCheck();
      
      expect(component.lastResult).toBeDefined();
      expect(component.lastResult!.roll).toBeGreaterThanOrEqual(1);
      expect(component.lastResult!.roll).toBeLessThanOrEqual(20);
    });

    it('should calculate total as roll + modifier', () => {
      // Mock Math.random to return specific value
      const rollValue = 15;
      vi.spyOn(Math, 'random').mockReturnValue((rollValue - 1) / 20);
      
      component.rollSkillCheck();
      
      expect(component.lastResult!.roll).toBe(rollValue);
      expect(component.lastResult!.total).toBe(rollValue + component.selectedSkill!.modifier);
      
      vi.restoreAllMocks();
    });

    it('should emit skillChecked event', () => {
      const emitSpy = vi.spyOn(component.skillChecked, 'emit');
      
      component.rollSkillCheck();
      
      expect(emitSpy).toHaveBeenCalledWith(component.lastResult);
    });

    it('should include breakdown in result', () => {
      component.rollSkillCheck();
      
      expect(component.lastResult!.breakdown).toContain('d20');
      expect(component.lastResult!.breakdown).toContain(`${component.selectedSkill!.modifier}`);
      expect(component.lastResult!.breakdown).toContain('Rank');
      expect(component.lastResult!.breakdown).toContain(component.selectedSkill!.associatedAttribute);
    });

    it('should work with expertise skills', () => {
      const skills = component.getAvailableSkills();
      component.selectedSkill = skills.find(s => s.name === 'Blacksmithing')!;
      
      component.rollSkillCheck();
      
      expect(component.lastResult).toBeDefined();
      expect(component.lastResult!.skill.type).toBe('expertise');
      expect(component.lastResult!.modifier).toBe(5); // 1 rank + 4 intellect
    });

    it('should not roll when no skill selected', () => {
      component.selectedSkill = null;
      component.rollSkillCheck();
      
      expect(component.lastResult).toBeNull();
    });
  });

  describe('clearResult', () => {
    it('should clear the last result', () => {
      const skills = component.getAvailableSkills();
      component.selectedSkill = skills.find((s: SkillOption) => s.name === 'Blacksmithing')!;
      component.rollSkillCheck();
      
      expect(component.lastResult).toBeDefined();
      
      component.clearResult();
      
      expect(component.lastResult).toBeNull();
    });
  });

  describe('getSkillIcon', () => {
    it('should return correct icon for regular skills', () => {
      const skill: SkillOption = {
        name: 'Athletics',
        type: 'regular',
        modifier: 5,
        rank: 2,
        attributeValue: 3,
        associatedAttribute: 'Strength',
        rawSkillType: SkillType.ATHLETICS
      };
      
      expect(component.getSkillIcon(skill)).toBe('🎯');
    });

    it('should return correct icon for surge skills', () => {
      const skill: SkillOption = {
        name: 'Adhesion',
        type: 'surge',
        modifier: 3,
        rank: 1,
        attributeValue: 2,
        associatedAttribute: 'Willpower',
        rawSkillType: SkillType.ADHESION
      };
      
      expect(component.getSkillIcon(skill)).toBe('⚡');
    });

    it('should return correct icon for expertise skills', () => {
      const skill: SkillOption = {
        name: 'Blacksmithing',
        type: 'expertise',
        modifier: 5,
        rank: 1,
        attributeValue: 4,
        associatedAttribute: 'Intellect',
        expertiseName: 'Blacksmithing'
      };
      
      expect(component.getSkillIcon(skill)).toBe('📚');
    });
  });

  describe('getSkillTypeClass', () => {
    it('should return correct class for each skill type', () => {
      const regularSkill: SkillOption = { name: 'Test', type: 'regular', modifier: 0, rank: 0, attributeValue: 0, associatedAttribute: 'Strength' };
      const surgeSkill: SkillOption = { name: 'Test', type: 'surge', modifier: 0, rank: 0, attributeValue: 0, associatedAttribute: 'Willpower' };
      const expertiseSkill: SkillOption = { name: 'Test', type: 'expertise', modifier: 0, rank: 0, attributeValue: 0, associatedAttribute: 'Intellect' };
      
      expect(component.getSkillTypeClass(regularSkill)).toBe('skill-regular');
      expect(component.getSkillTypeClass(surgeSkill)).toBe('skill-surge');
      expect(component.getSkillTypeClass(expertiseSkill)).toBe('skill-expertise');
    });
  });

  describe('Integration: Expertise removal impact', () => {
    it('should remove expertise from available skills when expertise removed', () => {
      let skills = component.getAvailableSkills();
      let expertiseSkills = skills.filter((s: any) => s.type === 'expertise');
      expect(expertiseSkills.length).toBe(2);
      
      // Remove an expertise
      character.selectedExpertises = character.selectedExpertises.filter((e: any) => e.name !== 'Blacksmithing');
      component.updateAvailableSkills();
      
      skills = component.getAvailableSkills();
      expertiseSkills = skills.filter((s: any) => s.type === 'expertise');
      expect(expertiseSkills.length).toBe(1);
      expect(expertiseSkills[0].name).toBe('Cooking');
    });
  });
});
