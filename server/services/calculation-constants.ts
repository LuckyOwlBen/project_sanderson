/**
 * Calculation Constants Service
 * 
 * Single source of truth for all point-per-level arrays and derived calculations.
 * These values define character progression and must be consistent across frontend and backend.
 * 
 * Any changes to these values must be validated against game design documentation.
 */

// ============================================================================
// POINT ALLOCATION TABLES
// ============================================================================

export const ATTRIBUTE_POINTS_PER_LEVEL = [
  12, // Level 1: 12 points
  0,  // Level 2: 0 points
  1,  // Level 3: +1 point
  0,  // Level 4: 0 points
  0,  // Level 5: 0 points
  1,  // Level 6: +1 point
  0,  // Level 7: 0 points
  0,  // Level 8: 0 points
  1,  // Level 9: +1 point
  0,  // Level 10: 0 points
  0,  // Level 11: 0 points
  1,  // Level 12: +1 point
  0,  // Level 13: 0 points
  0,  // Level 14: 0 points
  1,  // Level 15: +1 point
  0,  // Level 16: 0 points
  0,  // Level 17: 0 points
  1,  // Level 18: +1 point
  0,  // Level 19: 0 points
  0,  // Level 20: 0 points
  0   // Level 21: 0 points
];

export const SKILL_POINTS_PER_LEVEL = [
  4, // Level 1: 4 points
  2, // Level 2+: 2 per level
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2  // Level 21: 2 points
];

export const TALENT_POINTS_PER_LEVEL = [
  2, // Level 1: 2 points (tier 0 + 1 tier 1)
  1, // Level 2: 1 point
  1, // Level 3: 1 point
  1, // Level 4: 1 point
  1, // Level 5: 1 point
  2, // Level 6: 2 points (bonus level)
  1, // Level 7: 1 point
  1, // Level 8: 1 point
  1, // Level 9: 1 point
  1, // Level 10: 1 point
  2, // Level 11: 2 points (bonus level)
  1, // Level 12: 1 point
  1, // Level 13: 1 point
  1, // Level 14: 1 point
  1, // Level 15: 1 point
  2, // Level 16: 2 points (bonus level)
  1, // Level 17: 1 point
  1, // Level 18: 1 point
  1, // Level 19: 1 point
  1, // Level 20: 1 point
  1  // Level 21: 1 point
];

// Health and skill progression
export const HEALTH_PER_LEVEL = [
  10, // Level 1: 10 + STR
  5,  // Levels 2-5: +5
  5,
  5,
  5,
  4,  // Levels 6-10: +4
  4,
  4,
  4,
  4,
  3,  // Levels 11-15: +3
  3,
  3,
  3,
  3,
  2,  // Levels 16-20: +2
  2,
  2,
  2,
  2,
  1   // Level 21: +1
];

export const HEALTH_STRENGTH_BONUS_LEVELS = [1, 6, 11, 16, 21];

export const MAX_SKILL_RANKS_PER_LEVEL = [
  2, // Levels 1-5: max 2
  2,
  2,
  2,
  2,
  3, // Levels 6-10: max 3
  3,
  3,
  3,
  3,
  4, // Levels 11-15: max 4
  4,
  4,
  4,
  4,
  5, // Levels 16-21: max 5
  5,
  5,
  5,
  5,
  5
];

export const SKILL_RANKS_PER_LEVEL = [
  5, // Level 1: 5 ranks
  2, // Levels 2-20: 2 ranks per level
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  0  // Level 21: 0 ranks (terminal level)
];

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

/**
 * Get points available for a specific level
 */
export function getAttributePointsForLevel(level: number): number {
  return ATTRIBUTE_POINTS_PER_LEVEL[level - 1] ?? 0;
}

export function getTotalAttributePointsUpToLevel(level: number): number {
  let total = 0;
  for (let i = 0; i < level && i < ATTRIBUTE_POINTS_PER_LEVEL.length; i++) {
    total += ATTRIBUTE_POINTS_PER_LEVEL[i];
  }
  return total;
}

export function getSkillPointsForLevel(level: number): number {
  return SKILL_POINTS_PER_LEVEL[level - 1] ?? 0;
}

export function getTotalSkillPointsUpToLevel(level: number): number {
  let total = 0;
  for (let i = 0; i < level && i < SKILL_POINTS_PER_LEVEL.length; i++) {
    total += SKILL_POINTS_PER_LEVEL[i];
  }
  return total;
}

export function getTalentPointsForLevel(level: number): number {
  return TALENT_POINTS_PER_LEVEL[level - 1] ?? 0;
}

export function getTotalTalentPointsUpToLevel(level: number): number {
  let total = 0;
  for (let i = 0; i < level && i < TALENT_POINTS_PER_LEVEL.length; i++) {
    total += TALENT_POINTS_PER_LEVEL[i];
  }
  return total;
}

export function getHealthForLevel(level: number, strengthModifier: number = 0): number {
  let baseHealth = HEALTH_PER_LEVEL[level - 1] ?? 0;
  if (HEALTH_STRENGTH_BONUS_LEVELS.includes(level)) {
    baseHealth += strengthModifier;
  }
  return baseHealth;
}

export function getMaxSkillRanksForLevel(level: number): number {
  return MAX_SKILL_RANKS_PER_LEVEL[level - 1] ?? 0;
}

export function getSkillRanksForLevel(level: number): number {
  return SKILL_RANKS_PER_LEVEL[level - 1] ?? 0;
}

/**
 * Get all calculation constants as a single object (for API responses)
 */
export function getAllCalculationTables() {
  return {
    attributePointsPerLevel: ATTRIBUTE_POINTS_PER_LEVEL,
    skillPointsPerLevel: SKILL_POINTS_PER_LEVEL,
    talentPointsPerLevel: TALENT_POINTS_PER_LEVEL,
    healthPerLevel: HEALTH_PER_LEVEL,
    healthStrengthBonusLevels: HEALTH_STRENGTH_BONUS_LEVELS,
    maxSkillRanksPerLevel: MAX_SKILL_RANKS_PER_LEVEL,
    skillRanksPerLevel: SKILL_RANKS_PER_LEVEL
  };
}
