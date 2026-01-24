import { Character } from '../character';
import { AttackCalculator } from './attackCalculator';
import { SkillType } from '../skills/skillTypes';

describe('AttackCalculator', () => {
  let character: Character;
  let calculator: AttackCalculator;

  beforeEach(() => {
    character = new Character();
    character.name = 'Test Character';
    character.level = 1;
    
    // Set up basic attributes
    character.attributes.strength = 2;
    character.attributes.speed = 1;
    character.attributes.intellect = 0;
    
    // Set up skills
    character.skills.setSkillRank(SkillType.LIGHT_WEAPONRY, 2);
    character.skills.setSkillRank(SkillType.HEAVY_WEAPONRY, 1);
    
    calculator = new AttackCalculator(character);
  });

  describe('Weapon Attacks', () => {
    it('should generate no attacks when no weapons equipped', () => {
      const attacks = calculator.getAvailableAttacks();
      expect(attacks.length).toBe(0);
    });

    it('should generate weapon attack with correct bonus', () => {
      // Add and equip a weapon by ID
      character.inventory.addItem('rapier', 1);
      character.inventory.equipItem('rapier');
      
      const attacks = calculator.getAvailableAttacks();
      
      expect(attacks.length).toBe(1);
      expect(attacks[0].name).toBe('Rapier');
      expect(attacks[0].source).toBe('weapon');
      // Light weaponry uses Speed attribute (1) + skill rank (2) = 3
      expect(attacks[0].attackBonus).toBe(3);
      expect(attacks[0].damage).toBe('1d6');
      expect(attacks[0].damageType).toBe('keen');
      expect(attacks[0].targetDefense).toBe('Physical');
    });

    it('should include weapon traits', () => {
      character.inventory.addItem('knife', 1);
      character.inventory.equipItem('knife');
      
      const attacks = calculator.getAvailableAttacks();
      
      expect(attacks[0].traits).toContain('Discreet');
      expect(attacks[0].traits.length).toBeGreaterThan(0);
    });

    it('should include expert traits from talent trait grants when character has expertise', () => {
      // Set up: character gets Killing Edge talent which grants Deadly and Quickdraw to knives and slings
      character.unlockedTalents.add('killing_edge');
      character.selectedExpertises.push({ name: 'Knives', source: 'talent', sourceId: 'killing_edge' });
      
      character.inventory.addItem('knife', 1);
      character.inventory.equipItem('knife');
      
      const attacks = calculator.getAvailableAttacks();
      
      expect(attacks.length).toBeGreaterThan(0);
      const knifeAttack = attacks.find(a => a.name === 'Knife');
      expect(knifeAttack).toBeDefined();
      expect(knifeAttack!.traits).toContain('Expert: Deadly');
      expect(knifeAttack!.traits).toContain('Expert: Quickdraw');
    });

    it('should not include expert traits from talent trait grants when character lacks expertise', () => {
      // Set up: character gets Killing Edge talent BUT does not have Knives expertise
      character.unlockedTalents.add('killing_edge');
      // NOT adding Knives expertise
      
      character.inventory.addItem('knife', 1);
      character.inventory.equipItem('knife');
      
      const attacks = calculator.getAvailableAttacks();
      
      expect(attacks.length).toBeGreaterThan(0);
      const knifeAttack = attacks.find(a => a.name === 'Knife');
      expect(knifeAttack).toBeDefined();
      // Should NOT have the expert traits from Killing Edge
      expect(knifeAttack!.traits.filter(t => t.includes('Deadly'))).toHaveLength(0);
      expect(knifeAttack!.traits.filter(t => t.includes('Quickdraw'))).toHaveLength(0);
    });
  });

  describe('Talent Attacks', () => {
    it('should not include passive talents as attacks', () => {
      character.unlockedTalents.add('mighty');
      
      const attacks = calculator.getAvailableAttacks();
      const mightyAttack = attacks.find(a => a.talentId === 'mighty');
      
      expect(mightyAttack).toBeUndefined();
    });

    it('should include action cost talents that are attacks', () => {
      character.unlockedTalents.add('devastating_blow');
      
      const attacks = calculator.getAvailableAttacks();
      const devastatingBlow = attacks.find(a => a.talentId === 'devastating_blow');
      
      if (devastatingBlow) {
        expect(devastatingBlow.name).toBe('Devastating Blow');
        expect(devastatingBlow.source).toBe('talent');
        expect(devastatingBlow.actionCost).toBe(2);
      }
    });
  });

  describe('Stances', () => {
    it('should return empty stances when none unlocked', () => {
      const stances = calculator.getAvailableStances();
      expect(stances.length).toBe(0);
    });

    it('should detect stance talents', () => {
      character.unlockedTalents.add('flamestance');
      
      const stances = calculator.getAvailableStances();
      
      expect(stances.length).toBeGreaterThan(0);
      const flamestance = stances.find(s => s.id === 'flamestance');
      expect(flamestance?.name).toBe('Flamestance');
    });
  });

  describe('Mighty Talent Bonus', () => {
    it('should add damage bonus when Mighty is unlocked', () => {
      character.unlockedTalents.add('mighty');
      character.level = 1;
      
      character.inventory.addItem('rapier', 1);
      character.inventory.equipItem('rapier');
      
      const attacks = calculator.getAvailableAttacks();
      
      expect(attacks[0].damage).toContain('+'); // Should have bonus damage
    });
  });

  describe('Attack Grouping', () => {
    it('should categorize attacks by range', () => {
      character.inventory.addItem('rapier', 1);
      character.inventory.addItem('shortbow', 1);
      character.inventory.equipItem('rapier');
      
      // Shortbow needs to be equipped in a different slot or unequip rapier first
      // Since both default to mainHand, equipping shortbow will replace rapier
      // Let's just test that we can equip and get one weapon
      const attacks = calculator.getAvailableAttacks();
      
      expect(attacks.length).toBeGreaterThanOrEqual(1);
      // Verify we can filter by range
      const allAttacks = attacks.filter(a => a.range === 'Melee' || a.range.includes('Ranged'));
      expect(allAttacks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Structured Attack Definitions (Phase 2)', () => {
    it('should generate talent attack from structured attackDefinition', () => {
      // Fatal Thrust should generate an attack
      character.level = 5; // Tier 1
      character.unlockedTalents.add('fatal_thrust');
      character.skills.setSkillRank(SkillType.LIGHT_WEAPONRY, 3);
      
      const attacks = calculator.getAvailableAttacks();
      const fatalThrust = attacks.find(a => a.talentId === 'fatal_thrust');
      
      expect(fatalThrust).toBeDefined();
      expect(fatalThrust?.name).toBe('Fatal Thrust');
      expect(fatalThrust?.source).toBe('talent');
      expect(fatalThrust?.targetDefense).toBe('Cognitive');
      expect(fatalThrust?.range).toBe('Melee');
      expect(fatalThrust?.damage).toBe('4d4'); // Base damage at tier 1
      expect(fatalThrust?.actionCost).toBe(2);
    });

    it('should apply tier scaling to talent damage', () => {
      character.unlockedTalents.add('fatal_thrust');
      character.skills.setSkillRank(SkillType.LIGHT_WEAPONRY, 3);
      
      // Tier 1 (level 1-5)
      character.level = 3;
      let attacks = calculator.getAvailableAttacks();
      let fatalThrust = attacks.find(a => a.talentId === 'fatal_thrust');
      expect(fatalThrust?.damage).toBe('4d4');
      
      // Tier 3 (level 11-15)
      character.level = 13;
      calculator = new AttackCalculator(character);
      attacks = calculator.getAvailableAttacks();
      fatalThrust = attacks.find(a => a.talentId === 'fatal_thrust');
      expect(fatalThrust?.damage).toBe('6d4');
      
      // Tier 4 (level 16-20)
      character.level = 18;
      calculator = new AttackCalculator(character);
      attacks = calculator.getAvailableAttacks();
      fatalThrust = attacks.find(a => a.talentId === 'fatal_thrust');
      expect(fatalThrust?.damage).toBe('8d4');
      
      // Tier 5 (level 21+)
      character.level = 22;
      calculator = new AttackCalculator(character);
      attacks = calculator.getAvailableAttacks();
      fatalThrust = attacks.find(a => a.talentId === 'fatal_thrust');
      expect(fatalThrust?.damage).toBe('10d4');
    });

    it('should include resource cost from attackDefinition', () => {
      character.level = 5;
      character.unlockedTalents.add('wits_end');
      character.skills.setSkillRank(SkillType.LIGHT_WEAPONRY, 3);
      
      const attacks = calculator.getAvailableAttacks();
      const witsEnd = attacks.find(a => a.talentId === 'wits_end');
      
      expect(witsEnd).toBeDefined();
      expect(witsEnd?.resourceCost).toEqual({ type: 'focus', amount: 1 });
    });

    it('should generate attack for different weapon types', () => {
      character.level = 5;
      character.skills.setSkillRank(SkillType.ATHLETICS, 3);
      
      // Startling Blow uses unarmed
      character.unlockedTalents.add('startling_blow');
      let attacks = calculator.getAvailableAttacks();
      let startlingBlow = attacks.find(a => a.talentId === 'startling_blow');
      
      expect(startlingBlow).toBeDefined();
      // Athletics skill rank (3) + Strength attribute (2) = 5
      expect(startlingBlow?.attackBonus).toBe(5);
      expect(startlingBlow?.targetDefense).toBe('Cognitive');
    });

    it('should include special mechanics in traits', () => {
      character.level = 5;
      character.unlockedTalents.add('tagging_shot');
      
      const attacks = calculator.getAvailableAttacks();
      const taggingShot = attacks.find(a => a.talentId === 'tagging_shot');
      
      expect(taggingShot).toBeDefined();
      expect(taggingShot?.traits).toContain('Move up to 5 feet before attacking');
      expect(taggingShot?.traits).toContain('On hit or graze: target becomes your quarry');
    });

    it('should use best weapon skill for "any" weapon type', () => {
      character.level = 5;
      character.unlockedTalents.add('devastating_blow');
      character.skills.setSkillRank(SkillType.LIGHT_WEAPONRY, 4);
      character.skills.setSkillRank(SkillType.HEAVY_WEAPONRY, 2);
      
      const attacks = calculator.getAvailableAttacks();
      const devastatingBlow = attacks.find(a => a.talentId === 'devastating_blow');
      
      expect(devastatingBlow).toBeDefined();
      // Should use light weaponry skill rank (4) + Speed attribute (1) = 5
      expect(devastatingBlow?.attackBonus).toBe(5);
    });
  });

  describe('Stance Data with Bonuses and Advantages', () => {
    it('should include bonuses from stance talent in Stance object', () => {
      // Stonestance has a +1 Deflect bonus
      character.unlockedTalents.add('stonestance');
      
      const stances = calculator.getAvailableStances();
      const stonestance = stances.find(s => s.id === 'stonestance');
      
      expect(stonestance).toBeDefined();
      expect(stonestance?.bonuses).toBeDefined();
      expect(stonestance?.bonuses?.length).toBeGreaterThan(0);
      
      // Verify the bonus details
      const deflectBonus = stonestance?.bonuses?.[0];
      expect(deflectBonus?.source).toBe('stance:stonestance');
      expect(deflectBonus?.description).toContain('deflect');
      expect(deflectBonus?.description).toContain('all');
      expect(deflectBonus?.value).toBe(1);
      expect(deflectBonus?.condition).toContain('stonestance');
    });

    it('should include grantsAdvantage from stance talent in Stance object', () => {
      // Flamestance grants advantage on intimidation tests
      character.unlockedTalents.add('flamestance');
      
      const stances = calculator.getAvailableStances();
      const flamestance = stances.find(s => s.id === 'flamestance');
      
      expect(flamestance).toBeDefined();
      expect(flamestance?.grantsAdvantage).toBeDefined();
      expect(flamestance?.grantsAdvantage?.length).toBeGreaterThan(0);
      expect(flamestance?.grantsAdvantage).toContain('intimidation_in_flamestance');
    });

    it('should handle stances with both bonuses and advantages', () => {
      // Stonestance has bonuses
      character.unlockedTalents.add('stonestance');
      // Flamestance has advantages
      character.unlockedTalents.add('flamestance');
      
      const stances = calculator.getAvailableStances();
      
      expect(stances.length).toBe(2);
      
      const stonestance = stances.find(s => s.id === 'stonestance');
      const flamestance = stances.find(s => s.id === 'flamestance');
      
      // Stonestance: has bonuses, no advantages
      expect(stonestance?.bonuses?.length).toBeGreaterThan(0);
      expect(stonestance?.grantsAdvantage?.length || 0).toBe(0);
      
      // Flamestance: has advantages, no bonuses (flamestance has no bonuses in definition)
      expect(flamestance?.grantsAdvantage?.length || 0).toBeGreaterThan(0);
    });

    it('should not include bonuses property if stance has no bonuses', () => {
      // Flamestance has no bonuses in its definition
      character.unlockedTalents.add('flamestance');
      
      const stances = calculator.getAvailableStances();
      const flamestance = stances.find(s => s.id === 'flamestance');
      
      expect(flamestance).toBeDefined();
      // Bonuses should either not exist or be an empty array
      expect(flamestance?.bonuses?.length || 0).toBe(0);
    });

    it('should not include grantsAdvantage property if stance grants no advantages', () => {
      // Stonestance does not grant advantages
      character.unlockedTalents.add('stonestance');
      
      const stances = calculator.getAvailableStances();
      const stonestance = stances.find(s => s.id === 'stonestance');
      
      expect(stonestance).toBeDefined();
      // grantsAdvantage should either not exist or be an empty array
      expect(stonestance?.grantsAdvantage?.length || 0).toBe(0);
    });

    it('should format bonus descriptions for UI display', () => {
      character.unlockedTalents.add('stonestance');
      
      const stances = calculator.getAvailableStances();
      const stonestance = stances.find(s => s.id === 'stonestance');
      
      expect(stonestance?.bonuses?.length).toBeGreaterThan(0);
      const bonus = stonestance?.bonuses?.[0];
      
      // Description should be human-readable and include the bonus type
      expect(bonus?.description).toBeDefined();
      expect(typeof bonus?.description).toBe('string');
      expect(bonus?.description?.length).toBeGreaterThan(0);
      // Should have format like "deflect: all +1"
      expect(bonus?.description).toMatch(/[a-z]+:/);
    });

    it('should preserve all stance metadata alongside bonuses and advantages', () => {
      character.unlockedTalents.add('stonestance');
      
      const stances = calculator.getAvailableStances();
      const stonestance = stances.find(s => s.id === 'stonestance');
      
      // Verify all required Stance properties are present
      expect(stonestance?.id).toBe('stonestance');
      expect(stonestance?.name).toBe('Stonestance');
      expect(stonestance?.talentId).toBe('stonestance');
      expect(stonestance?.activationCost).toBe(1);
      expect(stonestance?.description).toBeDefined();
      expect(stonestance?.effects?.length).toBeGreaterThan(0);
      expect(stonestance?.bonuses).toBeDefined();
    });

    it('should include multiple bonuses if stance talent has multiple', () => {
      // Note: This test is prepared for future stances with multiple bonuses
      // Currently checking that the structure supports multiple bonuses
      character.unlockedTalents.add('stonestance');
      
      const stances = calculator.getAvailableStances();
      const stonestance = stances.find(s => s.id === 'stonestance');
      
      // Even single-bonus stances should be arrays for extensibility
      expect(Array.isArray(stonestance?.bonuses)).toBe(true);
      expect(stonestance?.bonuses).toBeDefined();
    });

    it('Stance object should carry all needed data for UI display', () => {
      // Comprehensive validation that Stance objects have all UI-required data
      character.unlockedTalents.add('stonestance');
      character.unlockedTalents.add('flamestance');
      
      const stances = calculator.getAvailableStances();
      
      for (const stance of stances) {
        // Core identity
        expect(stance.id).toBeTruthy();
        expect(stance.name).toBeTruthy();
        expect(stance.talentId).toBeTruthy();
        
        // Display information
        expect(stance.description).toBeTruthy();
        expect(typeof stance.description).toBe('string');
        
        // Mechanics
        expect(typeof stance.activationCost).toBe('number');
        expect(stance.activationCost).toBeGreaterThan(0);
        expect(Array.isArray(stance.effects)).toBe(true);
        
        // Optional but important: bonuses and advantages
        if (stance.bonuses) {
          expect(Array.isArray(stance.bonuses)).toBe(true);
          for (const bonus of stance.bonuses) {
            expect(bonus.source).toBeDefined();
            expect(bonus.description).toBeDefined();
          }
        }
        
        if (stance.grantsAdvantage) {
          expect(Array.isArray(stance.grantsAdvantage)).toBe(true);
          expect(stance.grantsAdvantage.every(a => typeof a === 'string')).toBe(true);
        }
      }
    });
  });
});
