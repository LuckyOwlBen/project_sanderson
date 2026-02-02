/**
 * AncestryModule - MODULE 3: ANCESTRY/CULTURE
 * Handles character background and heritage
 */

import { Ancestry } from '../ancestry/ancestry';
import { CulturalInterface } from '../culture/culturalInterface';

export class AncestryModule {
  ancestry: Ancestry | null = null;
  cultures: CulturalInterface[] = [];
  paths: string[] = [];

  constructor(
    ancestry: Ancestry | null = null,
    cultures: CulturalInterface[] = [],
    paths: string[] = []
  ) {
    this.ancestry = ancestry;
    this.cultures = cultures;
    this.paths = paths;
  }

  /**
   * Set character ancestry
   */
  setAncestry(ancestry: Ancestry | null): void {
    this.ancestry = ancestry;
  }

  /**
   * Add a culture
   */
  addCulture(culture: CulturalInterface): void {
    if (!this.cultures.find(c => c.name === culture.name)) {
      this.cultures.push(culture);
    }
  }

  /**
   * Remove a culture
   */
  removeCulture(cultureName: string): void {
    this.cultures = this.cultures.filter(c => c.name !== cultureName);
  }

  /**
   * Add a path
   */
  addPath(path: string): void {
    if (!this.paths.includes(path)) {
      this.paths.push(path);
    }
  }

  /**
   * Remove a path
   */
  removePath(path: string): void {
    this.paths = this.paths.filter(p => p !== path);
  }

  /**
   * Check if character has a specific path
   */
  hasPath(path: string): boolean {
    return this.paths.includes(path);
  }
}
