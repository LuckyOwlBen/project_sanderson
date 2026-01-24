/**
 * Talent Service - Core Business Logic Layer
 * 
 * Handles all talent-related operations with database integration.
 * Implements dependency injection pattern for testability and modularity.
 * 
 * Responsibilities:
 * - Talent point calculations
 * - Tier 0 auto-unlock logic (SINGLE location)
 * - Talent validation and rules enforcement
 * - Database persistence
 * - Singer ancestry special handling
 * - Spent points tracking
 */

import * as db from '../database.js';

// ============================================================================
// DATA: Talent Points & Tier 0 Mappings
// ============================================================================

const TALENT_POINTS_PER_LEVEL = [
  2, // Level 1 (tier 0 + 1 tier 1)
  1, 1, 1, 1, // Levels 2-5
  2, // Level 6 (bonus)
  1, 1, 1, 1, // Levels 7-10
  2, // Level 11 (bonus)
  1, 1, 1, 1, // Levels 12-15
  2, // Level 16 (bonus)
  1, 1, 1, 1, 1 // Levels 17-21
];

const PATH_TIER0_TALENTS: Record<string, string> = {
  'warrior': 'vigilant_stance',
  'scholar': 'education',
  'hunter': 'seek_quarry',
  'leader': 'decisive_command',
  'envoy': 'rousing_presence',
  'agent': 'opportunist'
};

// ============================================================================
// INTERFACES
// ============================================================================

export interface TalentValidationResult {
  valid: boolean;
  message: string;
}

export interface TalentSelectionResponse {
  talentPoints: number;
  previouslySelectedTalents: string[];
  unlockedTalents: string[];
  spentPoints: { talents: Record<string, number> };
  lockedTalents: string[];
  requiresSingerSelection: boolean;
  tier0TalentId: string | null;
}

// ============================================================================
// TALENT SERVICE CLASS
// ============================================================================

export class TalentService {
  /**
   * Get the tier 0 (free) talent for a given path
   */
  getTier0TalentForPath(pathId: string | null): string | null {
    if (!pathId) return null;
    return PATH_TIER0_TALENTS[pathId] || null;
  }

  /**
   * Ensure tier 0 talent is unlocked for a character's main path
   * This is the SINGLE place where tier 0 auto-unlock happens
   * 
   * Called from:
   * - POST /api/characters/:id/paths (when path is selected)
   * 
   * @param characterId - Character ID
   * @param mainPath - Character's main path
   * @returns The tier 0 talent ID, or null if path not set
   */
  ensureTier0Unlocked(
    characterId: string,
    mainPath: string | null
  ): string | null {
    const tier0TalentId = this.getTier0TalentForPath(mainPath);

    if (!tier0TalentId) {
      return null;
    }

    // Check if already unlocked
    const character = db.loadCharacter(characterId);
    if (character && character.unlockedTalents?.includes(tier0TalentId)) {
      return tier0TalentId;
    }

    // Unlock tier 0 talent (no point cost, always available at level 1)
    const result = db.unlockTalent(characterId, [tier0TalentId], 1);

    if (result.success) {
      console.log(`[TalentService] Tier 0 talent unlocked for ${characterId}: ${tier0TalentId}`);
      return tier0TalentId;
    }

    return null;
  }

  /**
   * Calculate total talent points available from level 1 to a given level
   */
  calculateTotalTalentPoints(level: number): number {
    if (level < 1 || level > 21) return 0;

    let total = 0;
    for (let i = 0; i < level; i++) {
      total += TALENT_POINTS_PER_LEVEL[i];
    }
    return total;
  }

  /**
   * Get talent points available at a specific level
   */
  getTalentPointsForLevel(level: number): number {
    if (level < 1 || level > 21) return 0;
    return TALENT_POINTS_PER_LEVEL[level - 1];
  }

  /**
   * Check if character is required to select from Singer tree
   * Currently: singer ancestry at level 1
   */
  requiresSingerSelection(ancestry: string | null, level: number): boolean {
    return ancestry === 'singer' && level === 1;
  }

  /**
   * Count how many talent points have been spent (excluding tier 0)
   */
  countSpentTalentPoints(unlockedTalents: string[], mainPath: string | null): number {
    const tier0Talent = this.getTier0TalentForPath(mainPath);

    return unlockedTalents.filter((talentId) => talentId !== tier0Talent).length;
  }

