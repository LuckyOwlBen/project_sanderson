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
import { initializeDbSchema } from './dbSchema';

export { dbInitialized, dbError };


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
      driver: sqlite3.Database
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

/**
 * Initialize database schema if it doesn't exist
 */
export async function initializeSchema() {
  if (!db) throw new Error('Database not initialized');
  await initializeDbSchema(db);
}

export function getDbInstance(): SqliteDatabase {
  if(!db) throw new Error('Database not initialized');
  return db;
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


