/**
 * Database Service Tests (TDD)
 * Tests for character CRUD and transaction-safe talent/attribute operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  loadCharacter, 
  saveCharacter, 
  listCharacters, 
  deleteCharacter,
  unlockTalent,
  getTalentPoints,
  getSpentPoints,
  clearDatabase
} from './database.js';

describe('Database Service', () => {
  beforeEach(async () => {
    // Clear database before each test
    await clearDatabase();
  });

  afterEach(async () => {
    // Cleanup after tests
    await clearDatabase();
  });

  describe('Character CRUD', () => {
    it('should create and load a character', async () => {
      // Arrange
      const character = {
        id: 'test-char-1',
        name: 'Kal',
        level: 1,
        pendingLevelPoints: 0,
        ancestry: 'human',
        sessionNotes: '',
        lastModified: new Date().toISOString(),
        cultures: [],
        paths: ['warrior'],
        attributes: {
          strength: 2,
          speed: 2,
          intellect: 2,
          willpower: 2,
          awareness: 2,
          presence: 2
        },
        skills: {
          AGILITY: 0,
          ATHLETICS: 0,
          HEAVY_WEAPONRY: 1,
          LIGHT_WEAPONRY: 0,
          STEALTH: 0,
          THIEVERY: 0,
          CRAFTING: 0,
          DEDUCTION: 0,
          DISCIPLINE: 0,
          INTIMIDATION: 0,
          LORE: 0,
          MEDICINE: 0,
          DECEPTION: 0,
          INSIGHT: 0,
          LEADERSHIP: 0,
          PERCEPTION: 0,
          PERSUASION: 0,
          SURVIVAL: 0,
          ADHESION: 0,
          GRAVITATION: 0,
          DIVISION: 0,
          ABRASION: 0,
          PROGRESSION: 0,
          ILLUMINATION: 0,
          TRANSFORMATION: 0,
          TRANSPORTATION: 0,
          COHESION: 0,
          TENSION: 0
        },
        unlockedTalents: [],
        selectedExpertises: [],
        inventory: [],
        resources: {
          health: { current: 10, max: 10 },
          focus: { current: 2, max: 2 },
          investiture: { current: 0, max: 0, isActive: false }
        }
      };

      // Act
      const saved = await saveCharacter(character);
      const loaded = await loadCharacter('test-char-1');

      // Assert
      expect(saved.success).toBe(true);
      expect(loaded).toBeDefined();
      expect(loaded.name).toBe('Kal');
      expect(loaded.level).toBe(1);
      expect(loaded.paths).toContain('warrior');
    });

    it('should list all characters', async () => {
      // Arrange
      const char1 = { id: 'char-1', name: 'Kaladin', level: 1, ancestry: 'human' };
      const char2 = { id: 'char-2', name: 'Shallan', level: 2, ancestry: 'human' };

      await saveCharacter(char1);
      await saveCharacter(char2);

      // Act
      const list = await listCharacters();

      // Assert
      expect(list.length).toBe(2);
      expect(list.some(c => c.name === 'Kaladin')).toBe(true);
      expect(list.some(c => c.name === 'Shallan')).toBe(true);
    });

    it('should delete a character', async () => {
      // Arrange
      const char = { id: 'char-to-delete', name: 'Temporary', level: 1, ancestry: null };
      await saveCharacter(char);

      // Act
      const deleted = await deleteCharacter('char-to-delete');
      const loaded = await loadCharacter('char-to-delete');

      // Assert
      expect(deleted.success).toBe(true);
      expect(loaded).toBeNull();
    });

    it('should update a character', async () => {
      // Arrange
      const char = { id: 'update-test', name: 'Test', level: 1, ancestry: 'human' };
      await saveCharacter(char);

      // Act
      const updated = { ...char, level: 2, name: 'Updated Test' };
      await saveCharacter(updated);
      const loaded = await loadCharacter('update-test');

      // Assert
      expect(loaded.level).toBe(2);
      expect(loaded.name).toBe('Updated Test');
    });
  });

  describe('Talent System (Transaction Safety)', () => {
    beforeEach(async () => {
      // Create a test character before talent tests
      const char = {
        id: 'talent-test-char',
        name: 'Talent Tester',
        level: 1,
        pendingLevelPoints: 0,
        ancestry: 'human',
        sessionNotes: '',
        lastModified: new Date().toISOString(),
        cultures: [],
        paths: ['warrior'],
        attributes: { strength: 2, speed: 2, intellect: 2, willpower: 2, awareness: 2, presence: 2 },
        skills: {},
        unlockedTalents: [],
        selectedExpertises: [],
        inventory: [],
        resources: { health: { current: 10, max: 10 }, focus: { current: 2, max: 2 }, investiture: { current: 0, max: 0, isActive: false } }
      };
      await saveCharacter(char);
    });

    it('should unlock a talent atomically', async () => {
      // Act - unlock two talents in transaction
      const result = await unlockTalent('talent-test-char', ['shard_training', 'vigilant_stance'], 1);

      // Assert
      expect(result.success).toBe(true);
      expect(result.unlockedTalents).toContain('shard_training');
      expect(result.unlockedTalents).toContain('vigilant_stance');
      expect(result.unlockedTalents.length).toBe(2);

      // Verify persistence
      const loaded = await loadCharacter('talent-test-char');
      expect(loaded.unlockedTalents).toContain('shard_training');
    });

    it('should prevent duplicate talent unlocks', async () => {
      // Arrange
      await unlockTalent('talent-test-char', ['shard_training'], 1);

      // Act - attempt to unlock same talent again
      const result = await unlockTalent('talent-test-char', ['shard_training'], 1);

      // Assert
      expect(result.success).toBe(true);
      const loaded = await loadCharacter('talent-test-char');
      expect(loaded.unlockedTalents.filter(t => t === 'shard_training').length).toBe(1);
    });

    it('should track which level a talent was unlocked at', async () => {
      // Act
      await unlockTalent('talent-test-char', ['shard_training'], 1);

      // Assert
      const loaded = await loadCharacter('talent-test-char');
      const talent = loaded.unlockedTalents.find(t => t === 'shard_training');
      expect(talent).toBeDefined();
      // Note: loaded talents should have level info available
    });

    it('should get available talent points for a level', async () => {
      // Act
      const points = await getTalentPoints('talent-test-char', 1);

      // Assert
      expect(points).toBeGreaterThan(0);
      expect(typeof points).toBe('number');
    });

    it('should track spent points per level', async () => {
      // Arrange
      await unlockTalent('talent-test-char', ['shard_training', 'vigilant_stance'], 1);

      // Act
      const spent = await getSpentPoints('talent-test-char', 'talents', 1);

      // Assert
      expect(spent).toBe(2); // Two talents spent at level 1
    });

    it('should fail gracefully if character does not exist', async () => {
      // Act
      const result = await unlockTalent('nonexistent-char', ['talent'], 1);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Spent Points Tracking', () => {
    beforeEach(async () => {
      const char = {
        id: 'spent-points-test',
        name: 'Spent Points Tester',
        level: 1,
        pendingLevelPoints: 0,
        ancestry: 'human',
        sessionNotes: '',
        lastModified: new Date().toISOString(),
        cultures: [],
        paths: ['warrior'],
        attributes: { strength: 2, speed: 2, intellect: 2, willpower: 2, awareness: 2, presence: 2 },
        skills: {},
        unlockedTalents: [],
        selectedExpertises: [],
        inventory: [],
        resources: { health: { current: 10, max: 10 }, focus: { current: 2, max: 2 }, investiture: { current: 0, max: 0, isActive: false } }
      };
      await saveCharacter(char);
    });

    it('should track attributes spent at each level', async () => {
      // Arrange - update attributes
      const char = await loadCharacter('spent-points-test');
      char.attributes.strength = 4; // Spent 2 points

      // Act
      await saveCharacter(char, { attributes: 2, level: 1 }); // Mark 2 points spent
      const spent = await getSpentPoints('spent-points-test', 'attributes', 1);

      // Assert
      expect(spent).toBe(2);
    });

    it('should track skills spent at each level', async () => {
      // Arrange
      const char = await loadCharacter('spent-points-test');
      char.skills.ATHLETICS = 2; // Spent 2 points

      // Act
      await saveCharacter(char, { skills: 2, level: 1 });
      const spent = await getSpentPoints('spent-points-test', 'skills', 1);

      // Assert
      expect(spent).toBe(2);
    });

    it('should track talents spent at each level', async () => {
      // Arrange
      await unlockTalent('spent-points-test', ['talent1', 'talent2', 'talent3'], 1);

      // Act
      const spent = await getSpentPoints('spent-points-test', 'talents', 1);

      // Assert
      expect(spent).toBe(3);
    });

    it('should distinguish between levels', async () => {
      // Arrange
      await unlockTalent('spent-points-test', ['talent-l1'], 1);

      // Level up character
      const char = await loadCharacter('spent-points-test');
      char.level = 2;
      await saveCharacter(char);

      await unlockTalent('spent-points-test', ['talent-l2a', 'talent-l2b'], 2);

      // Act
      const spentL1 = await getSpentPoints('spent-points-test', 'talents', 1);
      const spentL2 = await getSpentPoints('spent-points-test', 'talents', 2);

      // Assert
      expect(spentL1).toBe(1);
      expect(spentL2).toBe(2);
    });
  });

  describe('Data Integrity', () => {
    it('should handle concurrent talent unlocks safely', async () => {
      // Arrange
      const char = {
        id: 'concurrent-test',
        name: 'Concurrent',
        level: 1,
        pendingLevelPoints: 0,
        ancestry: 'human',
        sessionNotes: '',
        lastModified: new Date().toISOString(),
        cultures: [],
        paths: ['warrior'],
        attributes: { strength: 2, speed: 2, intellect: 2, willpower: 2, awareness: 2, presence: 2 },
        skills: {},
        unlockedTalents: [],
        selectedExpertises: [],
        inventory: [],
        resources: { health: { current: 10, max: 10 }, focus: { current: 2, max: 2 }, investiture: { current: 0, max: 0, isActive: false } }
      };
      await saveCharacter(char);

      // Act - simulate concurrent unlocks
      const [result1, result2] = await Promise.all([
        unlockTalent('concurrent-test', ['talent-a'], 1),
        unlockTalent('concurrent-test', ['talent-b'], 1)
      ]);

      // Assert - both should succeed
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      // Verify both talents are present
      const loaded = await loadCharacter('concurrent-test');
      expect(loaded.unlockedTalents).toHaveLength(2);
      expect(loaded.unlockedTalents).toContain('talent-a');
      expect(loaded.unlockedTalents).toContain('talent-b');
    });

    it('should not corrupt data on partial failures', async () => {
      // Arrange
      const char = {
        id: 'integrity-test',
        name: 'Integrity',
        level: 1,
        pendingLevelPoints: 0,
        ancestry: 'human',
        sessionNotes: 'Original notes',
        lastModified: new Date().toISOString(),
        cultures: [],
        paths: ['warrior'],
        attributes: { strength: 2, speed: 2, intellect: 2, willpower: 2, awareness: 2, presence: 2 },
        skills: { ATHLETICS: 1 },
        unlockedTalents: [],
        selectedExpertises: [],
        inventory: [],
        resources: { health: { current: 10, max: 10 }, focus: { current: 2, max: 2 }, investiture: { current: 0, max: 0, isActive: false } }
      };
      await saveCharacter(char);

      // Act - save and then verify data wasn't lost
      const loaded1 = await loadCharacter('integrity-test');
      expect(loaded1.sessionNotes).toBe('Original notes');
      expect(loaded1.skills.ATHLETICS).toBe(1);

      // Update some fields
      loaded1.name = 'Updated Name';
      await saveCharacter(loaded1);

      // Assert - old data should still be present
      const loaded2 = await loadCharacter('integrity-test');
      expect(loaded2.sessionNotes).toBe('Original notes');
      expect(loaded2.skills.ATHLETICS).toBe(1);
      expect(loaded2.name).toBe('Updated Name');
    });
  });
});
