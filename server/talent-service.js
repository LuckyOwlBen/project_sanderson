/**
 * Talent Service Bridge
 * 
 * Provides JavaScript access to TalentService business logic.
 * Pure utility functions for talent calculations and state management.
 * Does not depend on database layer - that's handled by server.js.
 */

// Talent points per level (from talent-rules.js)
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

// Get tier 0 talent for path
function getTier0TalentForPath(pathId) {
  if (!pathId) return null;
  
  const PATH_TIER0_TALENTS = {
    'warrior': 'vigilant_stance',
    'scholar': 'education',
    'hunter': 'seek_quarry',
    'leader': 'decisive_command',
    'envoy': 'rousing_presence',
    'agent': 'opportunist'
  };
  
  return PATH_TIER0_TALENTS[pathId] || null;
}

/**
 * Calculate total talent points available from level 1 to a given level
 */
function calculateTotalTalentPoints(level) {
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
function getTalentPointsForLevel(level) {
  if (level < 1 || level > 21) return 0;
  return TALENT_POINTS_PER_LEVEL[level - 1];
}

/**
 * Check if character is required to select from Singer tree
 */
function requiresSingerSelection(ancestry, level) {
  return ancestry === 'singer' && level === 1;
}

/**
 * Count how many talent points have been spent (excluding tier 0)
 */
function countSpentTalentPoints(unlockedTalents, mainPath) {
  const tier0Talent = getTier0TalentForPath(mainPath);
  
  return unlockedTalents.filter((talentId) => talentId !== tier0Talent).length;
}

/**
 * Calculate available talent points for allocation
 */
function calculateAvailableTalentPoints(
  level,
  unlockedTalents,
  mainPath,
  previouslySelectedTalents = []
) {
  const totalPoints = calculateTotalTalentPoints(level);
  const tier0Talent = getTier0TalentForPath(mainPath);

  if (previouslySelectedTalents.length > 0) {
    // LEVEL-UP: count only new talents selected at this level
    const newTalents = unlockedTalents.filter(
      (id) => id !== tier0Talent && !previouslySelectedTalents.includes(id)
    );
    return getTalentPointsForLevel(level) - newTalents.length;
  }

  // CHARACTER CREATION: count all non-tier0 talents against cumulative total
  const spentPoints = countSpentTalentPoints(unlockedTalents, mainPath);
  return totalPoints - spentPoints;
}

/**
 * Validate that talent selections don't exceed available points
 */
function validateTalentPoints(
  level,
  unlockedTalents,
  mainPath,
  previouslySelectedTalents = []
) {
  const availablePoints = calculateAvailableTalentPoints(
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
 */
function getBaselineTalents(unlockedTalents, mainPath) {
  const tier0Talent = getTier0TalentForPath(mainPath);
  return unlockedTalents.filter((id) => id !== tier0Talent);
}

/**
 * Ensure tier 0 talent is unlocked for a character's main path
 * Returns object with {unlocked: boolean, talentId: string}
 * NOTE: Actual database updates happen in server.js
 */
function ensureTier0Unlocked(characterId, mainPath, currentTalents = []) {
  const tier0TalentId = getTier0TalentForPath(mainPath);

  if (!tier0TalentId) {
    return { unlocked: false, talentId: null };
  }

  // Check if already unlocked
  if (currentTalents && currentTalents.includes(tier0TalentId)) {
    return { unlocked: true, talentId: tier0TalentId };
  }

  // In real scenario, database would unlock it
  // Server.js handles the actual persistence
  return { unlocked: true, talentId: tier0TalentId, needsUnlock: true };
}

/**
 * Get talent selection state for a level (creation or level-up mode)
 * Character data is passed in from server.js
 */
function getTalentSelectionState(character, level, isCreationMode) {
  if (!character) {
    throw new Error(`Character data required`);
  }

  const mainPath = character.paths?.[0] || character.mainPath || null;
  const unlockedTalents = character.unlockedTalents || [];
  const tier0TalentId = getTier0TalentForPath(mainPath);

  // Get previously selected talents (baseline = all except tier 0)
  const previouslySelected = getBaselineTalents(unlockedTalents, mainPath);

  // Calculate talent points available
  const availablePoints = calculateAvailableTalentPoints(
    level,
    unlockedTalents,
    mainPath,
    isCreationMode ? [] : previouslySelected
  );

  // Build spent points tracking (simplified - count actual talents spent)
  const spentTalents = {};
  for (let i = 1; i <= level; i++) {
    // In simplified version, just count total non-tier0 talents selected
    if (i === level) {
      spentTalents[i] = previouslySelected.length;
    }
  }

  return {
    talentPoints: availablePoints,
    previouslySelectedTalents: previouslySelected,
    unlockedTalents,
    spentPoints: { talents: spentTalents },
    lockedTalents: isCreationMode ? [] : previouslySelected,
    requiresSingerSelection: requiresSingerSelection(character.ancestry, level),
    tier0TalentId
  };
}

/**
 * Validate and prepare talent selections for saving
 * Returns validation result with suggested updates
 */
function saveTalentSelections(character, talentIds, level, mainPath) {
  // Validate point allocation
  const unlockedTalents = character.unlockedTalents || [];
  const validation = validateTalentPoints(level, talentIds, mainPath, []);
  
  if (!validation.valid) {
    return { success: false, error: validation.message };
  }

  try {
    // Return what needs to be saved (server.js handles actual DB persistence)
    return {
      success: true,
      talentsToUnlock: talentIds,
      level: level,
      mainPath: mainPath,
      message: `Ready to save ${talentIds.length} talents at level ${level}`
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[TalentService] Error validating talents:`, message);
    return { success: false, error: message };
  }
}

/**
 * Validate talent selection (for use in endpoint validation)
 */
function validateTalentSelection(character, talentIds, level, mainPath) {
  const unlockedTalents = character.unlockedTalents || [];
  const validation = validateTalentPoints(level, talentIds, mainPath, []);
  
  return {
    isValid: validation.valid,
    error: validation.message
  };
}

module.exports = {
  getTier0TalentForPath,
  calculateTotalTalentPoints,
  getTalentPointsForLevel,
  requiresSingerSelection,
  countSpentTalentPoints,
  calculateAvailableTalentPoints,
  validateTalentPoints,
  getBaselineTalents,
  ensureTier0Unlocked,
  getTalentSelectionState,
  saveTalentSelections,
  validateTalentSelection
};
