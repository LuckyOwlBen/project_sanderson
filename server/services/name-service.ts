import { NameModuleRepository } from '../repositories/modules/name-repository';

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

  const result = await nameRepository.save(characterId, name, level);
  if (!result.success) {
    throw new Error(result.error || 'Failed to save name');
  }

  return {
    name,
    level,
    cultures
  };
}
