/**
 * CombatModule - MODULE 10: COMBAT
 * Handles combat stance and attack system
 */

import { Attack, Stance } from '../attacks/attackInterfaces';
import { AttackCalculator } from '../attacks/attackCalculator';
import { TalentNode } from 'shared/types/talents';
import { BonusManager } from '../bonuses/bonusManager';

export class CombatModule {
  activeStanceId: string | null = null;
  private character?: any; // Reference to parent Character for attack calculations
  private bonusManager?: BonusManager;

  constructor(activeStanceId: string | null = null) {
    this.activeStanceId = activeStanceId;
  }

  /**
   * Set character reference (needed for attack calculations)
   */
  setCharacter(character: any): void {
    this.character = character;
  }

  /**
   * Set bonus manager (needed for stance bonuses)
   */
  setBonusManager(bonusManager: BonusManager): void {
    this.bonusManager = bonusManager;
  }

  /**
   * Get all available attacks for combat
   */
  getAvailableAttacks(): Attack[] {
    if (!this.character) return [];
    const calculator = new AttackCalculator(this.character);
    return calculator.getAvailableAttacks();
  }

  /**
   * Get available combat stances
   */
  getAvailableStances(): Stance[] {
    if (!this.character) return [];
    const calculator = new AttackCalculator(this.character);
    return calculator.getAvailableStances();
  }

  /**
   * Set the active combat stance
   */
  setActiveStance(stanceId: string | null): boolean {
    if (stanceId === null) {
      this.activeStanceId = null;
      return true;
    }

    // Verify the stance exists and is available
    const availableStances = this.getAvailableStances();
    const stanceExists = availableStances.some(s => s.id === stanceId);

    if (!stanceExists) {
      console.warn(`Stance with ID "${stanceId}" is not available for this character`);
      return false;
    }

    this.activeStanceId = stanceId;
    return true;
  }

  /**
   * Get the currently active stance
   */
  getActiveStance(): Stance | null {
    if (!this.activeStanceId) return null;

    const availableStances = this.getAvailableStances();
    return availableStances.find(s => s.id === this.activeStanceId) || null;
  }

  /**
   * Apply bonuses from a stance
   */
  applyStanceBonuses(stanceId: string, talentNode: TalentNode): void {
    if (!this.bonusManager) return;

    const source = `stance:${stanceId}`;

    if (talentNode.bonuses && talentNode.bonuses.length > 0) {
      talentNode.bonuses.forEach(bonus => {
        this.bonusManager!.bonuses.addBonus(source, bonus);
      });
    }
  }

  /**
   * Clear all bonuses from the current active stance
   */
  clearStanceBonuses(): void {
    if (this.activeStanceId && this.bonusManager) {
      const source = `stance:${this.activeStanceId}`;
      this.bonusManager.bonuses.removeBonus(source);
    }
  }
}
