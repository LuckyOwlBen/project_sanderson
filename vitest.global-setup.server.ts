/**
 * Global setup for server tests
 * Initializes the database before running tests
 */

import { initDatabase, initializeSchema } from './server/database';

export async function setup() {
  console.log('[vitest.global-setup.server] Initializing database...');
  try {
    await initDatabase();
    await initializeSchema();
    console.log('[vitest.global-setup.server] Database initialized successfully');
  } catch (error) {
    console.error('[vitest.global-setup.server] Failed to initialize database:', error);
    throw error;
  }
}

export async function teardown() {
  console.log('[vitest.global-setup.server] Teardown complete');
}
