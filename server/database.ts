/**
 * Database Service Layer - SQLite Implementation
 *
 * Uses better-sqlite3 for direct, synchronous database access.
 * Provides transaction-safe character CRUD and talent operations.
 * No ORM complexity - just SQL and transactions for safety.
 */

import sqlite3 from 'sqlite3';
import { open, Database as SqliteDatabase } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

// Use __dirname directly for compatibility with CommonJS
const DB_PATH = path.join(__dirname, '..', 'prisma', 'dev.db');

// Initialize async database connection
let db: SqliteDatabase | null = null;
let dbInitialized = false;
let dbError: Error | null = null;

export async function initDatabase() {
  try {
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database,
    });
    await db.run('PRAGMA journal_mode = WAL');
    await db.run('PRAGMA foreign_keys = ON');
    dbInitialized = true;
    console.log('[Database] Successfully initialized database');
  } catch (error) {
    dbError = error as Error;
    console.error('[Database] Failed to initialize database:', dbError.message);
    dbInitialized = false;
  }
}
export { dbInitialized, dbError };

// ============================================================================
// TIER 0 TALENT MAPPING
// ============================================================================
// Single source of truth for path -> tier 0 talent mapping
export const PATH_TIER0_TALENTS: Record<string, string> = {
  warrior: 'vigilant_stance',
  scholar: 'education',
  hunter: 'seek_quarry',
  leader: 'decisive_command',
  envoy: 'rousing_presence',
  agent: 'opportunist',
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
  pendingLevel: boolean;
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
  radiantPath?: {
    boundOrder: string | null;
    currentIdeal: number;
    idealSpoken: boolean;
    surgePair: string | null;
    sprenType: string | null;
    radiantTier0TalentId?: string | null;
  };
  radiantTier0TalentId?: string | null;
}

export interface AttributesRecord {
  characterId: string;
  totalPoints: number;
  pointsSpent: number;
  pointsRemaining: number;
  strength: number;
  speed: number;
  intellect: number;
  willpower: number;
  awareness: number;
  presence: number;
  finalized: boolean;
}

export interface SkillsStateRecord {
  characterId: string;
  totalPoints: number;
  pointsSpent: number;
  pointsRemaining: number;
  finalized: boolean;
}

