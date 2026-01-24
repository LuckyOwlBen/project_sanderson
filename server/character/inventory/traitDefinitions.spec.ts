/**
 * Tests for Trait Definitions - Parsing and Formatting
 */

import { parseTraitString, formatTraitString, TraitDefinition } from './traitDefinitions';

describe('TraitDefinitions', () => {
  
  describe('parseTraitString', () => {
    it('should parse simple traits without parameters', () => {
      const result = parseTraitString('Deadly');
      expect(result).toEqual({ trait: 'Deadly' });
    });

    it('should parse Thrown trait with range parameters', () => {
      const result = parseTraitString('Thrown[20/60]');
      expect(result).toEqual({
        trait: 'Thrown',
        params: { shortRange: 20, longRange: 60 }
      });
    });

    it('should parse Melee trait with bonus parameter', () => {
      const result = parseTraitString('Melee[+5]');
      expect(result).toEqual({
        trait: 'Melee',
        params: { meleeBonus: 5 }
      });
    });

    it('should parse Unique trait with effect description', () => {
      const result = parseTraitString('Unique: loses Two-Handed trait');
      expect(result).toEqual({
        trait: 'Unique',
        params: { effect: 'loses Two-Handed trait' }
      });
    });

    it('should parse Unique trait with loses Dangerous effect', () => {
      const result = parseTraitString('Unique: loses Dangerous Trait');
      expect(result).toEqual({
        trait: 'Unique',
        params: { effect: 'loses Dangerous Trait' }
      });
    });
  });

  describe('formatTraitString', () => {
    it('should format simple traits', () => {
      const trait: TraitDefinition = { trait: 'Deadly' };
      const result = formatTraitString(trait);
      expect(result).toBe('Deadly');
    });

    it('should format Thrown trait with parameters', () => {
      const trait: TraitDefinition = {
        trait: 'Thrown',
        params: { shortRange: 30, longRange: 120 }
      };
      const result = formatTraitString(trait);
      expect(result).toBe('Thrown[30/120]');
    });

    it('should format Melee trait with bonus', () => {
      const trait: TraitDefinition = {
        trait: 'Melee',
        params: { meleeBonus: 5 }
      };
      const result = formatTraitString(trait);
      expect(result).toBe('Melee[+5]');
    });

    it('should format Unique trait with effect', () => {
      const trait: TraitDefinition = {
        trait: 'Unique',
        params: { effect: 'loses Two-Handed trait' }
      };
      const result = formatTraitString(trait);
      expect(result).toBe('Unique: loses Two-Handed trait');
    });
  });

  describe('round-trip parsing and formatting', () => {
    const testCases = [
      'Deadly',
      'Quickdraw',
      'Discreet',
      'Thrown[20/60]',
      'Thrown[30/120]',
      'Melee[+5]',
      'Unique: loses Two-Handed trait',
      'Unique: loses Dangerous Trait'
    ];

    testCases.forEach(original => {
      it(`should round-trip "${original}"`, () => {
        const parsed = parseTraitString(original);
        const formatted = formatTraitString(parsed);
        expect(formatted).toBe(original);
      });
    });
  });

  describe('real-world examples from itemDefinitions', () => {
    it('should parse dagger traits', () => {
      const traits = ['Thrown[30/120]'];
      const expertTraits = ['Indirect'];
      
      const parsedTraits = traits.map(parseTraitString);
      const parsedExpertTraits = expertTraits.map(parseTraitString);
      
      expect(parsedTraits[0]).toEqual({
        trait: 'Thrown',
        params: { shortRange: 30, longRange: 120 }
      });
      expect(parsedExpertTraits[0]).toEqual({ trait: 'Indirect' });
    });

    it('should parse knife traits', () => {
      const traits = ['Discreet'];
      const expertTraits = ['Offhand', 'Thrown[20/60]'];
      
      const parsedTraits = traits.map(parseTraitString);
      const parsedExpertTraits = expertTraits.map(parseTraitString);
      
      expect(parsedTraits[0]).toEqual({ trait: 'Discreet' });
      expect(parsedExpertTraits[0]).toEqual({ trait: 'Offhand' });
      expect(parsedExpertTraits[1]).toEqual({
        trait: 'Thrown',
        params: { shortRange: 20, longRange: 60 }
      });
    });

    it('should parse shortsword traits', () => {
      const traits = ['Two-Handed'];
      const expertTraits = ['Unique: loses Two-Handed trait'];
      
      const parsedTraits = traits.map(parseTraitString);
      const parsedExpertTraits = expertTraits.map(parseTraitString);
      
      expect(parsedTraits[0]).toEqual({ trait: 'Two-Handed' });
      expect(parsedExpertTraits[0]).toEqual({
        trait: 'Unique',
        params: { effect: 'loses Two-Handed trait' }
      });
    });

    it('should parse shardblade (dead) traits', () => {
      const traits = ['Deadly', 'Dangerous', 'Unique'];
      const expertTraits = ['Unique: loses Dangerous Trait'];
      
      const parsedTraits = traits.map(parseTraitString);
      const parsedExpertTraits = expertTraits.map(parseTraitString);
      
      expect(parsedTraits[0]).toEqual({ trait: 'Deadly' });
      expect(parsedTraits[1]).toEqual({ trait: 'Dangerous' });
      expect(parsedTraits[2]).toEqual({ trait: 'Unique' });
      expect(parsedExpertTraits[0]).toEqual({
        trait: 'Unique',
        params: { effect: 'loses Dangerous Trait' }
      });
    });
  });
});
