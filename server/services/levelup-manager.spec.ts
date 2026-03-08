/**
 * LevelUpManager.getCreationLevelBonuses() tests
 *
 * Validates that creation-level budget recalculation is idempotent,
 * handles both increases and decreases, and clamps correctly when
 * the user has already spent points.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock database layer ────────────────────────────────────────────────
const mockGetAttributesRecord = vi.fn();
const mockUpdateAttributesRecord = vi.fn();
const mockGetSkillsStateRecord = vi.fn();
const mockUpdateSkillsStateRecord = vi.fn();
const mockGetTalentsStateRecord = vi.fn();
const mockUpdateTalentsStateRecord = vi.fn();

vi.mock('../database', () => ({
  getAttributesRecord: (...args: unknown[]) => mockGetAttributesRecord(...args),
  updateAttributesRecord: (...args: unknown[]) => mockUpdateAttributesRecord(...args),
  getSkillsStateRecord: (...args: unknown[]) => mockGetSkillsStateRecord(...args),
  updateSkillsStateRecord: (...args: unknown[]) => mockUpdateSkillsStateRecord(...args),
  getTalentsStateRecord: (...args: unknown[]) => mockGetTalentsStateRecord(...args),
  updateTalentsStateRecord: (...args: unknown[]) => mockUpdateTalentsStateRecord(...args),
  getExpertiseStateRecord: vi.fn(),
  updateExpertiseStateRecord: vi.fn(),
}));

vi.mock('../repositories/character-repository', () => ({
  characterRepository: {},
}));

// ── System under test ──────────────────────────────────────────────────
import { LevelUpManager } from './levelup-manager';

// Expected cumulative totals from calculation-constants:
//   Attr:   L1=12, L2=12, L3=13, L4=13, L5=13, L6=14, ...
//   Skills: L1=4,  L2=6,  L3=8,  L4=10, L5=12, L6=14, ...
//   Talent: L1=2,  L2=3,  L3=4,  L4=5,  L5=6,  L6=8,  ...

const CID = 'test-char-1';

function freshRecord(totalPoints: number, spent = 0) {
  return {
    totalPoints,
    pointsSpent: spent,
    pointsRemaining: totalPoints - spent,
    finalized: false,
  };
}

describe('LevelUpManager.getCreationLevelBonuses', () => {
  let manager: LevelUpManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new LevelUpManager();

    // Default: records start at level-1 values, nothing spent
    mockGetAttributesRecord.mockResolvedValue(freshRecord(12));
    mockGetSkillsStateRecord.mockResolvedValue(freshRecord(4));
    mockGetTalentsStateRecord.mockResolvedValue(freshRecord(2));

    mockUpdateAttributesRecord.mockResolvedValue(undefined);
    mockUpdateSkillsStateRecord.mockResolvedValue(undefined);
    mockUpdateTalentsStateRecord.mockResolvedValue(undefined);
  });

  // ────────────────────────────────────────────────────────────────────
  // Basic level calculations
  // ────────────────────────────────────────────────────────────────────

  it('level 1 → base points (Attr 12, Skills 4, Talents 2)', async () => {
    await manager.getCreationLevelBonuses(CID, 1);

    expect(mockUpdateAttributesRecord).toHaveBeenCalledWith(CID, expect.objectContaining({
      totalPoints: 12,
      pointsRemaining: 12,
    }));
    expect(mockUpdateSkillsStateRecord).toHaveBeenCalledWith(CID, expect.objectContaining({
      totalPoints: 4,
      pointsRemaining: 4,
    }));
    expect(mockUpdateTalentsStateRecord).toHaveBeenCalledWith(CID, expect.objectContaining({
      totalPoints: 2,
      pointsRemaining: 2,
    }));
  });

  it('level 5 → cumulative points (Attr 13, Skills 12, Talents 6)', async () => {
    await manager.getCreationLevelBonuses(CID, 5);

    expect(mockUpdateAttributesRecord).toHaveBeenCalledWith(CID, expect.objectContaining({
      totalPoints: 13,
      pointsRemaining: 13,
    }));
    expect(mockUpdateSkillsStateRecord).toHaveBeenCalledWith(CID, expect.objectContaining({
      totalPoints: 12,
      pointsRemaining: 12,
    }));
    expect(mockUpdateTalentsStateRecord).toHaveBeenCalledWith(CID, expect.objectContaining({
      totalPoints: 6,
      pointsRemaining: 6,
    }));
  });

  // ────────────────────────────────────────────────────────────────────
  // Level decrease
  // ────────────────────────────────────────────────────────────────────

  it('level decrease (5 → 3) reduces budgets correctly', async () => {
    // Simulate records already adjusted to level 5 totals
    mockGetAttributesRecord.mockResolvedValue(freshRecord(13));
    mockGetSkillsStateRecord.mockResolvedValue(freshRecord(12));
    mockGetTalentsStateRecord.mockResolvedValue(freshRecord(6));

    await manager.getCreationLevelBonuses(CID, 3);

    // Level 3 totals: Attr 13, Skills 8, Talents 4
    expect(mockUpdateAttributesRecord).toHaveBeenCalledWith(CID, expect.objectContaining({
      totalPoints: 13,
      pointsRemaining: 13,
    }));
    expect(mockUpdateSkillsStateRecord).toHaveBeenCalledWith(CID, expect.objectContaining({
      totalPoints: 8,
      pointsRemaining: 8,
    }));
    expect(mockUpdateTalentsStateRecord).toHaveBeenCalledWith(CID, expect.objectContaining({
      totalPoints: 4,
      pointsRemaining: 4,
    }));
  });

  // ────────────────────────────────────────────────────────────────────
  // Idempotency
  // ────────────────────────────────────────────────────────────────────

  it('calling twice at same level produces identical results', async () => {
    await manager.getCreationLevelBonuses(CID, 5);

    // Simulate records now reflecting level 5 totals (as the first call set them)
    mockGetAttributesRecord.mockResolvedValue(freshRecord(13));
    mockGetSkillsStateRecord.mockResolvedValue(freshRecord(12));
    mockGetTalentsStateRecord.mockResolvedValue(freshRecord(6));

    await manager.getCreationLevelBonuses(CID, 5);

    // Second call should write the exact same values
    const attrCalls = mockUpdateAttributesRecord.mock.calls;
    expect(attrCalls[1][1]).toEqual(expect.objectContaining({
      totalPoints: 13,
      pointsRemaining: 13,
    }));
  });

  // ────────────────────────────────────────────────────────────────────
  // Points already spent
  // ────────────────────────────────────────────────────────────────────

  it('accounts for pointsSpent when recalculating remaining', async () => {
    // User already spent 5 attribute points at level 5
    mockGetAttributesRecord.mockResolvedValue(freshRecord(13, 5));
    mockGetSkillsStateRecord.mockResolvedValue(freshRecord(12, 3));
    mockGetTalentsStateRecord.mockResolvedValue(freshRecord(6, 2));

    await manager.getCreationLevelBonuses(CID, 5);

    expect(mockUpdateAttributesRecord).toHaveBeenCalledWith(CID, expect.objectContaining({
      totalPoints: 13,
      pointsRemaining: 8,  // 13 - 5
    }));
    expect(mockUpdateSkillsStateRecord).toHaveBeenCalledWith(CID, expect.objectContaining({
      totalPoints: 12,
      pointsRemaining: 9,  // 12 - 3
    }));
    expect(mockUpdateTalentsStateRecord).toHaveBeenCalledWith(CID, expect.objectContaining({
      totalPoints: 6,
      pointsRemaining: 4,  // 6 - 2
    }));
  });

  // ────────────────────────────────────────────────────────────────────
  // Overspend (level decrease after spending)
  // ────────────────────────────────────────────────────────────────────

  it('clamps pointsRemaining to 0 and unfinalizes when spent exceeds new budget', async () => {
    // At level 5: total attr = 13, user spent 12 → remaining was 1
    // Now decrease to level 1: total attr = 12, but 12 spent → remaining should be 0
    mockGetAttributesRecord.mockResolvedValue({
      totalPoints: 13,
      pointsSpent: 12,
      pointsRemaining: 1,
      finalized: true,
    });
    // Skills: spent 10 at level 5 (total 12), drop to level 1 (total 4) → spent 10 > 4
    mockGetSkillsStateRecord.mockResolvedValue({
      totalPoints: 12,
      pointsSpent: 10,
      pointsRemaining: 2,
      finalized: true,
    });
    mockGetTalentsStateRecord.mockResolvedValue(freshRecord(6, 1));

    await manager.getCreationLevelBonuses(CID, 1);

    // Attributes: 12 total, 12 spent → 0 remaining, no overbudget
    expect(mockUpdateAttributesRecord).toHaveBeenCalledWith(CID, expect.objectContaining({
      totalPoints: 12,
      pointsRemaining: 0,
    }));
    // Skills: 4 total, 10 spent → 0 remaining, overbudget → finalized: false
    expect(mockUpdateSkillsStateRecord).toHaveBeenCalledWith(CID, expect.objectContaining({
      totalPoints: 4,
      pointsRemaining: 0,
      finalized: false,
    }));
    // Talents: 2 total, 1 spent → 1 remaining, no overbudget
    expect(mockUpdateTalentsStateRecord).toHaveBeenCalledWith(CID, expect.objectContaining({
      totalPoints: 2,
      pointsRemaining: 1,
    }));
  });

  // ────────────────────────────────────────────────────────────────────
  // Level increase
  // ────────────────────────────────────────────────────────────────────

  it('level increase (3 → 8) adds correct budget', async () => {
    // Records reflect level 3 totals with some spending
    mockGetAttributesRecord.mockResolvedValue(freshRecord(13, 6));
    mockGetSkillsStateRecord.mockResolvedValue(freshRecord(8, 4));
    mockGetTalentsStateRecord.mockResolvedValue(freshRecord(4, 3));

    await manager.getCreationLevelBonuses(CID, 8);

    // Level 8: Attr=14, Skills=18, Talents=10 (2+1+1+1+1+2+1+1)
    expect(mockUpdateAttributesRecord).toHaveBeenCalledWith(CID, expect.objectContaining({
      totalPoints: 14,
      pointsRemaining: 8,  // 14 - 6
    }));
    expect(mockUpdateSkillsStateRecord).toHaveBeenCalledWith(CID, expect.objectContaining({
      totalPoints: 18,
      pointsRemaining: 14, // 18 - 4
    }));
    expect(mockUpdateTalentsStateRecord).toHaveBeenCalledWith(CID, expect.objectContaining({
      totalPoints: 10,
      pointsRemaining: 7,  // 10 - 3
    }));
  });

  // ────────────────────────────────────────────────────────────────────
  // Missing records (edge case)
  // ────────────────────────────────────────────────────────────────────

  it('does not throw when state records are null', async () => {
    mockGetAttributesRecord.mockResolvedValue(null);
    mockGetSkillsStateRecord.mockResolvedValue(null);
    mockGetTalentsStateRecord.mockResolvedValue(null);

    await expect(manager.getCreationLevelBonuses(CID, 5)).resolves.not.toThrow();

    expect(mockUpdateAttributesRecord).not.toHaveBeenCalled();
    expect(mockUpdateSkillsStateRecord).not.toHaveBeenCalled();
    expect(mockUpdateTalentsStateRecord).not.toHaveBeenCalled();
  });
});
