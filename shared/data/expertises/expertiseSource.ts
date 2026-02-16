/**
 * Expertise source tracking for automatic removal when prerequisites are lost.
 * 
 * Sources:
 * - 'culture': Auto-granted from culture selection (e.g., Alethi, Azish)
 * - 'talent': Granted by unlocking talents (e.g., Combat Training, Plausible Excuse)
 * - 'gm': Custom expertises granted by Game Master
 * - 'manual': Manually selected during character creation (using Intellect points)
 */
export type ExpertiseSourceType = 'culture' | 'talent' | 'gm' | 'manual';

/**
 * Represents an expertise with its source for cascade removal.
 * 
 * @property name - The expertise name (e.g., "Alethi", "Sleight of Hand", "Light Weaponry")
 * @property source - Where the expertise came from
 * @property sourceId - Optional identifier for the source (e.g., talent ID, culture name)
 *                      Used for cascade removal when source is removed
 */
export interface ExpertiseSource {
  name: string;
  source: ExpertiseSourceType;
  sourceId?: string;
}

/**
 * Helper functions for expertise source management
 */
export class ExpertiseSourceHelper {
  /**
   * Create an expertise source object
   */
  static create(name: string, source: ExpertiseSourceType, sourceId?: string): ExpertiseSource {
    return { name, source, sourceId };
  }

  /**
   * Check if an expertise can be manually removed by the player
   */
  static canRemove(expertise: ExpertiseSource): boolean {
    // Only manual and GM-granted expertises can be removed by player
    return expertise.source === 'manual' || expertise.source === 'gm';
  }

  /**
   * Check if an expertise is auto-granted (culture or talent)
   */
  static isAutoGranted(expertise: ExpertiseSource): boolean {
    return expertise.source === 'culture' || expertise.source === 'talent';
  }

  /**
   * Get display badge text for source
   */
  static getSourceBadge(source: ExpertiseSourceType): string {
    switch (source) {
      case 'culture': return 'Culture';
      case 'talent': return 'Talent';
      case 'gm': return 'GM';
      case 'manual': return 'Manual';
      default: return '';
    }
  }

  /**
   * Get CSS class for source badge styling
   */
  static getSourceClass(source: ExpertiseSourceType): string {
    return `expertise-source-${source}`;
  }

  /**
   * Migrate old string array format to new ExpertiseSource format
   * Defaults to 'manual' source for backward compatibility
   */
  static migrateFromStringArray(expertises: string[]): ExpertiseSource[] {
    return expertises.map(name => ({
      name,
      source: 'manual' as ExpertiseSourceType,
      sourceId: undefined
    }));
  }

  /**
   * Extract just the expertise names from ExpertiseSource array
   */
  static toStringArray(expertises: ExpertiseSource[]): string[] {
    return expertises.map(e => e.name);
  }
}
