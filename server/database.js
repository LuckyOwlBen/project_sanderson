/**
 * Database Service Layer (JavaScript version for Node.js)
 * 
 * Provides abstraction over Prisma for character CRUD operations and transaction-safe
 * talent/attribute management. Uses Prisma transactions to prevent data corruption.
 */

const { PrismaClient } = require('@prisma/client');

// Initialize Prisma Client with SQLite database
const prisma = new PrismaClient();

/**
 * Load a character from the database by ID
 * @param {string} characterId - The character ID to load
 * @returns {Promise<Object|null>} The character data or null if not found
 */
async function loadCharacter(characterId) {
  try {
    const char = await prisma.character.findUnique({
      where: { id: characterId },
      include: {
        attributes: true,
        skills: true,
        talents: true,
        expertises: true,
        resources: true,
        radiantPath: true,
        singerForms: true,
        cultures: true,
        paths: true,
        inventory: true,
        spentPoints: true
      }
    });

    if (!char) return null;

    // Serialize database models back to character format
    return serializeCharacter(char);
  } catch (error) {
    console.error(`[Database] Error loading character ${characterId}:`, error);
    throw error;
  }
}

/**
 * Save a character to the database
 * @param {Object} character - The character data to save
 * @param {Object} spentPointsTracking - Optional tracking of spent points
 * @returns {Promise<Object>} Save result with success status and character ID
 */
