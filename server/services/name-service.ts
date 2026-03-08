import { NameModuleRepository } from '../repositories/modules/name-repository';
import { levelUpManager } from './levelup-manager';

export interface NameDTO {
  name: string;
  level: number;
  cultures: string[];
}

const nameRepository = new NameModuleRepository();

export function createEmptyNameDTO(): NameDTO {
  return {
    name: '',
    level: 1,
    cultures: []
  };
}

export async function getNameByCharacterId(characterId: string): Promise<NameDTO> {
  const name = await nameRepository.load(characterId);
  return name ?? createEmptyNameDTO();
}

export async function setNameByCharacterId(
  characterId: string,
  name: string,
  level: number
): Promise<NameDTO> {
  const existing = await nameRepository.load(characterId);
  const cultures = existing?.cultures ?? [];

  console.log(`[Name] Saving name for character ${characterId}: "${name}" at level ${level}`);

  const result = await nameRepository.save(characterId, name, level);
  if (!result.success) {
    throw new Error(result.error || 'Failed to save name');
  }

  console.log(`[Name] Name saved successfully, recalculating point budgets for level ${level}`);

  // Recalculate point budgets for the selected creation level (idempotent)
  await levelUpManager.getCreationLevelBonuses(characterId, level);

  return {
    name,
    level,
    cultures
  };
}