export interface TalentsStateRecord {
  characterId: string;
  totalPoints: number;
  pointsSpent: number;
  pointsRemaining: number;
  finalized: boolean;
  totalTalents: string[];
  pendingTalents: string[];
  pendingTrees: string[]; // Selected bonus path trees (removable until finalized)
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
export async function initializeSchema(): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  try {
    // Create Character table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Character (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        level INTEGER DEFAULT 1,
        pendingLevelPoints INTEGER DEFAULT 0,
        ancestry TEXT,
        sessionNotes TEXT DEFAULT '',
        currencyInChips REAL DEFAULT 0,
        lastModified TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS Attributes (
        id TEXT PRIMARY KEY,
        characterId TEXT UNIQUE NOT NULL,
        totalPoints INTEGER DEFAULT 0,
        pointsSpent INTEGER DEFAULT 0,
        pointsRemaining INTEGER DEFAULT 0,
        finalized INTEGER DEFAULT 0,
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

      CREATE TABLE IF NOT EXISTS SkillsState (
        id TEXT PRIMARY KEY,
        characterId TEXT UNIQUE NOT NULL,
        totalPoints INTEGER DEFAULT 0,
        pointsSpent INTEGER DEFAULT 0,
        pointsRemaining INTEGER DEFAULT 0,
        finalized INTEGER DEFAULT 0,
        FOREIGN KEY(characterId) REFERENCES Character(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS CharacterTalents (
        id TEXT PRIMARY KEY,
        characterId TEXT UNIQUE NOT NULL,
        totalPoints INTEGER DEFAULT 0,
        pointsSpent INTEGER DEFAULT 0,
        pointsRemaining INTEGER DEFAULT 0,
        finalized INTEGER DEFAULT 0,
        totalTalents TEXT DEFAULT '[]',
        pendingTalents TEXT DEFAULT '[]',
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

    // Run migrations for existing tables
    await runMigrations();

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
 * Run database migrations for schema updates
 */
async function runMigrations(): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  try {
    // Migration: Add currencyInChips column to Character table if it doesn't exist
    const hasColumns = await db.all('PRAGMA table_info(Character)');
    const hasCurrency = hasColumns.some((col: any) => col.name === 'currencyInChips');

    if (!hasCurrency) {
      console.log('[Database] Running migration: Adding currencyInChips column to Character table');
      try {
        await db.run('ALTER TABLE Character ADD COLUMN currencyInChips REAL DEFAULT 0');
        console.log('[Database] Migration completed: currencyInChips column added');
      } catch (alterError) {
        console.error('[Database] Migration error:', (alterError as Error).message);
        throw alterError;
      }
    } else {
      console.log('[Database] Migration skipped: currencyInChips column already exists');
    }
  } catch (error) {
    console.error('[Database] Migration failed:', (error as Error).message);
    throw error;
  }
}

/**
 * Helper to extract currency from inventory object or return 0
 */
function getCurrencyFromInventory(inventory: any): number {
  if (!inventory) return 0;
  if (inventory.currencyInChips !== undefined) {
    return Number.isFinite(inventory.currencyInChips) ? inventory.currencyInChips : 0;
  }
  return 0;
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
    const skills = await db.all(
      'SELECT skillName, value FROM Skill WHERE characterId = ?',
      characterId
    );
    const talents = await db.all(
      'SELECT talentId FROM UnlockedTalent WHERE characterId = ?',
      characterId
    );
    const expertises = await db.all(
      'SELECT name, source, sourceId FROM SelectedExpertise WHERE characterId = ?',
      characterId
    );
    const items = await db.all(
      'SELECT itemId, quantity, equipped FROM InventoryItem WHERE characterId = ?',
      characterId
    );
    const resources = await db.get(
      'SELECT * FROM CharacterResources WHERE characterId = ?',
      characterId
    );
    const paths = await db.all(
      'SELECT pathName, tier0TalentId FROM PathSelection WHERE characterId = ?',
      characterId
    );
    const cultures = await db.all(
      'SELECT name FROM CultureSelection WHERE characterId = ?',
      characterId
    );
    const radiantPath = await db.get(
      'SELECT boundOrder, currentIdeal, idealSpoken, surgePair, sprenType, radiantTier0TalentId FROM RadiantPath WHERE characterId = ?',
      characterId
    );

    // Serialize to character format
    return {
      id: char.id,
      name: char.name,
      level: char.level,
      pendingLevelPoints: char.pendingLevelPoints,
      ancestry: char.ancestry,
      sessionNotes: char.sessionNotes,
      lastModified: char.lastModified,
      attributes: attrs
        ? {
            strength: attrs.strength,
            speed: attrs.speed,
            intellect: attrs.intellect,
            willpower: attrs.willpower,
            awareness: attrs.awareness,
            presence: attrs.presence,
          }
        : {},
      skills: skills.reduce((acc: Record<string, number>, s: any) => {
        acc[s.skillName] = s.value;
        return acc;
      }, {}),
      unlockedTalents: talents.map((t: any) => t.talentId),
      selectedExpertises: expertises,
      inventory: {
        items: items.map((item: any) => ({
          id: item.itemId,
          quantity: item.quantity,
          customData: {},
        })),
        equippedItems: [],
        currencyInChips: char.currencyInChips ?? 0,
      },
      resources: resources
        ? {
            health: { current: resources.healthCurrent, max: resources.healthMax },
            focus: { current: resources.focusCurrent, max: resources.focusMax },
            investiture: {
              current: resources.investitureCurrent,
              max: resources.investitureMax,
              isActive: resources.investitureActive === 1,
            },
          }
        : undefined,
      paths: paths.map((p: any) => p.pathName),
      mainPathTier0TalentId: paths.length > 0 ? paths[0].tier0TalentId || null : null,
      cultures: cultures.map((c: any) => c.name),
      radiantPath: radiantPath
        ? {
            boundOrder: radiantPath.boundOrder,
            currentIdeal: radiantPath.currentIdeal,
            idealSpoken: radiantPath.idealSpoken === 1,
            surgePair: radiantPath.surgePair,
            sprenType: radiantPath.sprenType,
            radiantTier0TalentId: radiantPath.radiantTier0TalentId || null,
          }
        : undefined,
      radiantTier0TalentId: radiantPath?.radiantTier0TalentId || null,
    };
  } catch (error) {
    console.error(`[Database] Error loading character ${characterId}:`, error);
    throw error;
  }
}

// ============================================================================
// ATTRIBUTES RECORD HELPERS
// ============================================================================

export async function getAttributesRecord(characterId: string): Promise<AttributesRecord | null> {
  if (!db) throw new Error('Database not initialized');
  const attrs = await db.get('SELECT * FROM Attributes WHERE characterId = ?', characterId);
  if (!attrs) return null;
  return {
    characterId: attrs.characterId,
    totalPoints: attrs.totalPoints ?? 0,
    pointsSpent: attrs.pointsSpent ?? 0,
    pointsRemaining: attrs.pointsRemaining ?? 0,
    strength: attrs.strength ?? 2,
    speed: attrs.speed ?? 2,
    intellect: attrs.intellect ?? 2,
    willpower: attrs.willpower ?? 2,
    awareness: attrs.awareness ?? 2,
    presence: attrs.presence ?? 2,
    finalized: (attrs.finalized ?? 0) === 1,
  };
}

export async function createAttributesRecord(record: AttributesRecord): Promise<AttributesRecord> {
  if (!db) throw new Error('Database not initialized');
  await db.run(
    `
    INSERT INTO Attributes (
      id, characterId, totalPoints, pointsSpent, pointsRemaining,
      strength, speed, intellect, willpower, awareness, presence, finalized
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    `attr-${record.characterId}`,
    record.characterId,
    record.totalPoints,
    record.pointsSpent,
    record.pointsRemaining,
    record.strength,
    record.speed,
    record.intellect,
    record.willpower,
    record.awareness,
    record.presence,
    record.finalized ? 1 : 0
  );
  return record;
}

export async function updateAttributesRecord(
  characterId: string,
  updates: Partial<AttributesRecord>
): Promise<AttributesRecord> {
  if (!db) throw new Error('Database not initialized');
  const current = await getAttributesRecord(characterId);
  if (!current) {
    throw new Error(`Attributes record not found for character ${characterId}`);
  }

  const merged: AttributesRecord = {
    ...current,
    ...updates,
    characterId,
  };

  await db.run(
    `
    UPDATE Attributes SET
      totalPoints = ?,
      pointsSpent = ?,
      pointsRemaining = ?,
      strength = ?,
      speed = ?,
      intellect = ?,
      willpower = ?,
      awareness = ?,
      presence = ?,
      finalized = ?
    WHERE characterId = ?
  `,
    merged.totalPoints,
    merged.pointsSpent,
    merged.pointsRemaining,
    merged.strength,
    merged.speed,
    merged.intellect,
    merged.willpower,
    merged.awareness,
    merged.presence,
    merged.finalized ? 1 : 0,
    characterId
  );

  return merged;
}

export async function setAttributesFinalized(
  characterId: string,
  finalized: boolean
): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  await db.run(
    'UPDATE Attributes SET finalized = ? WHERE characterId = ?',
    finalized ? 1 : 0,
    characterId
  );
}

// ============================================================================
// SKILLS STATE HELPERS
// ============================================================================

export async function getSkillsStateRecord(characterId: string): Promise<SkillsStateRecord | null> {
  if (!db) throw new Error('Database not initialized');
  const state = await db.get('SELECT * FROM SkillsState WHERE characterId = ?', characterId);
  if (!state) return null;
  return {
    characterId: state.characterId,
    totalPoints: state.totalPoints ?? 0,
    pointsSpent: state.pointsSpent ?? 0,
    pointsRemaining: state.pointsRemaining ?? 0,
    finalized: (state.finalized ?? 0) === 1,
  };
}

export async function createSkillsStateRecord(
  record: SkillsStateRecord
): Promise<SkillsStateRecord> {
  if (!db) throw new Error('Database not initialized');
  await db.run(
    `
    INSERT INTO SkillsState (
      id, characterId, totalPoints, pointsSpent, pointsRemaining, finalized
    ) VALUES (?, ?, ?, ?, ?, ?)
  `,
    `skills-${record.characterId}`,
    record.characterId,
    record.totalPoints,
    record.pointsSpent,
    record.pointsRemaining,
    record.finalized ? 1 : 0
  );
  return record;
}

export async function updateSkillsStateRecord(
  characterId: string,
  updates: Partial<SkillsStateRecord>
): Promise<SkillsStateRecord> {
  if (!db) throw new Error('Database not initialized');
  const current = await getSkillsStateRecord(characterId);
  if (!current) {
    throw new Error(`Skills state record not found for character ${characterId}`);
  }

  const merged: SkillsStateRecord = {
    ...current,
    ...updates,
    characterId,
  };

  await db.run(
    `
    UPDATE SkillsState SET
      totalPoints = ?,
      pointsSpent = ?,
      pointsRemaining = ?,
      finalized = ?
    WHERE characterId = ?
  `,
    merged.totalPoints,
    merged.pointsSpent,
    merged.pointsRemaining,
    merged.finalized ? 1 : 0,
    characterId
  );

  return merged;
}

export async function setSkillsStateFinalized(
  characterId: string,
  finalized: boolean
): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  await db.run(
    'UPDATE SkillsState SET finalized = ? WHERE characterId = ?',
    finalized ? 1 : 0,
    characterId
  );
}

// ============================================================================
// TALENTS STATE HELPERS
// ============================================================================

export async function getTalentsStateRecord(
  characterId: string
): Promise<TalentsStateRecord | null> {
  if (!db) throw new Error('Database not initialized');
  const record = await db.get('SELECT * FROM CharacterTalents WHERE characterId = ?', characterId);
  if (!record) return null;

  const totalTalents = record.totalTalents ? JSON.parse(record.totalTalents) : [];
  const pendingTalents = record.pendingTalents ? JSON.parse(record.pendingTalents) : [];
  const pendingTrees = record.pendingTrees ? JSON.parse(record.pendingTrees) : [];

  return {
    characterId: record.characterId,
    totalPoints: record.totalPoints ?? 0,
    pointsSpent: record.pointsSpent ?? 0,
    pointsRemaining: record.pointsRemaining ?? 0,
    finalized: (record.finalized ?? 0) === 1,
    totalTalents: Array.isArray(totalTalents) ? totalTalents : [],
    pendingTalents: Array.isArray(pendingTalents) ? pendingTalents : [],
    pendingTrees: Array.isArray(pendingTrees) ? pendingTrees : [],
  };
}

export async function createTalentsStateRecord(
  record: TalentsStateRecord
): Promise<TalentsStateRecord> {
  if (!db) throw new Error('Database not initialized');
  await db.run(
    `
    INSERT INTO CharacterTalents (
      id, characterId, totalPoints, pointsSpent, pointsRemaining, finalized, totalTalents, pendingTalents, pendingTrees
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    `talents-${record.characterId}`,
    record.characterId,
    record.totalPoints,
    record.pointsSpent,
    record.pointsRemaining,
    record.finalized ? 1 : 0,
    JSON.stringify(record.totalTalents ?? []),
    JSON.stringify(record.pendingTalents ?? []),
    JSON.stringify(record.pendingTrees ?? [])
  );
  return record;
}

export async function updateTalentsStateRecord(
  characterId: string,
  updates: Partial<TalentsStateRecord>
): Promise<TalentsStateRecord> {
  if (!db) throw new Error('Database not initialized');
  const current = await getTalentsStateRecord(characterId);
  if (!current) {
    throw new Error(`Talents state record not found for character ${characterId}`);
  }

  const merged: TalentsStateRecord = {
    ...current,
    ...updates,
    characterId,
  };

  await db.run(
    `
    UPDATE CharacterTalents SET
      totalPoints = ?,
      pointsSpent = ?,
      pointsRemaining = ?,
      finalized = ?,
      totalTalents = ?,
      pendingTalents = ?,
      pendingTrees = ?
    WHERE characterId = ?
  `,
    merged.totalPoints,
    merged.pointsSpent,
    merged.pointsRemaining,
    merged.finalized ? 1 : 0,
    JSON.stringify(merged.totalTalents ?? []),
    JSON.stringify(merged.pendingTalents ?? []),
    JSON.stringify(merged.pendingTrees ?? []),
    characterId
  );

  return merged;
}

export async function getSkillRanks(characterId: string): Promise<Record<string, number>> {
  if (!db) throw new Error('Database not initialized');
  const skills = await db.all(
    'SELECT skillName, value FROM Skill WHERE characterId = ?',
    characterId
  );
  return skills.reduce((acc: Record<string, number>, s: any) => {
    acc[s.skillName] = s.value;
    return acc;
  }, {});
}

export async function replaceSkillRanks(
  characterId: string,
  skills: Record<string, number>
): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  // Use UPSERT to handle concurrent updates safely
  for (const [skillName, value] of Object.entries(skills)) {
    await db.run(
      `INSERT INTO Skill (id, characterId, skillName, value) 
       VALUES (?, ?, ?, ?)
       ON CONFLICT(characterId, skillName) DO UPDATE SET
         value = excluded.value`,
      `skill-${characterId}-${skillName}`,
      characterId,
      skillName,
      value
    );
  }
}

// ============================================================================
// EXPERTISE HELPERS
// ============================================================================

export interface ExpertiseRecord {
  name: string;
  source: string; // 'culture' | 'talent' | 'gm' | 'manual'
  sourceId?: string;
}

export interface ExpertiseStateRecord {
  characterId: string;
  totalPoints: number; // Intellect
  pointsSpent: number;
  pointsRemaining: number;
  finalized: boolean;
}

export async function getSelectedExpertises(characterId: string): Promise<ExpertiseRecord[]> {
  if (!db) throw new Error('Database not initialized');
  const records = await db.all(
    'SELECT name, source, sourceId FROM SelectedExpertise WHERE characterId = ?',
    characterId
  );
  return records.map((r) => ({
    name: r.name,
    source: r.source,
    sourceId: r.sourceId,
  }));
}

export async function replaceSelectedExpertises(
  characterId: string,
  expertises: ExpertiseRecord[]
): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  await db.run('DELETE FROM SelectedExpertise WHERE characterId = ?', characterId);
  for (const exp of expertises) {
    await db.run(
      'INSERT INTO SelectedExpertise (id, characterId, name, source, sourceId) VALUES (?, ?, ?, ?, ?)',
      `expertise-${characterId}-${exp.name}`,
      characterId,
      exp.name,
      exp.source,
      exp.sourceId || ''
    );
  }
}

export async function getExpertiseStateRecord(
  characterId: string
): Promise<ExpertiseStateRecord | null> {
  if (!db) throw new Error('Database not initialized');
  const state = await db.get('SELECT * FROM ExpertiseState WHERE characterId = ?', characterId);
  if (!state) return null;
  return {
    characterId: state.characterId,
    totalPoints: state.totalPoints ?? 0,
    pointsSpent: state.pointsSpent ?? 0,
    pointsRemaining: state.pointsRemaining ?? 0,
    finalized: (state.finalized ?? 0) === 1,
  };
}

export async function createExpertiseStateRecord(
  record: ExpertiseStateRecord
): Promise<ExpertiseStateRecord> {
  if (!db) throw new Error('Database not initialized');
  await db.run(
    `
    INSERT INTO ExpertiseState (
      id, characterId, totalPoints, pointsSpent, pointsRemaining, finalized
    ) VALUES (?, ?, ?, ?, ?, ?)
  `,
    `expertise-state-${record.characterId}`,
    record.characterId,
    record.totalPoints,
    record.pointsSpent,
    record.pointsRemaining,
    record.finalized ? 1 : 0
  );
  return record;
}

export async function updateExpertiseStateRecord(
  characterId: string,
  updates: Partial<ExpertiseStateRecord>
): Promise<ExpertiseStateRecord> {
  if (!db) throw new Error('Database not initialized');
  const current = await getExpertiseStateRecord(characterId);
  if (!current) {
    throw new Error(`Expertise state record not found for character ${characterId}`);
  }

  const merged: ExpertiseStateRecord = {
    ...current,
    ...updates,
    characterId,
  };

  await db.run(
    `
    UPDATE ExpertiseState SET
      totalPoints = ?,
      pointsSpent = ?,
      pointsRemaining = ?,
      finalized = ?
    WHERE characterId = ?
  `,
    merged.totalPoints,
    merged.pointsSpent,
    merged.pointsRemaining,
    merged.finalized ? 1 : 0,
    characterId
  );

  return merged;
}

/**
 * Save a character to the database atomically
 */
export async function saveCharacter(
  character: CharacterData,
  spentPointsTracking?: { attributes?: number; skills?: number; talents?: number; level: number }
): Promise<SaveResult> {
  if (!db) throw new Error('Database not initialized');
  let transactionStarted = false;
  try {
    // Check if we're already in a transaction (sqlite library doesn't expose this directly)
    // So we just try to begin and catch if nested
    try {
      await db.run('BEGIN TRANSACTION');
      transactionStarted = true;
    } catch (e: any) {
      // If we can't start a transaction, we're already in one, so proceed without explicit transaction
      if (!e.message?.includes('cannot start a transaction')) {
        throw e;
      }
      transactionStarted = false;
    }
    // Upsert character
    await db.run(
      `
      INSERT INTO Character (id, name, level, pendingLevelPoints, pendingLevel, ancestry, sessionNotes, currencyInChips, lastModified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        level = excluded.level,
        pendingLevelPoints = excluded.pendingLevelPoints,
        pendingLevel = excluded.pendingLevel,
        ancestry = excluded.ancestry,
        sessionNotes = excluded.sessionNotes,
        currencyInChips = excluded.currencyInChips,
        lastModified = excluded.lastModified
    `,
      character.id,
      character.name,
      character.level ?? 1,
      character.pendingLevelPoints ?? 0,
      (character as any).pendingLevel ? 1 : 0,
      character.ancestry ?? null,
      character.sessionNotes ?? '',
      getCurrencyFromInventory(character.inventory) ?? 0,
      character.lastModified ?? new Date().toISOString()
    );

    // NOTE: Attributes creation is handled by character-service.createCharacter() during initial creation
    // Only update existing attributes records here (not for new characters)
    if (
      character.attributes &&
      character.attributes.totalPoints &&
      character.attributes.totalPoints > 0
    ) {
      // Check if attributes record already exists for this character
      const existingAttrs = await db.get(
        'SELECT id FROM Attributes WHERE characterId = ?',
        character.id
      );

      if (existingAttrs) {
        // Update existing attributes record
        await db.run(
          `
          UPDATE Attributes 
          SET totalPoints = ?, pointsSpent = ?, pointsRemaining = ?, finalized = ?, 
              strength = ?, speed = ?, intellect = ?, willpower = ?, awareness = ?, presence = ?
          WHERE characterId = ?
        `,
          (character.attributes as any).totalPoints,
          (character.attributes as any).pointsSpent ?? 0,
          (character.attributes as any).pointsRemaining ?? 0,
          (character.attributes as any).finalized ? 1 : 0,
          character.attributes.strength ?? 2,
          character.attributes.speed ?? 2,
          character.attributes.intellect ?? 2,
          character.attributes.willpower ?? 2,
          character.attributes.awareness ?? 2,
          character.attributes.presence ?? 2,
          character.id
        );
      }
      // If no existing record, do nothing - let character-service handle creation
    }

    // Save skills using UPSERT to handle concurrent updates safely
    if (character.skills) {
      for (const [skillName, value] of Object.entries(character.skills)) {
        await db.run(
          `INSERT INTO Skill (id, characterId, skillName, value) 
           VALUES (?, ?, ?, ?)
           ON CONFLICT(characterId, skillName) DO UPDATE SET
             value = excluded.value`,
          `skill-${character.id}-${skillName}`,
          character.id,
          skillName,
          value
        );
      }
    }

    // Save expertises using UPSERT to handle concurrent updates safely
    if (character.selectedExpertises !== undefined) {
      if (Array.isArray(character.selectedExpertises) && character.selectedExpertises.length > 0) {
        for (const exp of character.selectedExpertises) {
          await db.run(
            `INSERT INTO SelectedExpertise (id, characterId, name, source, sourceId) 
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(characterId, name) DO UPDATE SET
               source = excluded.source,
               sourceId = excluded.sourceId`,
            `expertise-${character.id}-${exp.name}`,
            character.id,
            exp.name,
            exp.source || 'manual',
            exp.sourceId || ''
          );
        }
      } else {
        // Clear expertises if empty list provided
        await db.run('DELETE FROM SelectedExpertise WHERE characterId = ?', character.id);
      }
    }

    // Save unlocked talents using UPSERT to handle concurrent updates safely
    if (character.unlockedTalents !== undefined) {
      if (Array.isArray(character.unlockedTalents) && character.unlockedTalents.length > 0) {
        const now = new Date().toISOString();
        for (const talentId of character.unlockedTalents) {
          await db.run(
            `INSERT INTO UnlockedTalent (id, characterId, talentId, unlockedAt, level) 
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(characterId, talentId) DO UPDATE SET
               level = excluded.level`,
            `talent-${character.id}-${talentId}`,
            character.id,
            talentId,
            now,
            character.level ?? 1
          );
        }
      } else {
        // Clear talents if empty list provided
        await db.run('DELETE FROM UnlockedTalent WHERE characterId = ?', character.id);
      }
    }

    // Save paths using UPSERT to handle concurrent updates safely
    if (character.paths && character.paths.length > 0) {
      for (let i = 0; i < character.paths.length; i++) {
        const pathName = character.paths[i];
        const tier0TalentId = i === 0 ? character.mainPathTier0TalentId : null;
        await db.run(
          `INSERT INTO PathSelection (id, characterId, pathName, tier0TalentId) 
           VALUES (?, ?, ?, ?)
           ON CONFLICT(characterId, pathName) DO UPDATE SET
             tier0TalentId = excluded.tier0TalentId`,
          `path-${character.id}-${pathName}`,
          character.id,
          pathName,
          tier0TalentId
        );
      }
    }

    // Save cultures using UPSERT to handle concurrent updates safely
    if (character.cultures !== undefined) {
      if (Array.isArray(character.cultures) && character.cultures.length > 0) {
        for (const cultureName of character.cultures) {
          await db.run(
            `INSERT INTO CultureSelection (id, characterId, name, description, expertise, suggestedNames) 
             VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(characterId, name) DO UPDATE SET
               description = excluded.description,
               expertise = excluded.expertise,
               suggestedNames = excluded.suggestedNames`,
            `culture-${character.id}-${cultureName}`,
            character.id,
            cultureName,
            '', // description can be populated later if needed
            '', // expertise can be populated later if needed
            '[]' // suggestedNames as empty JSON array
          );
        }
      } else {
        // Clear cultures if empty list provided
        await db.run('DELETE FROM CultureSelection WHERE characterId = ?', character.id);
      }
    }

    // Save resources
    if (character.resources) {
      await db.run(
        `
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

    // Save inventory using UPSERT to handle concurrent updates safely
    if (character.inventory) {
      // Legacy format: array of items
      if (Array.isArray(character.inventory)) {
        for (const item of character.inventory) {
          await db.run(
            `INSERT INTO InventoryItem (id, characterId, itemId, quantity, equipped) 
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(characterId, itemId) DO UPDATE SET
               quantity = excluded.quantity,
               equipped = excluded.equipped`,
            `inv-${character.id}-${item.itemId}`,
            character.id,
            item.itemId,
            item.quantity ?? 1,
            item.equipped ? 1 : 0
          );
        }
      } else if (character.inventory.items && Array.isArray(character.inventory.items)) {
        const equippedSet = new Set<string>();

        // Map equipped items from equippedItems array
        if (Array.isArray(character.inventory.equippedItems)) {
          for (const entry of character.inventory.equippedItems) {
            const itemId = Array.isArray(entry) ? entry[1] : undefined;
            if (itemId) {
              equippedSet.add(itemId);
            }
          }
        }

        // Map equipped items from equipped object (if present)
        if (character.inventory.equipped) {
          const armorId =
            character.inventory.equipped.armor?.itemId || character.inventory.equipped.armor?.id;
          if (armorId) equippedSet.add(armorId);
          if (Array.isArray(character.inventory.equipped.weapons)) {
            character.inventory.equipped.weapons.forEach((weapon: any) => {
              const weaponId = weapon?.itemId || weapon?.id;
              if (weaponId) equippedSet.add(weaponId);
            });
          }
        }

        for (const item of character.inventory.items) {
          const itemId = item.itemId || item.id;
          if (!itemId) continue;
          await db.run(
            `INSERT INTO InventoryItem (id, characterId, itemId, quantity, equipped) 
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(characterId, itemId) DO UPDATE SET
               quantity = excluded.quantity,
               equipped = excluded.equipped`,
            `inv-${character.id}-${itemId}`,
            character.id,
            itemId,
            item.quantity ?? 1,
            equippedSet.has(itemId) ? 1 : 0
          );
        }
      }
    }

    // Save radiant path
    if (character.radiantPath) {
      await db.run(
        `
        INSERT INTO RadiantPath (id, characterId, boundOrder, currentIdeal, idealSpoken, surgePair, sprenType, radiantTier0TalentId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(characterId) DO UPDATE SET
          boundOrder = excluded.boundOrder,
          currentIdeal = excluded.currentIdeal,
          idealSpoken = excluded.idealSpoken,
          surgePair = excluded.surgePair,
          sprenType = excluded.sprenType,
          radiantTier0TalentId = excluded.radiantTier0TalentId
      `,
        `radiant-${character.id}`,
        character.id,
        character.radiantPath.boundOrder || null,
        character.radiantPath.currentIdeal ?? 1,
        character.radiantPath.idealSpoken ? 1 : 0,
        Array.isArray(character.radiantPath.surgePair)
          ? character.radiantPath.surgePair.join('/')
          : null,
        character.radiantPath.sprenType || null,
        character.radiantTier0TalentId || null
      );
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

      await db.run(
        `
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

    if (transactionStarted) {
      await db.run('COMMIT');
    }
    console.log(`[Database] Saved character: ${character.name} (${character.id})`);
    return { success: true, id: character.id };
  } catch (error) {
    if (transactionStarted) {
      try {
        await db.run('ROLLBACK');
      } catch (rollbackError) {
        // Transaction may not exist if another concurrent operation already committed
        console.warn(
          '[Database] Rollback failed (transaction may not be active):',
          (rollbackError as Error).message
        );
      }
    }
    console.error(`[Database] Error saving character ${character.id}:`, error);
    return { success: false, error: (error as Error).message };
  }
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
  let transactionStarted = false;
  try {
    // Check if we're already in a transaction (sqlite library doesn't expose this directly)
    // So we just try to begin and catch if nested
    try {
      await db.run('BEGIN TRANSACTION');
      transactionStarted = true;
    } catch (e: any) {
      // If we can't start a transaction, we're already in one, so proceed without explicit transaction
      if (!e.message?.includes('cannot start a transaction')) {
        throw e;
      }
      transactionStarted = false;
    }

    // Verify character exists
    const char = await db.get('SELECT id FROM Character WHERE id = ?', characterId);
    if (!char) {
      throw new Error(`Character not found: ${characterId}`);
    }

    // Get current talents
    const existing = await db.all(
      'SELECT talentId FROM UnlockedTalent WHERE characterId = ?',
      characterId
    );
    const existingIds = new Set(existing.map((t: any) => t.talentId));

    // Only create talents that don't already exist
    const newTalents = talentIds.filter((id) => !existingIds.has(id));
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
    const allTalents = await db.all(
      'SELECT talentId FROM UnlockedTalent WHERE characterId = ?',
      characterId
    );

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

    if (transactionStarted) {
      await db.run('COMMIT');
    }
    console.log(`[Database] Unlocked talents for ${characterId}: ${talentIds.join(', ')}`);
    return { success: true, unlockedTalents: allTalents.map((t: any) => t.talentId) };
  } catch (error) {
    if (transactionStarted) {
      try {
        await db.run('ROLLBACK');
      } catch (rollbackError) {
        // Transaction may not exist if another concurrent operation already committed
        console.warn(
          '[Database] Rollback failed (transaction may not be active):',
          (rollbackError as Error).message
        );
      }
    }
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

/**
 * List all characters
 */
export async function listCharacters(): Promise<CharacterData[]> {
  if (!dbInitialized || !db) {
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

/**
 * Clear all data from database (for testing)
 */
export async function clearDatabase(): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  try {
    await db.exec(`
      DELETE FROM UnlockedSingerForm;
      DELETE FROM UnlockedTalent;
      DELETE FROM SelectedExpertise;
      DELETE FROM InventoryItem;
      DELETE FROM Skill;
      DELETE FROM CharacterResources;
      DELETE FROM RadiantPath;
      DELETE FROM SpentPoints;
      DELETE FROM Attributes;
      DELETE FROM CharacterTalents;
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
