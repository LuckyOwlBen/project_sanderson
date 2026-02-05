/**
 * ProgressionModule - MODULE 2: PROGRESSION
 * Handles experience and level tracking
 */

export class ProgressionModule {
  level: number = 1;
  pendingLevelPoints: number = 0;
  pendingLevel: boolean = false;

  constructor(level: number = 1, pendingLevelPoints: number = 0, pendingLevel: boolean = false) {
    this.level = level;
    this.pendingLevelPoints = pendingLevelPoints;
    this.pendingLevel = pendingLevel;
  }

  /**
   * Get the character's tier based on level.
   * Tier 1: levels 1-5
   * Tier 2: levels 6-10
   * Tier 3: levels 11-15
   * Tier 4: levels 16-20
   * Tier 5: level 21+
   */
  getTier(): number {
    const lvl = this.level || 1;
    if (lvl <= 5) return 1;
    if (lvl <= 10) return 2;
    if (lvl <= 15) return 3;
    if (lvl <= 20) return 4;
    return 5;
  }

  /**
   * Increase level
   */
  increaseLevel(): void {
    this.level++;
  }

  /**
   * Add pending level points
   */
  addPendingPoints(points: number): void {
    this.pendingLevelPoints += points;
  }

  /**
   * Spend pending level points
   */
  spendPendingPoints(points: number): void {
    this.pendingLevelPoints = Math.max(0, this.pendingLevelPoints - points);
  }

  /**
   * Check if character has pending level points
   */
  hasPendingPoints(): boolean {
    return this.pendingLevelPoints > 0;
  }
}
