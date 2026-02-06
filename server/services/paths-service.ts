import { PathsModuleRepository } from '../repositories/modules/paths-repository';

export interface PathsDTO {
  type: string | null;
  sub: string | null;
}

const pathsRepository = new PathsModuleRepository();

// Mapping of path types to their tier 0 talents
const PATH_TIER0_TALENTS: Record<string, string> = {
  'warrior': 'vigilant_stance',
  'scholar': 'education',
  'hunter': 'seek_quarry',
  'leader': 'decisive_command',
  'envoy': 'rousing_presence',
  'agent': 'opportunist'
};

// Mapping of radiant orders to their tier 0 talents
const RADIANT_TIER0_TALENTS: Record<string, string> = {
  'windrunner': 'windrunner_key_talent',
  'skybreaker': 'skybreaker_key_talent',
  'dustbringer': 'dustbringer_key_talent',
  'edgedancer': 'edgedancer_key_talent',
  'truthwatcher': 'truthwatcher_key_talent',
  'lightweaver': 'lightweaver_key_talent',
  'elsecaller': 'elsecaller_key_talent',
  'willshaper': 'willshaper_key_talent',
  'stoneward': 'stoneward_key_talent',
  'bondsmith': 'bondsmith_key_talent'
};

export { RADIANT_TIER0_TALENTS };

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
  const tier0TalentId = PATH_TIER0_TALENTS[type] || null;
  const result = await pathsRepository.save(characterId, type, sub, tier0TalentId);
  if (!result.success) {
    throw new Error(result.error || 'Failed to save paths');
  }

  return {
    type,
    sub
  };
}
