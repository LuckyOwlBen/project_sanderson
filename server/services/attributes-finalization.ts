/**
 * Attributes Finalization Service
 * 
 * Handles finalization of attribute allocations at the end of character creation.
 * Once finalized, attributes cannot be edited until next level-up.
 */

import { createAttributesRecord, getAttributesRecord, setAttributesFinalized, updateAttributesRecord } from '../database';

export class AttributesFinalizationService {
  constructor() {}

  /**
   * Finalize attributes for a character
   * Validates all points are spent, moves spent points to total, and locks from editing
   * 
   * Called after character creation is complete (last step)
   */
  async finalizeAttributesForCharacter(characterId: string): Promise<void> {
    const existing = await getAttributesRecord(characterId);
    if (!existing) {
      throw new Error(`Attributes record not found for character ${characterId}`);
    }

    // Validate all points are spent
    if (existing.pointsRemaining > 0) {
      throw new Error(
        `Cannot finalize attributes: ${existing.pointsRemaining} points remaining. All points must be spent.`
      );
    }

    // Move spent points to total and reset spent/remaining
    const newTotalPoints = existing.totalPoints + existing.pointsSpent;
    
    await updateAttributesRecord(characterId, {
      totalPoints: newTotalPoints,
      pointsSpent: 0,
      pointsRemaining: 0,
      finalized: true
    });

    console.log(
      `[AttributesFinalization] Finalized attributes for character: ${characterId} (moved ${existing.pointsSpent} points to total)`
    );
  }

  /**
   * Reset attributes finalization for level-up
   * Sets finalized flag to false, allowing re-allocation of new points
   * 
   * Called when character levels up
   */
  async resetAttributesForLevelUp(characterId: string): Promise<void> {
    const existing = await getAttributesRecord(characterId);
    if (!existing) {
      await createAttributesRecord({
        characterId,
        totalPoints: 12,
        pointsSpent: 0,
        pointsRemaining: 12,
        strength: 0,
        speed: 0,
        intellect: 0,
        willpower: 0,
        awareness: 0,
        presence: 0,
        finalized: false
      });
      console.log(
        `[AttributesFinalization] Created attributes (reset for level-up) for character: ${characterId}`
      );
      return;
    }

    await setAttributesFinalized(characterId, false);
    console.log(
      `[AttributesFinalization] Reset attributes (ready for level-up) for character: ${characterId}`
    );
  }

  /**
   * Check if attributes are finalized for a character
   */
  async isFinalized(characterId: string): Promise<boolean> {
    try {
      const attributes = await getAttributesRecord(characterId);
      return attributes?.finalized ?? false;
    } catch (error) {
      console.error(
        `[AttributesFinalization] Error checking finalization status for ${characterId}:`,
        error
      );
      return false;
    }
  }
}

// Singleton export
export const attributesFinalizationService = new AttributesFinalizationService();
