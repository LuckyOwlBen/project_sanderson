/**
 * Weapon and Armor Trait Definitions
 * 
 * Defines all weapon and armor traits with structured parameters.
 * Traits are simple descriptive tags that can have optional parameters.
 * This system is intentionally simple and extendable for future enhancements.
 */

/**
 * Trait with optional parameters
 * Examples:
 * - { trait: 'Deadly' }
 * - { trait: 'Thrown', params: { shortRange: 20, longRange: 60 } }
 * - { trait: 'Unique', params: { effect: 'loses Two-Handed trait' } }
 */
export interface TraitDefinition {
  trait: string;
  params?: TraitParameters;
}

/**
 * Parameters for traits that need additional data
 */
export interface TraitParameters {
  // For Thrown weapons
  shortRange?: number;
  longRange?: number;
  
  // For Melee range modifiers (e.g., "Melee[+5]")
  meleeBonus?: number;
  
  // For Unique traits with special effects
  effect?: string;
  
  // Extensible for future trait parameters
  [key: string]: any;
}

/**
 * Parse a trait string into structured format
 * Examples:
 * - "Deadly" → { trait: "Deadly" }
 * - "Thrown[20/60]" → { trait: "Thrown", params: { shortRange: 20, longRange: 60 } }
 * - "Unique: loses Two-Handed trait" → { trait: "Unique", params: { effect: "loses Two-Handed trait" } }
 */
export function parseTraitString(traitString: string): TraitDefinition {
  // Check for Thrown[X/Y] format
  const thrownMatch = traitString.match(/Thrown\[(\d+)\/(\d+)\]/);
  if (thrownMatch) {
    return {
      trait: 'Thrown',
      params: {
        shortRange: parseInt(thrownMatch[1]),
        longRange: parseInt(thrownMatch[2])
      }
    };
  }
  
  // Check for Melee[+X] format
  const meleeMatch = traitString.match(/Melee\[\+(\d+)\]/);
  if (meleeMatch) {
    return {
      trait: 'Melee',
      params: {
        meleeBonus: parseInt(meleeMatch[1])
      }
    };
  }
  
  // Check for Unique: effect format
  const uniqueMatch = traitString.match(/Unique:\s*(.+)/);
  if (uniqueMatch) {
    return {
      trait: 'Unique',
      params: {
        effect: uniqueMatch[1]
      }
    };
  }
  
  // Simple trait with no parameters
  return { trait: traitString };
}

/**
 * Format a trait definition back to display string
 */
export function formatTraitString(trait: TraitDefinition): string {
  if (!trait.params) {
    return trait.trait;
  }
  
  if (trait.trait === 'Thrown' && trait.params.shortRange && trait.params.longRange) {
    return `Thrown[${trait.params.shortRange}/${trait.params.longRange}]`;
  }
  
  if (trait.trait === 'Melee' && trait.params.meleeBonus) {
    return `Melee[+${trait.params.meleeBonus}]`;
  }
  
  if (trait.trait === 'Unique' && trait.params.effect) {
    return `Unique: ${trait.params.effect}`;
  }
  
  return trait.trait;
}

/**
 * Known weapon/armor traits
 * This list is for reference and can be extended as needed
 */
export const KNOWN_TRAITS = [
  'Deadly',
  'Quickdraw',
  'Discreet',
  'Offhand',
  'Thrown',
  'Momentum',
  'Defensive',
  'Indirect',
  'Two-Handed',
  'Dangerous',
  'Unique'
] as const;
