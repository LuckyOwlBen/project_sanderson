import { AncestryModuleRepository } from '../repositories/modules/ancestry-repository';

export interface CultureDTO {
  ancestry: string | null;
  cultures: string[];
  paths: string[];
}

const ancestryRepository = new AncestryModuleRepository();

export function createEmptyCultureDTO(): CultureDTO {
  return {
    ancestry: null,
    cultures: [],
    paths: []
  };
}

export async function getCulturesByCharacterId(characterId: string): Promise<CultureDTO> {
  const data = await ancestryRepository.load(characterId);
  return data ?? createEmptyCultureDTO();
}

export async function setCulturesByCharacterId(
  characterId: string,
  cultures: string[]
): Promise<CultureDTO> {
  const existing = await ancestryRepository.load(characterId);
  const ancestry = existing?.ancestry ?? null;
  const paths = existing?.paths ?? [];

  const result = await ancestryRepository.save(characterId, ancestry, cultures, paths);
  if (!result.success) {
    throw new Error(result.error || 'Failed to save cultures');
  }

  return {
    ancestry,
    cultures,
    paths
  };
}
