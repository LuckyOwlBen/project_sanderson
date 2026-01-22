/**
 * Consolidated Talent System Rules
 * 
 * This module contains all talent-related business logic including:
 * - Talent point calculation
 * - Tier 0 talent mappings
 * - Singer ancestry special rules
 * - Prerequisite validation
 */

// Talent points awarded at each level
const TALENT_POINTS_PER_LEVEL = [
  2, // Level 1
  1, 1, 1, 1, // Levels 2-5
  2, // Level 6 (bonus)
  1, 1, 1, 1, // Levels 7-10
  2, // Level 11 (bonus)
  1, 1, 1, 1, // Levels 12-15
  2, // Level 16 (bonus)
  1, 1, 1, 1, 1 // Levels 17-21
];

// Path tier 0 talent mappings (free talent granted when path is selected)
const PATH_TIER0_TALENTS = {
  'warrior': 'vigilant_stance',
  'scholar': 'education',
  'hunter': 'seek_quarry',
  'leader': 'decisive_command',
  'envoy': 'rousing_presence',
  'agent': 'opportunist'
};

/**
 * Get the tier 0 talent ID for a given path
 * @param {string} pathId - The path identifier (e.g., 'warrior')
 * @returns {string|null} The talent ID or null if not found
 */
function getTier0TalentForPath(pathId) {
  return PATH_TIER0_TALENTS[pathId] || null;
}

/**
 * Calculate total talent points available for a character up to a given level
 * @param {number} level - Character level (1-21)
 * @returns {number} Total talent points
 */
function calculateTotalTalentPoints(level) {
  if (level < 1 || level > 21) {
    return 0;
  }
  
  let total = 0;
  for (let i = 0; i < level; i++) {
    total += TALENT_POINTS_PER_LEVEL[i];
  }
  return total;
}

/**
 * Calculate talent points for a specific level
 * @param {number} level - Character level (1-21)
 * @returns {number} Talent points for that level
 */
function getTalentPointsForLevel(level) {
  if (level < 1 || level > 21) {
    return 0;
  }
  return TALENT_POINTS_PER_LEVEL[level - 1];
}

/**
 * Determine if a character should be forced to select from Singer tree
 * Currently applies to singer ancestry at level 1, but can be extended to other levels
 * @param {string} ancestry - Character ancestry
 * @param {number} level - Character level
 * @returns {boolean} True if Singer tree selection is required
 */
function requiresSingerSelection(ancestry, level) {
  return ancestry === 'singer' && level === 1;
}

/**
 * Count how many talent points are spent (excluding tier 0 talents)
 * @param {string[]} unlockedTalents - Array of unlocked talent IDs
 * @param {string} mainPath - Character's main path (for tier 0 exclusion)
 * @returns {number} Number of points spent
 */
function countSpentTalentPoints(unlockedTalents, mainPath) {
  const tier0Talent = getTier0TalentForPath(mainPath);
  
  return unlockedTalents.filter(talentId => {
    // Tier 0 talent doesn't cost points
    return talentId !== tier0Talent;
  }).length;
}

/**
 * Calculate available talent points for character creation or level-up
 * @param {number} level - Character level
 * @param {string[]} unlockedTalents - Currently unlocked talents
 * @param {string} mainPath - Character's main path
 * @param {string[]} previouslySelectedTalents - Talents from previous level-ups (empty for new characters)
 * @returns {number} Available points to spend
 */
function calculateAvailableTalentPoints(level, unlockedTalents, mainPath, previouslySelectedTalents = []) {
  const totalPoints = calculateTotalTalentPoints(level);
  
  // For level-up: only count NEW talents (not previously selected)
  if (previouslySelectedTalents.length > 0) {
    const tier0Talent = getTier0TalentForPath(mainPath);
    // Exclude tier 0 talent from counting against level-up points
    const newTalents = unlockedTalents.filter(id => id !== tier0Talent && !previouslySelectedTalents.includes(id));
    return getTalentPointsForLevel(level) - newTalents.length;
  }
  
  // For character creation: count all talents except tier 0
  const spentPoints = countSpentTalentPoints(unlockedTalents, mainPath);
  return totalPoints - spentPoints;
}

/**
 * Validate that talent selections don't exceed available points
 * @param {number} level - Character level
 * @param {string[]} unlockedTalents - All unlocked talents
 * @param {string} mainPath - Character's main path
 * @param {string[]} previouslySelectedTalents - Talents from previous level-ups
 * @returns {{valid: boolean, message: string}} Validation result
 */
function validateTalentPoints(level, unlockedTalents, mainPath, previouslySelectedTalents = []) {
  const availablePoints = calculateAvailableTalentPoints(level, unlockedTalents, mainPath, previouslySelectedTalents);
  
  if (availablePoints < 0) {
    const overspent = Math.abs(availablePoints);
    return {
      valid: false,
      message: `Talent point limit exceeded by ${overspent} point(s)`
    };
  }
  
  return { valid: true, message: 'Valid' };
}

module.exports = {
  TALENT_POINTS_PER_LEVEL,
  PATH_TIER0_TALENTS,
  getTier0TalentForPath,
  calculateTotalTalentPoints,
  getTalentPointsForLevel,
  requiresSingerSelection,
  countSpentTalentPoints,
  calculateAvailableTalentPoints,
  validateTalentPoints
};
