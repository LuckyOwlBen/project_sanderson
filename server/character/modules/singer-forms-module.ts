/**
 * SingerFormsModule - MODULE 9: SINGER FORMS
 * Handles symbiotic form tracking and activation
 */

import { UniversalAbility, SINGER_FORMS } from '../abilities/universalAbilities';
import { BonusManager } from '../bonuses/bonusManager';
import { BonusType } from '../bonuses/bonusModule';

export class SingerFormsModule {
  unlockedSingerForms: string[] = [];
  activeForm?: string;
  private bonusManager?: BonusManager;

  constructor(unlockedForms: string[] = [], activeForm?: string) {
    this.unlockedSingerForms = unlockedForms;
    this.activeForm = activeForm;
  }

  /**
   * Set bonus manager (needed for applying form bonuses)
   */
  setBonusManager(bonusManager: BonusManager): void {
    this.bonusManager = bonusManager;
  }

  /**
   * Unlock a Singer form
   */
  unlockForm(formId: string): void {
    if (!this.unlockedSingerForms.includes(formId)) {
      this.unlockedSingerForms.push(formId);
    }
  }

  /**
   * Check if character has unlocked a specific Singer form
   */
  hasForm(formId: string): boolean {
    return this.unlockedSingerForms.includes(formId);
  }

  /**
   * Set the active Singer form
   */
  setActiveForm(formId: string | undefined): void {
    if (formId === undefined) {
      this.clearActiveFormBonuses();
      this.activeForm = undefined;
      return;
    }

    // Validate that the form is unlocked (dullform is always available)
    if (formId !== 'dullform' && !this.hasForm(formId)) {
      throw new Error(`Cannot activate form "${formId}" - it has not been unlocked`);
    }

    // Clear previous form bonuses
    this.clearActiveFormBonuses();

    // Set new active form
    this.activeForm = formId;

    // Apply new form bonuses
    this.applyActiveFormBonuses();
  }

  /**
   * Get list of available Singer forms for selection
   */
  getAvailableForms(): UniversalAbility[] {
    return SINGER_FORMS.filter((form) => form.id === 'dullform' || this.hasForm(form.id));
  }

  /**
   * Get information about the active form
   */
  getActiveFormInfo(): UniversalAbility | undefined {
    if (!this.activeForm) return undefined;
    return SINGER_FORMS.find((f) => f.id === this.activeForm);
  }

  /**
   * Get source string for active form bonuses
   */
  private getActiveFormSource(): string {
    return `activeform:${this.activeForm}`;
  }

  /**
   * Apply bonuses from the currently active form
   */
  private applyActiveFormBonuses(): void {
    if (!this.activeForm || !this.bonusManager) return;

    const form = SINGER_FORMS.find((f) => f.id === this.activeForm);
    if (!form) return;

    const source = this.getActiveFormSource();

    switch (this.activeForm) {
      case 'nimbleform':
        this.bonusManager.bonuses.addBonus(source, {
          type: BonusType.ATTRIBUTE,
          target: 'agility',
          value: 1,
        });
        break;
      case 'artform':
        this.bonusManager.bonuses.addBonus(source, {
          type: BonusType.ATTRIBUTE,
          target: 'presence',
          value: 1,
        });
        break;
      case 'meditationform':
        this.bonusManager.bonuses.addBonus(source, {
          type: BonusType.ATTRIBUTE,
          target: 'willpower',
          value: 1,
        });
        break;
      case 'scholarform':
        this.bonusManager.bonuses.addBonus(source, {
          type: BonusType.ATTRIBUTE,
          target: 'intellect',
          value: 1,
        });
        break;
      case 'warform':
        this.bonusManager.bonuses.addBonus(source, {
          type: BonusType.ATTRIBUTE,
          target: 'strength',
          value: 2,
        });
        this.bonusManager.bonuses.addBonus(source, {
          type: BonusType.ATTRIBUTE,
          target: 'vitality',
          value: 1,
        });
        break;
      case 'workform':
        this.bonusManager.bonuses.addBonus(source, {
          type: BonusType.ATTRIBUTE,
          target: 'strength',
          value: 1,
        });
        this.bonusManager.bonuses.addBonus(source, {
          type: BonusType.ATTRIBUTE,
          target: 'vitality',
          value: 1,
        });
        break;
      case 'direform':
        this.bonusManager.bonuses.addBonus(source, {
          type: BonusType.ATTRIBUTE,
          target: 'strength',
          value: 1,
        });
        this.bonusManager.bonuses.addBonus(source, {
          type: BonusType.ATTRIBUTE,
          target: 'agility',
          value: 1,
        });
        break;
      case 'stormform':
        this.bonusManager.bonuses.addBonus(source, {
          type: BonusType.ATTRIBUTE,
          target: 'strength',
          value: 2,
        });
        this.bonusManager.bonuses.addBonus(source, {
          type: BonusType.ATTRIBUTE,
          target: 'vitality',
          value: 2,
        });
        break;
      case 'decayform':
        this.bonusManager.bonuses.addBonus(source, {
          type: BonusType.ATTRIBUTE,
          target: 'vitality',
          value: 1,
        });
        break;
      case 'envoyform':
        this.bonusManager.bonuses.addBonus(source, {
          type: BonusType.ATTRIBUTE,
          target: 'presence',
          value: 2,
        });
        this.bonusManager.bonuses.addBonus(source, {
          type: BonusType.ATTRIBUTE,
          target: 'intellect',
          value: 1,
        });
        break;
      case 'nightform':
        this.bonusManager.bonuses.addBonus(source, {
          type: BonusType.ATTRIBUTE,
          target: 'agility',
          value: 2,
        });
        break;
      case 'relayform':
        this.bonusManager.bonuses.addBonus(source, {
          type: BonusType.ATTRIBUTE,
          target: 'intellect',
          value: 1,
        });
        this.bonusManager.bonuses.addBonus(source, {
          type: BonusType.ATTRIBUTE,
          target: 'willpower',
          value: 1,
        });
        break;
    }
  }

  /**
   * Clear bonuses from active form
   */
  private clearActiveFormBonuses(): void {
    if (this.activeForm && this.bonusManager) {
      const source = this.getActiveFormSource();
      this.bonusManager.bonuses.removeBonus(source);
    }
  }

  /**
   * Get bonuses from the currently active form
   */
  getActiveFormBonuses() {
    if (!this.activeForm) return [];

    const bonuses: any[] = [];

    switch (this.activeForm) {
      case 'dullform':
        return [];
      case 'nimbleform':
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'agility', value: 1 });
        break;
      case 'artform':
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'presence', value: 1 });
        break;
      case 'meditationform':
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'willpower', value: 1 });
        break;
      case 'scholarform':
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'intellect', value: 1 });
        break;
      case 'warform':
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'strength', value: 2 });
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'vitality', value: 1 });
        break;
      case 'workform':
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'strength', value: 1 });
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'vitality', value: 1 });
        break;
      case 'direform':
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'strength', value: 1 });
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'agility', value: 1 });
        break;
      case 'stormform':
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'strength', value: 2 });
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'vitality', value: 2 });
        break;
      case 'decayform':
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'vitality', value: 1 });
        break;
      case 'envoyform':
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'presence', value: 2 });
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'intellect', value: 1 });
        break;
      case 'nightform':
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'agility', value: 2 });
        break;
      case 'relayform':
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'intellect', value: 1 });
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'willpower', value: 1 });
        break;
    }

    return bonuses;
  }
}
