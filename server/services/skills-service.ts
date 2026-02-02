import {
  createSkillsStateRecord,
  getSkillsStateRecord,
  getSkillRanks,
  loadCharacter,
  replaceSkillRanks,
  updateSkillsStateRecord
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
