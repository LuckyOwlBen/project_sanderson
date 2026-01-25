/**
 * Character Calculations Service
 * 
 * Handles derived attribute calculations that depend on base attributes.
 * Consolidates duplicate calculation logic from frontend into single backend source.
 * 
 * Includes:
 * - Defense calculations (Physics Defense formula)
 * - Derived attributes (Movement Speed, Recovery Die)
 * - Bonus application system
 */

/**
 * Character attributes interface
 */
export interface Attributes {
  strength?: number;
  quickness?: number;
  intellect?: number;
  awareness?: number;
  will?: number;
  presence?: number;
}

/**
 * Defense calculation result
 */
export interface DefenseValues {
  physicsDef: number;
  baseDef: number;
  speedBonus: number;
  strengthBonus: number;
  bonuses: number;
}

/**
 * Derived attributes result
 */
export interface DerivedAttributes {
  movementSpeed: number;
  recoveryDie: string;
  baseRecoveryDie: string;
  speedModifier: number;
}

/**
 * Full character calculations
 */
export interface CharacterCalculations {
  defense: DefenseValues;
  derived: DerivedAttributes;
}

/**
 * Character Calculations Service
 * Handles all derived attribute and defense calculations
 */
export class CharacterCalculationsService {
  constructor() {
    // No initialization needed
  }

  /**
   * Calculate physics defense
   * 
   * Formula: Physics Defense = 10 + Speed modifier + Strength modifier + Bonuses
   * 
   * @param attributes - Character's base attributes
   * @param bonuses - Map of bonus sources {sourceName: value}
   * @returns Defense values breakdown
   */
  calculatePhysicsDefense(
    attributes: Attributes,
    bonuses: Record<string, number> = {}
  ): DefenseValues {
    if (!attributes) {
      throw new Error('Attributes required for defense calculation');
    }

    const quickness = attributes.quickness || 0;
    const strength = attributes.strength || 0;

    // Calculate speed bonus (quickness / 2, rounded down)
    const speedBonus = Math.floor(quickness / 2);

    // Calculate strength bonus (strength / 2, rounded down)
    const strengthBonus = Math.floor(strength / 2);

    // Calculate total bonuses
    const totalBonuses = Object.values(bonuses).reduce((sum, bonus) => sum + bonus, 0);

    // Physics Defense = 10 + speed + strength + bonuses
    const physicsDef = 10 + speedBonus + strengthBonus + totalBonuses;

    return {
      physicsDef,
      baseDef: 10,
      speedBonus,
      strengthBonus,
      bonuses: totalBonuses
    };
  }

  /**
   * Calculate movement speed
   * 
   * Speed is based on Quickness attribute
   * Standard human base speed is 30 feet per round
   * Each point of Quickness above 10 adds 5 feet
   * Each point below 10 subtracts 5 feet
   * 
   * @param quickness - Quickness attribute value
   * @param bonuses - Movement speed bonuses from items/effects
   * @returns Movement speed in feet
   */
  calculateMovementSpeed(
    quickness: number = 0,
    bonuses: number = 0
  ): number {
    if (quickness < 0) {
      throw new Error('Quickness cannot be negative');
    }

    // Base speed at Quickness 10
    const baseSpeed = 30;

    // Each point of QCK above/below 10 = 5 feet
    const quicknessModifier = (quickness - 10) * 5;

    return baseSpeed + quicknessModifier + bonuses;
  }

  /**
   * Calculate recovery die
   * 
   * Recovery die improves with Strength:
   * - STR 1-5: d4
   * - STR 6-10: d6
   * - STR 11-15: d8
   * - STR 16-20: d10
   * - STR 21+: d12
   * 
   * Bonuses add flat amount to die rolls, or upgrade die type
   * 
   * @param strength - Strength attribute value
   * @param bonuses - Recovery die bonuses/upgrades
   * @returns Recovery die string (e.g., 'd6', 'd8+2')
   */
  calculateRecoveryDie(
    strength: number = 0,
    bonuses: string = ''
  ): string {
    if (strength < 0) {
      throw new Error('Strength cannot be negative');
    }

    let baseRecoveryDie = 'd4';

    if (strength >= 21) {
      baseRecoveryDie = 'd12';
    } else if (strength >= 16) {
      baseRecoveryDie = 'd10';
    } else if (strength >= 11) {
      baseRecoveryDie = 'd8';
    } else if (strength >= 6) {
      baseRecoveryDie = 'd6';
    }

    // If there are bonuses, append them (e.g., 'd6+2')
    if (bonuses) {
      return `${baseRecoveryDie}${bonuses.startsWith('+') ? '' : '+'}${bonuses}`;
    }

    return baseRecoveryDie;
  }

  /**
   * Get all derived attributes for a character
   * 
   * @param attributes - Character's base attributes
   * @param movementBonuses - Bonuses to movement speed (numeric)
   * @param recoveryBonuses - Bonuses to recovery die (string like '+2')
   * @returns All derived attributes
   */
  getDerivedAttributes(
    attributes: Attributes,
    movementBonuses: number = 0,
    recoveryBonuses: string = ''
  ): DerivedAttributes {
    const quickness = attributes.quickness || 0;
    const strength = attributes.strength || 0;

    const movementSpeed = this.calculateMovementSpeed(quickness, movementBonuses);
    const baseRecoveryDie = this.calculateRecoveryDie(strength);
    const recoveryDie = this.calculateRecoveryDie(strength, recoveryBonuses);

    // Calculate speed modifier from movement speed
    // Standard 30 ft = 0 modifier
    const speedModifier = Math.floor((movementSpeed - 30) / 5);

    return {
      movementSpeed,
      recoveryDie,
      baseRecoveryDie,
      speedModifier
    };
  }

  /**
   * Calculate all character stats (defense + derived attributes)
   * 
   * @param attributes - Base attributes
   * @param defBonuses - Defense bonuses {source: value}
   * @param movementBonuses - Movement speed bonuses
   * @param recoveryBonuses - Recovery die bonuses string
   * @returns All calculations
   */
  calculateAll(
    attributes: Attributes,
    defBonuses: Record<string, number> = {},
    movementBonuses: number = 0,
    recoveryBonuses: string = ''
  ): CharacterCalculations {
    return {
      defense: this.calculatePhysicsDefense(attributes, defBonuses),
      derived: this.getDerivedAttributes(attributes, movementBonuses, recoveryBonuses)
    };
  }

  /**
   * Validate attributes object
   */
  validateAttributes(attributes: Attributes): { valid: boolean; error?: string } {
    if (!attributes || typeof attributes !== 'object') {
      return { valid: false, error: 'Attributes must be an object' };
    }

    const attributeNames = ['strength', 'quickness', 'intellect', 'awareness', 'will', 'presence'];
    for (const attr of attributeNames) {
      if (attributes[attr as keyof Attributes] !== undefined) {
        const value = attributes[attr as keyof Attributes];
        if (typeof value !== 'number') {
          return { valid: false, error: `${attr} must be a number` };
        }
        if (value < 0) {
          return { valid: false, error: `${attr} cannot be negative` };
        }
      }
    }

    return { valid: true };
  }
}

// Export singleton instance
export const characterCalculationsService = new CharacterCalculationsService();
