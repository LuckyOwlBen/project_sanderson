import { getDbInstance } from '../database';

const db = getDbInstance();

// ============================================================================
// TIER 0 TALENT MAPPING
// ============================================================================
// Single source of truth for path -> tier 0 talent mapping
export const PATH_TIER0_TALENTS: Record<string, string> = {
  'warrior': 'vigilant_stance',
  'scholar': 'education',
  'hunter': 'seek_quarry',
  'leader': 'decisive_command',
  'envoy': 'rousing_presence',
  'agent': 'opportunist'
};

/**
 * Get tier 0 talent for a given path
 */
export function getTier0TalentForPath(pathId: string | null): string | null {
  if (!pathId) return null;
  return PATH_TIER0_TALENTS[pathId] || null;
}

export interface TalentResult {
  success: boolean;
  unlockedTalents?: string[];
  error?: string;
}

/**
 * Unlock talents atomically with transaction safety
 */
export async function unlockTalent(
  characterId: string,
  talentIds: string[],
  level: number
): Promise<TalentResult> {
  if (!db) throw new Error('Database not initialized');
  try {
    await db.run('BEGIN TRANSACTION');
    // Verify character exists
    const char = await db.get('SELECT id FROM Character WHERE id = ?', characterId);
    if (!char) {
      throw new Error(`Character not found: ${characterId}`);
    }

    // Get current talents
    const existing = await db.all('SELECT talentId FROM UnlockedTalent WHERE characterId = ?', characterId);
    const existingIds = new Set(existing.map((t: any) => t.talentId));

    // Only create talents that don't already exist
    const newTalents = talentIds.filter(id => !existingIds.has(id));
    const now = new Date().toISOString();
    for (const talentId of newTalents) {
      await db.run(
        `INSERT INTO UnlockedTalent (id, characterId, talentId, unlockedAt, level) VALUES (?, ?, ?, ?, ?)`,
        `talent-${characterId}-${talentId}`,
        characterId,
        talentId,
        now,
        level
      );
    }

    // Get all unlocked talents
    const allTalents = await db.all('SELECT talentId FROM UnlockedTalent WHERE characterId = ?', characterId);

    // Update spent points tracking
    const spent = await db.get('SELECT * FROM SpentPoints WHERE characterId = ?', characterId);
    const talents = spent?.talents ? JSON.parse(spent.talents) : {};
    talents[level] = (talents[level] ?? 0) + newTalents.length;

    await db.run(
      `INSERT INTO SpentPoints (id, characterId, talents, attributes, skills)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(characterId) DO UPDATE SET talents = excluded.talents`,
      `spent-${characterId}`,
      characterId,
      JSON.stringify(talents),
      spent?.attributes ?? '{}',
      spent?.skills ?? '{}'
    );

    await db.run('COMMIT');
    console.log(`[Database] Unlocked talents for ${characterId}: ${talentIds.join(', ')}`);
    return { success: true, unlockedTalents: allTalents.map((t: any) => t.talentId) };
  } catch (error) {
    if (db) await db.run('ROLLBACK');
    console.error(`[Database] Error unlocking talents for ${characterId}:`, error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Get available talent points for a level
 */
export function getTalentPoints(characterId: string, level: number): number {
  try {
    // Placeholder - actual calculation should come from talent-rules.js
    const TALENT_POINTS_PER_LEVEL = [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3];
    return TALENT_POINTS_PER_LEVEL[level - 1] ?? 0;
  } catch (error) {
    console.error(`[Database] Error getting talent points for ${characterId}:`, error);
    return 0;
  }
}

/**
 * Get amount spent on a category at a specific level
 */
/**
 * Get amount spent on a category at a specific level
 */
export async function getSpentPoints(
  characterId: string,
  category: 'attributes' | 'skills' | 'talents',
  level: number
): Promise<number> {
  if (!db) throw new Error('Database not initialized');
  try {
    const spent = await db.get('SELECT * FROM SpentPoints WHERE characterId = ?', characterId);
    if (!spent) return 0;

    let data: Record<string, number> = {};
    if (category === 'attributes' && spent.attributes) {
      data = JSON.parse(spent.attributes);
    } else if (category === 'skills' && spent.skills) {
      data = JSON.parse(spent.skills);
    } else if (category === 'talents' && spent.talents) {
      data = JSON.parse(spent.talents);
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