  /**
   * Calculate available talent points for allocation
   * 
   * For CHARACTER CREATION:
   * - Returns cumulative points from level 1 to current level
   * - Subtracts all non-tier0 talents already selected
   * 
   * For LEVEL-UP:
   * - Returns only current level's points
   * - Subtracts new talents selected this level (not previously selected)
   */
  calculateAvailableTalentPoints(
    level: number,
    unlockedTalents: string[],
    mainPath: string | null,
    previouslySelectedTalents: string[] = []
  ): number {
    const totalPoints = this.calculateTotalTalentPoints(level);
    const tier0Talent = this.getTier0TalentForPath(mainPath);

    if (previouslySelectedTalents.length > 0) {
      // LEVEL-UP: count only new talents selected at this level
      const newTalents = unlockedTalents.filter(
        (id) => id !== tier0Talent && !previouslySelectedTalents.includes(id)
      );
      return this.getTalentPointsForLevel(level) - newTalents.length;
    }

    // CHARACTER CREATION: count all non-tier0 talents against cumulative total
    const spentPoints = this.countSpentTalentPoints(unlockedTalents, mainPath);
    return totalPoints - spentPoints;
  }

  /**
   * Validate that talent selections don't exceed available points
   */
  validateTalentPoints(
    level: number,
    unlockedTalents: string[],
    mainPath: string | null,
    previouslySelectedTalents: string[] = []
  ): TalentValidationResult {
    const availablePoints = this.calculateAvailableTalentPoints(
      level,
      unlockedTalents,
      mainPath,
      previouslySelectedTalents
    );

    if (availablePoints < 0) {
      const overspent = Math.abs(availablePoints);
      return {
        valid: false,
        message: `Talent point limit exceeded by ${overspent} point(s)`
      };
    }

    return { valid: true, message: 'Valid' };
  }

  /**
   * Get baseline talents (all unlocked except tier 0)
   * Used to determine which talents are "locked" during level-up
   */
  getBaselineTalents(unlockedTalents: string[], mainPath: string | null): string[] {
    const tier0Talent = this.getTier0TalentForPath(mainPath);
    return unlockedTalents.filter((id) => id !== tier0Talent);
  }

  /**
   * Get talent selection state for a level (creation or level-up mode)
   * Includes all data needed by frontend + spent points for UI feedback
   */
  getTalentSelectionState(
    characterId: string,
    level: number,
    isCreationMode: boolean
  ): TalentSelectionResponse {
    const character = db.loadCharacter(characterId);

    if (!character) {
      throw new Error(`Character not found: ${characterId}`);
    }

    const mainPath = character.paths?.[0] || null;
    const unlockedTalents = character.unlockedTalents || [];
    const tier0TalentId = this.getTier0TalentForPath(mainPath);

    // Get previously selected talents (baseline = all except tier 0)
    const previouslySelected = this.getBaselineTalents(unlockedTalents, mainPath);

    // Calculate talent points available
    const availablePoints = this.calculateAvailableTalentPoints(
      level,
      unlockedTalents,
      mainPath,
      isCreationMode ? [] : previouslySelected
    );

    // Get spent points tracking for all levels up to current
    const spentTalents: Record<string, number> = {};
    for (let i = 1; i <= level; i++) {
      const spent = db.getSpentPoints(characterId, 'talents', i) || 0;
      spentTalents[i] = spent;
    }

    return {
      talentPoints: availablePoints,
      previouslySelectedTalents: previouslySelected,
      unlockedTalents,
      spentPoints: { talents: spentTalents },
      lockedTalents: isCreationMode ? [] : previouslySelected,
      requiresSingerSelection: this.requiresSingerSelection(character.ancestry, level),
      tier0TalentId
    };
  }

  /**
   * Save talent selections for a level
   */
  saveTalentSelections(
    characterId: string,
    talentIds: string[],
    level: number,
    mainPath: string | null
  ): { success: boolean; error?: string } {
    // Validate point allocation
    const validation = this.validateTalentPoints(level, talentIds, mainPath, []);
    if (!validation.valid) {
      return { success: false, error: validation.message };
    }

    try {
      // Unlock the talents (database handles spent points tracking)
      const result = db.unlockTalent(characterId, talentIds, level);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      console.log(`[TalentService] Saved talent selections for ${characterId} at level ${level}`);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[TalentService] Error saving talents for ${characterId}:`, message);
      return { success: false, error: message };
    }
  }
}

export default TalentService;
