import { getDbInstance } from '../database';
import { CharacterData } from '../dao/characterDao'

const db = getDbInstance();

export interface SaveResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * List all characters
 */
export async function listCharacters(): Promise<CharacterData[]> {
  if (!db) {
    console.warn('[Database] Database not initialized, returning empty list');
    return [];
  }
  try {
    const chars = await db.all('SELECT * FROM Character ORDER BY lastModified DESC');
    const results: CharacterData[] = [];
    for (const c of chars) {
      const loaded = await loadCharacter(c.id);
      if (loaded) results.push(loaded);
    }
    return results;
  } catch (error) {
    console.error('[Database] Error listing characters:', error);
    throw error;
  }
}

/**
 * Load a character from the database by ID
 */
export async function loadCharacter(characterId: string): Promise<CharacterData | null> {
    if (!db) throw new Error('Database not initialized');
    try {
        const char = await db.get(`SELECT * FROM Character WHERE id = ?`, characterId);
        if (!char) return null;

        // Load related data
        const attrs = await db.get('SELECT * FROM Attributes WHERE characterId = ?', characterId);
        const skills = await db.all('SELECT skillName, value FROM Skill WHERE characterId = ?', characterId);
        const talents = await db.all('SELECT talentId FROM UnlockedTalent WHERE characterId = ?', characterId);
        const expertises = await db.all('SELECT name, source, sourceId FROM SelectedExpertise WHERE characterId = ?', characterId);
        const items = await db.all('SELECT itemId, quantity, equipped FROM InventoryItem WHERE characterId = ?', characterId);
        const resources = await db.get('SELECT * FROM CharacterResources WHERE characterId = ?', characterId);
        const paths = await db.all('SELECT pathName FROM PathSelection WHERE characterId = ?', characterId);

        // Serialize to character format
        return {
            id: char.id,
            name: char.name,
            level: char.level,
            pendingLevelPoints: char.pendingLevelPoints,
            ancestry: char.ancestry,
            sessionNotes: char.sessionNotes,
            lastModified: char.lastModified,
            attributes: attrs ? {
                strength: attrs.strength,
                speed: attrs.speed,
                intellect: attrs.intellect,
                willpower: attrs.willpower,
                awareness: attrs.awareness,
                presence: attrs.presence
            } : {},
            skills: skills.reduce((acc: Record<string, number>, s: any) => {
                acc[s.skillName] = s.value;
                return acc;
            }, {}),
            unlockedTalents: talents.map((t: any) => t.talentId),
            selectedExpertises: expertises,
            inventory: items,
            resources: resources ? {
                health: { current: resources.healthCurrent, max: resources.healthMax },
                focus: { current: resources.focusCurrent, max: resources.focusMax },
                investiture: {
                    current: resources.investitureCurrent,
                    max: resources.investitureMax,
                    isActive: resources.investitureActive === 1
                }
            } : undefined,
            paths: paths.map((p: any) => p.pathName)
        };
    } catch (error) {
        console.error(`[Database] Error loading character ${characterId}:`, error);
        throw error;
    }
}

/**
 * Save a character to the database atomically
 */
