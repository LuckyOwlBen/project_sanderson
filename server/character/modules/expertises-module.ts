/**
 * ExpertisesModule - MODULE 7: EXPERTISES
 * Handles specialized knowledge domains
 */

import { ExpertiseSource } from '../expertises/expertiseSource';

export class ExpertisesModule {
  private _selectedExpertises: ExpertiseSource[] = [];
  private expertiseCache: Set<string> | null = null;

  constructor(expertises: ExpertiseSource[] = []) {
    this._selectedExpertises = expertises;
  }

  /**
   * Get the character's expertises
   */
  get selectedExpertises(): ExpertiseSource[] {
    return this._selectedExpertises;
  }

  /**
   * Set the character's expertises
   */
  set selectedExpertises(value: ExpertiseSource[]) {
    this._selectedExpertises = value;
    this.invalidateCache();
  }

  /**
   * Add an expertise
   */
  addExpertise(expertise: ExpertiseSource): void {
    if (!this._selectedExpertises.find(e => e.name === expertise.name)) {
      this._selectedExpertises.push(expertise);
      this.invalidateCache();
    }
  }

  /**
   * Remove an expertise
   */
  removeExpertise(expertiseName: string): void {
    this._selectedExpertises = this._selectedExpertises.filter(
      e => e.name !== expertiseName
    );
    this.invalidateCache();
  }

  /**
   * Check if character has a specific expertise
   * Uses cached Set for O(1) lookup performance
   */
  hasExpertise(expertiseName: string): boolean {
    const currentCount = this._selectedExpertises.length;
    const cacheSize = this.expertiseCache?.size ?? -1;
    
    if (!this.expertiseCache || cacheSize !== currentCount) {
      this.rebuildCache();
    }
    
    return this.expertiseCache!.has(expertiseName);
  }

  /**
   * Get expertise rank for skill checks
   */
  getExpertiseRank(expertiseName: string): number {
    return this.hasExpertise(expertiseName) ? 1 : 0;
  }

  /**
   * Get all expertise names (for skill checks)
   */
  getExpertiseSkills(): string[] {
    return this._selectedExpertises.map(e => e.name);
  }

  /**
   * Rebuild expertise cache
   */
  private rebuildCache(): void {
    this.expertiseCache = new Set(this._selectedExpertises.map(e => e.name));
  }

  /**
   * Invalidate expertise cache
   */
  invalidateCache(): void {
    this.expertiseCache = null;
  }
}
