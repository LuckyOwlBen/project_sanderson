import { Database as SqliteDatabase } from 'sqlite';

export async function initializeDbSchema(db: SqliteDatabase): Promise<void> {
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