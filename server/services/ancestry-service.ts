import { AncestryModuleRepository } from '../repositories/modules/ancestry-repository';

export interface AncestryDTO {
  ancestry: string | null;
  cultures: string[];
  paths: string[];
}

const ancestryRepository = new AncestryModuleRepository();

export function createEmptyAncestryDTO(): AncestryDTO {
  return {
    ancestry: null,
    cultures: [],
    paths: []
  };
}

export async function getAncestryByCharacterId(characterId: string): Promise<AncestryDTO> {
  const ancestry = await ancestryRepository.load(characterId);
  return ancestry ?? createEmptyAncestryDTO();
}

export async function setAncestryByCharacterId(
  characterId: string,
  ancestry: string | null
): Promise<AncestryDTO> {
  const existing = await ancestryRepository.load(characterId);
  const cultures = existing?.cultures ?? [];
  const paths = existing?.paths ?? [];

  const result = await ancestryRepository.save(characterId, ancestry, cultures, paths);
  if (!result.success) {
    throw new Error(result.error || 'Failed to save ancestry');
  }

  return {
    ancestry,
    cultures,
    paths
  };
}
