const fs = require('fs').promises;
const path = require('path');

const CHARACTERS_DIR = path.join(__dirname, '..', 'characters');

// Level-up tables (matching server.js)
const LEVEL_TABLES = {
  attributePointsPerLevel: [12, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0],
  healthPerLevel: [10, 5, 5, 5, 5, 4, 4, 4, 4, 4, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 1],
  healthStrengthBonusLevels: [1, 6, 11, 16, 21]
};

/**
 * Calculate derived stats from attributes
 */
function calculateDerivedStats(attributes, level) {
  const { strength, speed, intellect, willpower, awareness } = attributes;
  
  // Health calculation
  let healthMax = 0;
  for (let lvl = 1; lvl <= level; lvl++) {
    healthMax += LEVEL_TABLES.healthPerLevel[lvl - 1] || 0;
    if (LEVEL_TABLES.healthStrengthBonusLevels.includes(lvl)) {
      healthMax += Math.floor(strength / 2);
    }
  }
  
  // Focus calculation
  const focusMax = intellect + willpower;
  
  // Movement calculation (base 6 + speed bonus)
  const movement = 6 + Math.floor(speed / 2);
  
  // Recovery die based on strength
  let recoveryDie = 6;
  if (strength >= 8) recoveryDie = 8;
  if (strength >= 12) recoveryDie = 10;
  if (strength >= 16) recoveryDie = 12;
  
  // Defenses (simple calculation - actual might be more complex)
  const fortitude = 10 + Math.floor(strength / 2);
  const reflex = 10 + Math.floor(speed / 2);
  const will = 10 + Math.floor(willpower / 2);
  
  return {
    healthMax,
    focusMax,
    movement,
    recoveryDie,
    defenses: {
      fortitude,
      reflex,
      will
    }
  };
}

/**
 * Get attribute data for a character
 * @param {string} characterId - The character ID
 * @returns {Promise<Object>} Attribute data including current scores, available points, and derived stats
 */
async function getAttributeData(characterId) {
  const characterPath = path.join(CHARACTERS_DIR, `character_${characterId}.json`);
  
  try {
    const data = await fs.readFile(characterPath, 'utf8');
    const character = JSON.parse(data);
    
    const level = character.level || 1;
    const totalPoints = LEVEL_TABLES.attributePointsPerLevel[level - 1] || 0;
    
    // Get current attributes
    const attributes = character.attributes || {
      strength: 0,
      speed: 0,
      intellect: 0,
      willpower: 0,
      awareness: 0,
      presence: 0
    };
    
    // Calculate derived stats
    const derivedStats = calculateDerivedStats(attributes, level);
    
    return {
      id: characterId,
      level,
      totalPoints,
      attributes,
      derivedStats
    };
  } catch (error) {
    throw new Error(`Failed to load character: ${error.message}`);
  }
}

/**
 * Submit attribute data for a character
 * @param {string} characterId - The character ID
 * @param {Object} attributes - The attributes to save
 * @returns {Promise<Object>} Updated character data
 */
async function submitAttributeData(characterId, attributes) {
  const characterPath = path.join(CHARACTERS_DIR, `character_${characterId}.json`);
  
  try {
    const data = await fs.readFile(characterPath, 'utf8');
    const character = JSON.parse(data);
    
    const level = character.level || 1;
    const totalPoints = LEVEL_TABLES.attributePointsPerLevel[level - 1] || 0;
    
    // Validate attribute keys
    const validKeys = ['strength', 'speed', 'intellect', 'willpower', 'awareness', 'presence'];
    const attributeKeys = Object.keys(attributes);
    
    for (const key of attributeKeys) {
      if (!validKeys.includes(key)) {
        throw new Error(`Invalid attribute: ${key}`);
      }
      if (typeof attributes[key] !== 'number' || attributes[key] < 0) {
        throw new Error(`Invalid value for ${key}: must be a non-negative number`);
      }
    }
    
    // Calculate total allocated points
    const allocatedPoints = Object.values(attributes).reduce((sum, val) => sum + val, 0);
    
    if (allocatedPoints !== totalPoints) {
      throw new Error(`Invalid allocation: expected ${totalPoints} points, got ${allocatedPoints}`);
    }
    
    // Update character attributes
    character.attributes = {
      strength: attributes.strength || 0,
      speed: attributes.speed || 0,
      intellect: attributes.intellect || 0,
      willpower: attributes.willpower || 0,
      awareness: attributes.awareness || 0,
      presence: attributes.presence || 0
    };
    
    character.lastModified = new Date().toISOString();
    
    // Save to file
    await fs.writeFile(characterPath, JSON.stringify(character, null, 2), 'utf8');
    
    // Calculate derived stats for response
    const derivedStats = calculateDerivedStats(character.attributes, level);
    
    return {
      success: true,
      id: characterId,
      level,
      attributes: character.attributes,
      derivedStats,
      lastModified: character.lastModified
    };
  } catch (error) {
    throw new Error(`Failed to save attributes: ${error.message}`);
  }
}

module.exports = {
  getAttributeData,
  submitAttributeData
};