export async function saveCharacter(
    character: CharacterData,
    spentPointsTracking?: { attributes?: number; skills?: number; talents?: number; level: number }
): Promise<SaveResult> {
    if (!db) throw new Error('Database not initialized');
    try {
        await db.run('BEGIN TRANSACTION');
        // Upsert character
        await db.run(`
      INSERT INTO Character (id, name, level, pendingLevelPoints, ancestry, sessionNotes, lastModified)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        level = excluded.level,
        pendingLevelPoints = excluded.pendingLevelPoints,
        ancestry = excluded.ancestry,
        sessionNotes = excluded.sessionNotes,
        lastModified = excluded.lastModified
    `,
            character.id,
            character.name,
            character.level ?? 1,
            character.pendingLevelPoints ?? 0,
            character.ancestry ?? null,
            character.sessionNotes ?? '',
            character.lastModified ?? new Date().toISOString()
        );

        // Save attributes
        if (character.attributes) {
            await db.run(`
        INSERT INTO Attributes (id, characterId, strength, speed, intellect, willpower, awareness, presence)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(characterId) DO UPDATE SET
          strength = excluded.strength,
          speed = excluded.speed,
          intellect = excluded.intellect,
          willpower = excluded.willpower,
          awareness = excluded.awareness,
          presence = excluded.presence
      `,
                `attr-${character.id}`,
                character.id,
                character.attributes.strength ?? 2,
                character.attributes.speed ?? 2,
                character.attributes.intellect ?? 2,
                character.attributes.willpower ?? 2,
                character.attributes.awareness ?? 2,
                character.attributes.presence ?? 2
            );
        }

        // Save skills
        if (character.skills) {
            await db.run('DELETE FROM Skill WHERE characterId = ?', character.id);
            for (const [skillName, value] of Object.entries(character.skills)) {
                await db.run('INSERT INTO Skill (id, characterId, skillName, value) VALUES (?, ?, ?, ?)',
                    `skill-${character.id}-${skillName}`, character.id, skillName, value);
            }
        }

        // Save paths
        if (character.paths && character.paths.length > 0) {
            await db.run('DELETE FROM PathSelection WHERE characterId = ?', character.id);
            for (const pathName of character.paths) {
                await db.run('INSERT INTO PathSelection (id, characterId, pathName) VALUES (?, ?, ?)',
                    `path-${character.id}-${pathName}`, character.id, pathName);
            }
        }

        // Save resources
        if (character.resources) {
            await db.run(`
        INSERT INTO CharacterResources (id, characterId, healthCurrent, healthMax, focusCurrent, focusMax, investitureCurrent, investitureMax, investitureActive)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(characterId) DO UPDATE SET
          healthCurrent = excluded.healthCurrent,
          healthMax = excluded.healthMax,
          focusCurrent = excluded.focusCurrent,
          focusMax = excluded.focusMax,
          investitureCurrent = excluded.investitureCurrent,
          investitureMax = excluded.investitureMax,
          investitureActive = excluded.investitureActive
      `,
                `res-${character.id}`,
                character.id,
                character.resources.health?.current ?? 0,
                character.resources.health?.max ?? 0,
                character.resources.focus?.current ?? 0,
                character.resources.focus?.max ?? 0,
                character.resources.investiture?.current ?? 0,
                character.resources.investiture?.max ?? 0,
                character.resources.investiture?.isActive ? 1 : 0
            );
        }

        // Save inventory
        if (character.inventory && Array.isArray(character.inventory)) {
            await db.run('DELETE FROM InventoryItem WHERE characterId = ?', character.id);
            for (const item of character.inventory) {
                await db.run('INSERT INTO InventoryItem (id, characterId, itemId, quantity, equipped) VALUES (?, ?, ?, ?, ?)',
                    `inv-${character.id}-${item.itemId}`,
                    character.id,
                    item.itemId,
                    item.quantity ?? 1,
                    item.equipped ? 1 : 0
                );
            }
        }

        // Track spent points if provided
        if (spentPointsTracking) {
            const spent = await db.get('SELECT * FROM SpentPoints WHERE characterId = ?', character.id);
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

            await db.run(`
        INSERT INTO SpentPoints (id, characterId, attributes, skills, talents)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(characterId) DO UPDATE SET
          attributes = excluded.attributes,
          skills = excluded.skills,
          talents = excluded.talents
      `,
                `spent-${character.id}`,
                character.id,
                JSON.stringify(attributes),
                JSON.stringify(skills),
                JSON.stringify(talents)
            );
        }

        await db.run('COMMIT');
        console.log(`[Database] Saved character: ${character.name} (${character.id})`);
        return { success: true, id: character.id };
    } catch (error) {
        if (db) await db.run('ROLLBACK');
        console.error(`[Database] Error saving character ${character.id}:`, error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Delete a character
 */
export async function deleteCharacter(characterId: string): Promise<SaveResult> {
  if (!db) throw new Error('Database not initialized');
  try {
    const result = await db.run('DELETE FROM Character WHERE id = ?', characterId);
    if (result.changes === 0) {
      return { success: false, error: 'Character not found' };
    }
    console.log(`[Database] Deleted character: ${characterId}`);
    return { success: true, id: characterId };
  } catch (error) {
    console.error(`[Database] Error deleting character ${characterId}:`, error);
    return { success: false, error: (error as Error).message };
  }
}
