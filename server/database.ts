/**
 * Database Service Layer - SQLite Implementation
 * 
 * Uses better-sqlite3 for direct, synchronous database access.
 * Provides transaction-safe character CRUD and talent operations.
 * No ORM complexity - just SQL and transactions for safety.
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'prisma', 'dev.db');

// Initialize database connection
export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL'); // Enable WAL mode for better concurrency

// Enable foreign keys
db.pragma('foreign_keys = ON');

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

export interface CharacterData {
  id: string;
  name: string;
  level: number;
  pendingLevelPoints: number;
  ancestry: string | null;
  sessionNotes: string;
  lastModified: string;
  cultures?: any[];
  paths?: string[];
  attributes?: Record<string, number>;
  skills?: Record<string, number>;
  unlockedTalents?: string[];
  selectedExpertises?: any[];
  inventory?: any[];
  resources?: {
    health: { current: number; max: number };
    focus: { current: number; max: number };
    investiture: { current: number; max: number; isActive: boolean };
  };
}

export interface SaveResult {
  success: boolean;
  id?: string;
  error?: string;
}

export interface TalentResult {
  success: boolean;
  unlockedTalents?: string[];
  error?: string;
}

/**
 * Initialize database schema if it doesn't exist
 */
export function initializeSchema(): void {
  try {
    // Create Character table
    db.exec(`
      CREATE TABLE IF NOT EXISTS Character (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        level INTEGER DEFAULT 1,
        pendingLevelPoints INTEGER DEFAULT 0,
        ancestry TEXT,
        sessionNotes TEXT DEFAULT '',
        lastModified TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS Attributes (
        id TEXT PRIMARY KEY,
        characterId TEXT UNIQUE NOT NULL,
        strength INTEGER DEFAULT 2,
        speed INTEGER DEFAULT 2,
        intellect INTEGER DEFAULT 2,
        willpower INTEGER DEFAULT 2,
        awareness INTEGER DEFAULT 2,
        presence INTEGER DEFAULT 2,
        FOREIGN KEY(characterId) REFERENCES Character(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS Skill (
        id TEXT PRIMARY KEY,
        characterId TEXT NOT NULL,
        skillName TEXT NOT NULL,
        value INTEGER DEFAULT 0,
        UNIQUE(characterId, skillName),
        FOREIGN KEY(characterId) REFERENCES Character(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS UnlockedTalent (
        id TEXT PRIMARY KEY,
        characterId TEXT NOT NULL,
        talentId TEXT NOT NULL,
        unlockedAt TEXT NOT NULL,
        level INTEGER DEFAULT 1,
        UNIQUE(characterId, talentId),
        FOREIGN KEY(characterId) REFERENCES Character(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS SelectedExpertise (
        id TEXT PRIMARY KEY,
        characterId TEXT NOT NULL,
        name TEXT NOT NULL,
        source TEXT NOT NULL,
        sourceId TEXT NOT NULL,
        UNIQUE(characterId, name),
        FOREIGN KEY(characterId) REFERENCES Character(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS InventoryItem (
        id TEXT PRIMARY KEY,
        characterId TEXT NOT NULL,
        itemId TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        equipped INTEGER DEFAULT 0,
        UNIQUE(characterId, itemId),
        FOREIGN KEY(characterId) REFERENCES Character(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS CharacterResources (
        id TEXT PRIMARY KEY,
        characterId TEXT UNIQUE NOT NULL,
        healthCurrent INTEGER DEFAULT 0,
        healthMax INTEGER DEFAULT 0,
        focusCurrent INTEGER DEFAULT 0,
        focusMax INTEGER DEFAULT 0,
        investitureCurrent INTEGER DEFAULT 0,
        investitureMax INTEGER DEFAULT 0,
        investitureActive INTEGER DEFAULT 0,
        FOREIGN KEY(characterId) REFERENCES Character(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS RadiantPath (
        id TEXT PRIMARY KEY,
        characterId TEXT UNIQUE NOT NULL,
        boundOrder TEXT,
        currentIdeal INTEGER DEFAULT 1,
        idealSpoken INTEGER DEFAULT 0,
        surgePair TEXT,
        sprenType TEXT,
        FOREIGN KEY(characterId) REFERENCES Character(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS UnlockedSingerForm (
        id TEXT PRIMARY KEY,
        characterId TEXT NOT NULL,
        formId TEXT NOT NULL,
        unlockedAt TEXT NOT NULL,
        UNIQUE(characterId, formId),
        FOREIGN KEY(characterId) REFERENCES Character(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS CultureSelection (
        id TEXT PRIMARY KEY,
        characterId TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        expertise TEXT NOT NULL,
        suggestedNames TEXT NOT NULL,
        UNIQUE(characterId, name),
        FOREIGN KEY(characterId) REFERENCES Character(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS PathSelection (
        id TEXT PRIMARY KEY,
        characterId TEXT NOT NULL,
        pathName TEXT NOT NULL,
        UNIQUE(characterId, pathName),
        FOREIGN KEY(characterId) REFERENCES Character(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS SpentPoints (
        id TEXT PRIMARY KEY,
        characterId TEXT UNIQUE NOT NULL,
        attributes TEXT DEFAULT '{}',
        skills TEXT DEFAULT '{}',
        talents TEXT DEFAULT '{}',
        FOREIGN KEY(characterId) REFERENCES Character(id) ON DELETE CASCADE
      );
    `);

    console.log('[Database] Schema initialized');
  } catch (error) {
    if ((error as any).message.includes('already exists')) {
      return;
    }
    console.error('[Database] Error initializing schema:', error);
    throw error;
  }
}

