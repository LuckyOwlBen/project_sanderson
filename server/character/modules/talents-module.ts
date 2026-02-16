/**
 * TalentsModule - MODULE 6: TALENTS
 * Handles talent selection and tracking
 */

export class TalentsModule {
  unlockedTalents: Set<string> = new Set<string>();
  baselineUnlockedTalents?: Set<string>;

  constructor(unlockedTalents: string[] = [], baselineUnlockedTalents?: string[]) {
    this.unlockedTalents = new Set(unlockedTalents);
    if (baselineUnlockedTalents) {
      this.baselineUnlockedTalents = new Set(baselineUnlockedTalents);
    }
  }

  /**
   * Unlock a talent
   */
  unlockTalent(talentId: string): void {
    this.unlockedTalents.add(talentId);
  }

  /**
   * Check if talent is unlocked
   */
  hasTalent(talentId: string): boolean {
    return this.unlockedTalents.has(talentId);
  }

  /**
   * Remove a talent
   */
  removeTalent(talentId: string): void {
    this.unlockedTalents.delete(talentId);
  }

  /**
   * Get all unlocked talents as array
   */
  getUnlockedTalents(): string[] {
    return Array.from(this.unlockedTalents);
  }

  /**
   * Set baseline talents (for level-up tracking)
   */
  setBaseline(): void {
    this.baselineUnlockedTalents = new Set(this.unlockedTalents);
  }

  /**
   * Get talents unlocked since baseline
   */
  getTalentsSinceBaseline(): string[] {
    if (!this.baselineUnlockedTalents) {
      return Array.from(this.unlockedTalents);
    }

    return Array.from(this.unlockedTalents).filter((t) => !this.baselineUnlockedTalents!.has(t));
  }

  /**
   * Clear baseline
   */
  clearBaseline(): void {
    this.baselineUnlockedTalents = undefined;
  }
}
