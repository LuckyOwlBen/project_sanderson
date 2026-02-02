import { Attributes as AttributesModel } from '../character/attributes/attributes';
import { MovementRateCalculator } from '../character/attributes/derivedAttributes/movementRate';
import { RecoveryDieCalculator } from '../character/attributes/derivedAttributes/recoveryDie';
import { HealthManager } from '../character/resources/healthManager';
import { FocusManager } from '../character/resources/focusManager';

/**
 * Attributes Service - Backend calculations for derived attributes
 * 
 * Responsible for:
 * - Calculating derived attributes (health, focus, movement, recovery)
 * - Validating attribute allocations
 * - Managing point allocation and tracking
 */

interface Attributes {
  strength: number;
  speed: number;
  awareness: number;
  intellect: number;
  willpower: number;
  presence: number;
}

interface DerivedAttributes {
  health: number;
  focus: number;
  movement: number;
  recovery: string;
}

/**
 * Attributes Service - Main service for all attribute operations
 */
export class AttributesService {
  private movementCalculator = new MovementRateCalculator();
  private recoveryCalculator = new RecoveryDieCalculator();

  /**
   * Calculate all derived attributes from base attributes
   */
  calculateDerivedAttributes(attributes: Attributes): DerivedAttributes {
    const model = new AttributesModel();
    model.strength = attributes.strength;
    model.speed = attributes.speed;
    model.awareness = attributes.awareness;
    model.intellect = attributes.intellect;
    model.willpower = attributes.willpower;
    model.presence = attributes.presence;

    const healthManager = new HealthManager(model, 0);
    const focusManager = new FocusManager(model, 0);

    return {
      health: healthManager.max,
      focus: focusManager.max,
      movement: this.movementCalculator.getMovementSpeed(model.speed),
      recovery: this.recoveryCalculator.getRecoveryDie(model.willpower)
    };
  }

  /**
   * Validate attribute allocation
   */
  validateAttributeAllocation(
    attributes: Attributes
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check all 6 attributes exist
    const requiredAttrs = ['strength', 'speed', 'awareness', 'intellect', 'willpower', 'presence'];
    requiredAttrs.forEach((attr) => {
      if (attributes[attr as keyof Attributes] === undefined) {
        errors.push(`Missing attribute: ${attr}`);
      }
    });

    // Check all attributes >= 0
    requiredAttrs.forEach((attr) => {
      const val = attributes[attr as keyof Attributes];
      if (val !== undefined && val < 0) {
        errors.push(`${attr} must be at least 0`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate remaining points from pool
   */
  calculateRemainingPoints(totalPoints: number, pointsSpent: number): number {
    const remaining = totalPoints - pointsSpent;
    return Math.max(0, remaining);
  }

  /**
   * Check if all points are spent (allocation is complete)
   */
  isAllocationComplete(totalPoints: number, pointsSpent: number): boolean {
    return totalPoints > 0 && pointsSpent >= totalPoints;
  }
}

// Singleton export
export const attributesService = new AttributesService();
