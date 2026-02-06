import {
  createSkillsStateRecord,
  getSkillsStateRecord,
  getSkillRanks,
  loadCharacter,
  replaceSkillRanks,
  updateSkillsStateRecord,
  setSkillsStateFinalized
} from '../database';
import { pointAllocationService } from './point-allocation-service';

export interface SkillsStateDTO {
  characterId: string;
  totalPoints: number;
  pointsSpent: number;
  pointsRemaining: number;
  finalized: boolean;
  skills: Record<string, number>;
}

export function createEmptySkillsDTO(characterId: string): SkillsStateDTO {
  return {
    characterId,
    totalPoints: 0,
    pointsSpent: 0,
    pointsRemaining: 0,
    finalized: false,
    skills: {}
  };
}

async function getCharacterLevel(characterId: string): Promise<number> {
  const character = await loadCharacter(characterId);
  return character?.level ?? 1;
}

export async function getSkillsByCharacterId(characterId: string): Promise<SkillsStateDTO> {
  const level = await getCharacterLevel(characterId);
  const totalPoints = pointAllocationService.getTotalSkillPointsAvailable(level);

  const skills = await getSkillRanks(characterId);
  const pointsSpent = Object.values(skills).reduce((sum, value) => sum + (Number(value) || 0), 0);
  const pointsRemaining = Math.max(0, totalPoints - pointsSpent);

  let state = await getSkillsStateRecord(characterId);
  if (!state) {
    state = await createSkillsStateRecord({
      characterId,
      totalPoints,
      pointsSpent,
      pointsRemaining,
      finalized: false
    });
  } else if (
    state.totalPoints !== totalPoints ||
    state.pointsSpent !== pointsSpent ||
    state.pointsRemaining !== pointsRemaining
  ) {
    state = await updateSkillsStateRecord(characterId, {
      totalPoints,
      pointsSpent,
      pointsRemaining
    });
  }

  return {
    characterId,
    totalPoints: state.totalPoints,
    pointsSpent: state.pointsSpent,
    pointsRemaining: state.pointsRemaining,
    finalized: state.finalized,
    skills
  };
}

export async function setSkillsByCharacterId(
  characterId: string,
  skills: Record<string, number>
): Promise<SkillsStateDTO> {
  const level = await getCharacterLevel(characterId);
  const totalPoints = pointAllocationService.getTotalSkillPointsAvailable(level);
  const pointsSpent = Object.values(skills).reduce((sum, value) => sum + (Number(value) || 0), 0);
  const pointsRemaining = Math.max(0, totalPoints - pointsSpent);

  await replaceSkillRanks(characterId, skills);

  const existing = await getSkillsStateRecord(characterId);
  const updated = existing
    ? await updateSkillsStateRecord(characterId, {
        totalPoints,
        pointsSpent,
        pointsRemaining
      })
    : await createSkillsStateRecord({
        characterId,
        totalPoints,
        pointsSpent,
        pointsRemaining,
        finalized: false
      });

  return {
    characterId,
    totalPoints: updated.totalPoints,
    pointsSpent: updated.pointsSpent,
    pointsRemaining: updated.pointsRemaining,
    finalized: updated.finalized,
    skills
  };
}

/**
 * Finalize skills for a character
 * Validates all points are spent, moves spent points to total, and locks from editing
 * 
 * Called during character creation finalization
 */
export async function finalizeSkillsForCharacter(characterId: string): Promise<void> {
  const existing = await getSkillsStateRecord(characterId);
  if (!existing) {
    throw new Error(`Skills state record not found for character ${characterId}`);
  }

  // Validate all points are spent
  if (existing.pointsRemaining > 0) {
    throw new Error(
      `Cannot finalize skills: ${existing.pointsRemaining} points remaining. All points must be spent.`
    );
  }

  // Finalize: lock in the allocated values
  // totalPoints stays the same (don't double it), pointsRemaining becomes 0
  await updateSkillsStateRecord(characterId, {
    pointsRemaining: 0,
    finalized: true
  });

  console.log(
    `[SkillsFinalization] Finalized skills for character: ${characterId} with ${existing.pointsSpent} points allocated`
  );
}