/**
 * Load a character from the database by ID
 */
export function loadCharacter(characterId: string): CharacterData | null {
  try {
    const stmt = db.prepare(`SELECT * FROM Character WHERE id = ?`);
    const char = stmt.get(characterId) as any;
    
    if (!char) return null;

    // Load related data
    const attrs = db.prepare('SELECT * FROM Attributes WHERE characterId = ?').get(characterId) as any;
    const skills = db.prepare('SELECT skillName, value FROM Skill WHERE characterId = ?').all(characterId) as any[];
    const talents = db.prepare('SELECT talentId FROM UnlockedTalent WHERE characterId = ?').all(characterId) as any[];
    const expertises = db.prepare('SELECT name, source, sourceId FROM SelectedExpertise WHERE characterId = ?').all(characterId) as any[];
    const items = db.prepare('SELECT itemId, quantity, equipped FROM InventoryItem WHERE characterId = ?').all(characterId) as any[];
    const resources = db.prepare('SELECT * FROM CharacterResources WHERE characterId = ?').get(characterId) as any;
    const paths = db.prepare('SELECT pathName FROM PathSelection WHERE characterId = ?').all(characterId) as any[];

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
export function saveCharacter(
  character: CharacterData,
  spentPointsTracking?: { attributes?: number; skills?: number; talents?: number; level: number }
): SaveResult {
  try {
    const result = db.transaction(() => {
      // Upsert character
      const insertChar = db.prepare(`
        INSERT INTO Character (id, name, level, pendingLevelPoints, ancestry, sessionNotes, lastModified)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          level = excluded.level,
          pendingLevelPoints = excluded.pendingLevelPoints,
          ancestry = excluded.ancestry,
          sessionNotes = excluded.sessionNotes,
          lastModified = excluded.lastModified
      `);
      
      insertChar.run(
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
        const insertAttrs = db.prepare(`
          INSERT INTO Attributes (id, characterId, strength, speed, intellect, willpower, awareness, presence)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(characterId) DO UPDATE SET
            strength = excluded.strength,
            speed = excluded.speed,
            intellect = excluded.intellect,
            willpower = excluded.willpower,
            awareness = excluded.awareness,
            presence = excluded.presence
        `);
        
        insertAttrs.run(
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
        db.prepare('DELETE FROM Skill WHERE characterId = ?').run(character.id);
        const insertSkill = db.prepare('INSERT INTO Skill (id, characterId, skillName, value) VALUES (?, ?, ?, ?)');
        for (const [skillName, value] of Object.entries(character.skills)) {
          insertSkill.run(`skill-${character.id}-${skillName}`, character.id, skillName, value);
        }
      }

      // Save paths
      if (character.paths && character.paths.length > 0) {
        db.prepare('DELETE FROM PathSelection WHERE characterId = ?').run(character.id);
        const insertPath = db.prepare('INSERT INTO PathSelection (id, characterId, pathName) VALUES (?, ?, ?)');
        for (const pathName of character.paths) {
          insertPath.run(`path-${character.id}-${pathName}`, character.id, pathName);
        }
      }

      // Save resources
      if (character.resources) {
        const insertResources = db.prepare(`
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
        `);
        
        insertResources.run(
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

      // Track spent points if provided
      if (spentPointsTracking) {
        const spent = db.prepare('SELECT * FROM SpentPoints WHERE characterId = ?').get(character.id) as any;
        
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

        const insertSpent = db.prepare(`
          INSERT INTO SpentPoints (id, characterId, attributes, skills, talents)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(characterId) DO UPDATE SET
            attributes = excluded.attributes,
            skills = excluded.skills,
            talents = excluded.talents
        `);
        
        insertSpent.run(
          `spent-${character.id}`,
          character.id,
          JSON.stringify(attributes),
          JSON.stringify(skills),
          JSON.stringify(talents)
        );
      }

      return { success: true, id: character.id };
    })();

    console.log(`[Database] Saved character: ${character.name} (${character.id})`);
    return result as SaveResult;
  } catch (error) {
    console.error(`[Database] Error saving character ${character.id}:`, error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Unlock talents atomically with transaction safety
 */
export function unlockTalent(
  characterId: string,
  talentIds: string[],
  level: number
): TalentResult {
  try {
    const result = db.transaction(() => {
      // Verify character exists
      const char = db.prepare('SELECT id FROM Character WHERE id = ?').get(characterId);
      if (!char) {
        throw new Error(`Character not found: ${characterId}`);
      }

      // Get current talents
      const existing = db.prepare('SELECT talentId FROM UnlockedTalent WHERE characterId = ?').all(characterId) as any[];
      const existingIds = new Set(existing.map((t: any) => t.talentId));

      // Only create talents that don't already exist
      const newTalents = talentIds.filter(id => !existingIds.has(id));
      
      const now = new Date().toISOString();
      const insertTalent = db.prepare(`
        INSERT INTO UnlockedTalent (id, characterId, talentId, unlockedAt, level)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const talentId of newTalents) {
        insertTalent.run(
          `talent-${characterId}-${talentId}`,
          characterId,
          talentId,
          now,
          level
        );
      }

      // Get all unlocked talents
      const allTalents = db.prepare('SELECT talentId FROM UnlockedTalent WHERE characterId = ?').all(characterId) as any[];

      // Update spent points tracking
      const spent = db.prepare('SELECT * FROM SpentPoints WHERE characterId = ?').get(characterId) as any;
      const talents = spent?.talents ? JSON.parse(spent.talents) : {};
      talents[level] = (talents[level] ?? 0) + newTalents.length;

      const insertSpent = db.prepare(`
        INSERT INTO SpentPoints (id, characterId, talents, attributes, skills)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(characterId) DO UPDATE SET talents = excluded.talents
      `);

      insertSpent.run(
        `spent-${characterId}`,
        characterId,
        JSON.stringify(talents),
        spent?.attributes ?? '{}',
        spent?.skills ?? '{}'
      );

      return allTalents.map((t: any) => t.talentId);
    })();

    console.log(`[Database] Unlocked talents for ${characterId}: ${talentIds.join(', ')}`);
    return { success: true, unlockedTalents: result as string[] };
  } catch (error) {
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
export function getSpentPoints(
  characterId: string,
  category: 'attributes' | 'skills' | 'talents',
  level: number
): number {
  try {
    const spent = db.prepare('SELECT * FROM SpentPoints WHERE characterId = ?').get(characterId) as any;
    
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

/**
 * List all characters
 */
export function listCharacters(): CharacterData[] {
  try {
    const chars = db.prepare('SELECT * FROM Character ORDER BY lastModified DESC').all() as any[];
    return chars.map(c => {
      const loaded = loadCharacter(c.id);
      return loaded || c;
    }).filter(c => c !== null) as CharacterData[];
  } catch (error) {
    console.error('[Database] Error listing characters:', error);
    throw error;
  }
}

/**
 * Delete a character
 */
export function deleteCharacter(characterId: string): SaveResult {
  try {
    const result = db.prepare('DELETE FROM Character WHERE id = ?').run(characterId);
    
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

/**
 * Clear all data from database (for testing)
 */
export function clearDatabase(): void {
  try {
    db.exec(`
      DELETE FROM UnlockedSingerForm;
      DELETE FROM UnlockedTalent;
      DELETE FROM SelectedExpertise;
      DELETE FROM InventoryItem;
      DELETE FROM Skill;
      DELETE FROM CharacterResources;
      DELETE FROM RadiantPath;
      DELETE FROM SpentPoints;
      DELETE FROM Attributes;
      DELETE FROM CultureSelection;
      DELETE FROM PathSelection;
      DELETE FROM Character;
    `);
    console.log('[Database] Database cleared');
  } catch (error) {
    console.error('[Database] Error clearing database:', error);
    throw error;
  }
}

export default db;