async function saveCharacter(character, spentPointsTracking) {
  try {
    // Use transaction for atomic save
    const result = await prisma.$transaction(async (tx) => {
      // Create or update character
      const savedChar = await tx.character.upsert({
        where: { id: character.id },
        create: {
          id: character.id,
          name: character.name,
          level: character.level,
          pendingLevelPoints: character.pendingLevelPoints,
          ancestry: character.ancestry,
          sessionNotes: character.sessionNotes,
          lastModified: new Date(character.lastModified)
        },
        update: {
          name: character.name,
          level: character.level,
          pendingLevelPoints: character.pendingLevelPoints,
          ancestry: character.ancestry,
          sessionNotes: character.sessionNotes,
          lastModified: new Date(character.lastModified)
        }
      });

      // Save attributes
      if (character.attributes) {
        await tx.attributes.upsert({
          where: { characterId: character.id },
          create: {
            characterId: character.id,
            strength: character.attributes.strength ?? 2,
            speed: character.attributes.speed ?? 2,
            intellect: character.attributes.intellect ?? 2,
            willpower: character.attributes.willpower ?? 2,
            awareness: character.attributes.awareness ?? 2,
            presence: character.attributes.presence ?? 2
          },
          update: {
            strength: character.attributes.strength ?? 2,
            speed: character.attributes.speed ?? 2,
            intellect: character.attributes.intellect ?? 2,
            willpower: character.attributes.willpower ?? 2,
            awareness: character.attributes.awareness ?? 2,
            presence: character.attributes.presence ?? 2
          }
        });
      }

      // Save skills
      if (character.skills) {
        // Delete old skills and create new ones
        await tx.skill.deleteMany({ where: { characterId: character.id } });
        for (const [skillName, value] of Object.entries(character.skills)) {
          await tx.skill.create({
            data: {
              characterId: character.id,
              skillName,
              value
            }
          });
        }
      }

      // Save resources
      if (character.resources) {
        await tx.characterResources.upsert({
          where: { characterId: character.id },
          create: {
            characterId: character.id,
            healthCurrent: character.resources.health?.current ?? 0,
            healthMax: character.resources.health?.max ?? 0,
            focusCurrent: character.resources.focus?.current ?? 0,
            focusMax: character.resources.focus?.max ?? 0,
            investitureCurrent: character.resources.investiture?.current ?? 0,
            investitureMax: character.resources.investiture?.max ?? 0,
            investitureActive: character.resources.investiture?.isActive ?? false
          },
          update: {
            healthCurrent: character.resources.health?.current ?? 0,
            healthMax: character.resources.health?.max ?? 0,
            focusCurrent: character.resources.focus?.current ?? 0,
            focusMax: character.resources.focus?.max ?? 0,
            investitureCurrent: character.resources.investiture?.current ?? 0,
            investitureMax: character.resources.investiture?.max ?? 0,
            investitureActive: character.resources.investiture?.isActive ?? false
          }
        });
      }

      // Track spent points if provided
      if (spentPointsTracking) {
        const spent = await tx.spentPoints.findUnique({
          where: { characterId: character.id }
        });

        const attributes = spent?.attributes ? JSON.parse(spent.attributes) : {};
        const skills = spent?.skills ? JSON.parse(spent.skills) : {};
        const talents = spent?.talents ? JSON.parse(spent.talents) : {};

        if (spentPointsTracking.attributes !== undefined) {
          attributes[spentPointsTracking.level] = spentPointsTracking.attributes;
        }
        if (spentPointsTracking.skills !== undefined) {
          skills[spentPointsTracking.level] = spentPointsTracking.skills;
        }
        if (spentPointsTracking.talents !== undefined) {
          talents[spentPointsTracking.level] = spentPointsTracking.talents;
        }

        await tx.spentPoints.upsert({
          where: { characterId: character.id },
          create: {
            characterId: character.id,
            attributes: JSON.stringify(attributes),
            skills: JSON.stringify(skills),
            talents: JSON.stringify(talents)
          },
          update: {
            attributes: JSON.stringify(attributes),
            skills: JSON.stringify(skills),
            talents: JSON.stringify(talents)
          }
        });
      }

      return savedChar;
    });

    console.log(`[Database] Saved character: ${character.name} (${character.id})`);
    return { success: true, id: result.id };
  } catch (error) {
    console.error(`[Database] Error saving character ${character.id}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Unlock talents for a character atomically
 * @param {string} characterId - The character ID
 * @param {string[]} talentIds - Array of talent IDs to unlock
 * @param {number} level - The level at which talents are being unlocked
 * @returns {Promise<Object>} Result with list of all unlocked talents
 */
async function unlockTalent(characterId, talentIds, level) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Verify character exists
      const char = await tx.character.findUnique({ where: { id: characterId } });
      if (!char) {
        throw new Error(`Character not found: ${characterId}`);
      }

      // Get current talents
      const existingTalents = await tx.unlockedTalent.findMany({
        where: { characterId }
      });
      const existingIds = new Set(existingTalents.map(t => t.talentId));

      // Only create talents that don't already exist
      const newTalents = talentIds.filter(id => !existingIds.has(id));
      
      for (const talentId of newTalents) {
        await tx.unlockedTalent.create({
          data: {
            characterId,
            talentId,
            level
          }
        });
      }

      // Get all unlocked talents
      const allTalents = await tx.unlockedTalent.findMany({
        where: { characterId }
      });

      // Update spent points tracking
      const spentPoints = await tx.spentPoints.findUnique({
        where: { characterId }
      });

      const talents = spentPoints?.talents ? JSON.parse(spentPoints.talents) : {};
      talents[level] = (talents[level] ?? 0) + newTalents.length;

      await tx.spentPoints.upsert({
        where: { characterId },
        create: {
          characterId,
          talents: JSON.stringify(talents),
          attributes: '{}',
          skills: '{}'
        },
        update: {
          talents: JSON.stringify(talents)
        }
      });

      return allTalents.map(t => t.talentId);
    });

    console.log(`[Database] Unlocked talents for ${characterId}: ${talentIds.join(', ')}`);
    return { success: true, unlockedTalents: result };
  } catch (error) {
    console.error(`[Database] Error unlocking talents for ${characterId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Get available talent points for a level
 * @param {string} characterId - The character ID
 * @param {number} level - The level to check
 * @returns {Promise<number>} Number of available talent points
 */
async function getTalentPoints(characterId, level) {
  try {
    // This is a placeholder - actual calculation should come from talent-rules.js
    const TALENT_POINTS_PER_LEVEL = [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3];
    return TALENT_POINTS_PER_LEVEL[level - 1] ?? 0;
  } catch (error) {
    console.error(`[Database] Error getting talent points for ${characterId}:`, error);
    return 0;
  }
}

/**
 * Get amount spent on a category at a specific level
 * @param {string} characterId - The character ID
 * @param {'attributes'|'skills'|'talents'} category - The category
 * @param {number} level - The level to check
 * @returns {Promise<number>} Number of points spent at that level
 */
async function getSpentPoints(characterId, category, level) {
  try {
    const spentPoints = await prisma.spentPoints.findUnique({
      where: { characterId }
    });

    if (!spentPoints) return 0;

    let data = {};
    if (category === 'attributes' && spentPoints.attributes) {
      data = JSON.parse(spentPoints.attributes);
    } else if (category === 'skills' && spentPoints.skills) {
      data = JSON.parse(spentPoints.skills);
    } else if (category === 'talents' && spentPoints.talents) {
      data = JSON.parse(spentPoints.talents);
    }

    return data[level] ?? 0;
  } catch (error) {
    console.error(
      `[Database] Error getting spent points for ${characterId}/${category}/${level}:`,
      error
    );
    return 0;
  }
}

/**
 * List all characters (summary view)
 * @returns {Promise<Object[]>} Array of character summaries
 */
async function listCharacters() {
  try {
    const chars = await prisma.character.findMany({
      include: {
        attributes: true,
        skills: true,
        talents: true,
        expertises: true,
        resources: true,
        radiantPath: true,
        singerForms: true,
        cultures: true,
        paths: true,
        inventory: true,
        spentPoints: true
      },
      orderBy: { lastModified: 'desc' }
    });

    return chars.map(c => serializeCharacter(c));
  } catch (error) {
    console.error('[Database] Error listing characters:', error);
    throw error;
  }
}

/**
 * Delete a character
 * @param {string} characterId - The character ID to delete
 * @returns {Promise<Object>} Delete result
 */
async function deleteCharacter(characterId) {
  try {
    await prisma.character.delete({
      where: { id: characterId }
    });

    console.log(`[Database] Deleted character: ${characterId}`);
    return { success: true, id: characterId };
  } catch (error) {
    if (error.code === 'P2025') {
      return { success: false, error: 'Character not found' };
    }
    console.error(`[Database] Error deleting character ${characterId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Clear all data from database (for testing only)
 */
async function clearDatabase() {
  try {
    await prisma.unlockedSingerForm.deleteMany({});
    await prisma.unlockedTalent.deleteMany({});
    await prisma.selectedExpertise.deleteMany({});
    await prisma.inventoryItem.deleteMany({});
    await prisma.skill.deleteMany({});
    await prisma.characterResources.deleteMany({});
    await prisma.radiantPath.deleteMany({});
    await prisma.spentPoints.deleteMany({});
    await prisma.attributes.deleteMany({});
    await prisma.cultureSelection.deleteMany({});
    await prisma.pathSelection.deleteMany({});
    await prisma.character.deleteMany({});

    console.log('[Database] Database cleared');
  } catch (error) {
    console.error('[Database] Error clearing database:', error);
    throw error;
  }
}

/**
 * Serialize database models back to character format
 * @private
 */
function serializeCharacter(dbChar) {
  return {
    id: dbChar.id,
    name: dbChar.name,
    level: dbChar.level,
    pendingLevelPoints: dbChar.pendingLevelPoints,
    ancestry: dbChar.ancestry,
    sessionNotes: dbChar.sessionNotes,
    lastModified: dbChar.lastModified.toISOString(),
    cultures: dbChar.cultures || [],
    paths: (dbChar.paths || []).map(p => p.pathName),
    attributes: dbChar.attributes ? {
      strength: dbChar.attributes.strength,
      speed: dbChar.attributes.speed,
      intellect: dbChar.attributes.intellect,
      willpower: dbChar.attributes.willpower,
      awareness: dbChar.attributes.awareness,
      presence: dbChar.attributes.presence
    } : {},
    skills: (dbChar.skills || []).reduce((acc, skill) => {
      acc[skill.skillName] = skill.value;
      return acc;
    }, {}),
    unlockedTalents: (dbChar.talents || []).map(t => t.talentId),
    selectedExpertises: dbChar.expertises || [],
    inventory: dbChar.inventory || [],
    resources: dbChar.resources ? {
      health: { current: dbChar.resources.healthCurrent, max: dbChar.resources.healthMax },
      focus: { current: dbChar.resources.focusCurrent, max: dbChar.resources.focusMax },
      investiture: {
        current: dbChar.resources.investitureCurrent,
        max: dbChar.resources.investitureMax,
        isActive: dbChar.resources.investitureActive
      }
    } : undefined
  };
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
});

module.exports = {
  loadCharacter,
  saveCharacter,
  unlockTalent,
  getTalentPoints,
  getSpentPoints,
  listCharacters,
  deleteCharacter,
  clearDatabase,
  default: prisma
};
