import { PathsModuleRepository } from '../repositories/modules/paths-repository';

export interface PathsDTO {
  type: string | null;
  sub: string | null;
}

const pathsRepository = new PathsModuleRepository();

export function createEmptyPathsDTO(): PathsDTO {
  return {
    type: null,
    sub: null
  };
}

export async function getPathsByCharacterId(characterId: string): Promise<PathsDTO> {
  const paths = await pathsRepository.load(characterId);
  return paths ?? createEmptyPathsDTO();
}

export async function setPathsByCharacterId(
  characterId: string,
  type: string,
  sub: string
): Promise<PathsDTO> {
  const result = await pathsRepository.save(characterId, type, sub);
  if (!result.success) {
    throw new Error(result.error || 'Failed to save paths');
  }

  return {
    type,
    sub
  };
}
