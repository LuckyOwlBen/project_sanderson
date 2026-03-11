import {
  createTalentsStateRecord,
  getTalentsStateRecord,
  updateTalentsStateRecord,
  loadCharacter
} from '../database';
import { getTalentPath, getTalentTree } from 'shared/data/talents/talentTrees';
import { AvailableTreeDTO, AvailableNodeDTO } from 'shared/types/talents';
import canUnlockTalentForCharacter from 'shared/data/talents/prereqChecker';
import { getPathsByCharacterId, RADIANT_TIER0_TALENTS } from './paths-service';

export interface RadiantPathData {
  boundOrder: string | null;
  currentIdeal: number;
  idealSpoken: boolean;
  surgePair: string | null;
  sprenType: string | null;
}

export interface TalentsStateDTO {
  characterId: string;
  totalPoints: number;
  pointsSpent: number;
  pointsRemaining: number;
  finalized: boolean;
  totalTalents: string[];
  pendingTalents: string[];
  pendingTrees: string[];  // Selected bonus tree paths (removable until finalized)
  availableTrees: AvailableTreeDTO[];
  selectedTreeId: string | null;
  requiresSingerSelection: boolean;
  ancestry: string | null;
  level: number;
  radiantPath?: RadiantPathData;
}

export function createEmptyTalentsDTO(characterId: string): TalentsStateDTO {
  return {
    characterId,
    totalPoints: 0,
    pointsSpent: 0,
    pointsRemaining: 0,
    finalized: false,
    totalTalents: [],
    pendingTalents: [],
    pendingTrees: [],
    availableTrees: [],
    selectedTreeId: null,
    requiresSingerSelection: false,
    ancestry: null,
    level: 1
  };
}

function normalizePaths(paths: { type: string | null; sub: string | null }): { mainPathName: string | null; specializationName: string | null } {
  const corePaths = ['warrior', 'scholar', 'hunter', 'leader', 'envoy', 'agent'];

  let mainPathName = paths.type;
  let specializationName = paths.sub;

  // Normalize swapped values (e.g., type contains specialization and sub contains main path)
  if (mainPathName && specializationName) {
    const mainIsCore = corePaths.includes(mainPathName.toLowerCase());
    const subIsCore = corePaths.includes(specializationName.toLowerCase());
    if (!mainIsCore && subIsCore) {
      console.warn('[TalentsService] Swapping path fields (type/sub appear reversed):', {
        type: mainPathName,
        sub: specializationName
      });
      const temp = mainPathName;
      mainPathName = specializationName;
      specializationName = temp;
    }
  }

  return { mainPathName, specializationName };
}

/**
 * Get all tier 0 talent IDs that should be FREE (not cost points).
 * This includes:
 * - Main path tier 0 talent (always free)
 * - Singer ancestry talents (singer_ancestry, singer_change_form)
 * - Radiant tier 0 talent (if bonded)
 * NOTE: Bonus path tier 0 talents cost 1 point - they are NOT free!
 */
function getFreeTier0TalentIds(
  character: any,
  paths: { type: string | null; sub: string | null },
  pendingTrees: string[] = []
): Set<string> {
  const freeTalents = new Set<string>();
  
  // Main path tier 0 (always free)
  const { mainPathName } = normalizePaths(paths);
  if (mainPathName) {
    const mainPath = getTalentPath(mainPathName);
    const tier0Id = mainPath?.talentNodes?.find((n: any) => n.tier === 0)?.id;
    if (tier0Id) freeTalents.add(tier0Id);
  }
  
  // Singer ancestry talents (both are free)
  if (character?.ancestry?.toLowerCase() === 'singer') {
    freeTalents.add('singer_ancestry');
    freeTalents.add('singer_change_form');
  }
  
  // Radiant tier 0 talent (free when bonded)
  const radiantTier0 = character?.radiantTier0TalentId 
    || (character?.radiantPath?.boundOrder 
        ? RADIANT_TIER0_TALENTS[character.radiantPath.boundOrder.toLowerCase()] 
        : null);
  if (radiantTier0) freeTalents.add(radiantTier0);
  
  // NOTE: Bonus path tier 0 talents are NOT free - they cost 1 point
  // So we don't add them to the free set
  
  return freeTalents;
}

export async function getTalentsByCharacterId(characterId: string): Promise<TalentsStateDTO> {
  const state = await getTalentsStateRecord(characterId);
  if (!state) {
    return createEmptyTalentsDTO(characterId);
  }

  // Get character to determine available trees
  const character = await loadCharacter(characterId);
  if (!character) {
    return createEmptyTalentsDTO(characterId);
  }

  // Load paths from paths table
  const paths = await getPathsByCharacterId(characterId);
  console.log('[TalentsService] Loaded paths for character:', characterId, paths);

  const { mainPathName } = normalizePaths(paths);
  const mainPath = mainPathName ? getTalentPath(mainPathName) : null;
  const tier0TalentId = mainPath?.talentNodes?.find(node => node.tier === 0)?.id ?? null;

  let totalTalents = state.totalTalents ?? [];
  const pendingTalents = state.pendingTalents ?? [];
  
  // Include main path tier 0 talent in totalTalents if it's set and not already there
  if (tier0TalentId && !totalTalents.includes(tier0TalentId)) {
    totalTalents = [...totalTalents, tier0TalentId];
  }
  
  // Include radiant tier 0 talent in totalTalents if bonded and not already there
  // Use the stored ID if available, otherwise derive from boundOrder
  let radiantTier0TalentId: string | null = character.radiantTier0TalentId || null;
  if (!radiantTier0TalentId && character.radiantPath?.boundOrder) {
    radiantTier0TalentId = RADIANT_TIER0_TALENTS[character.radiantPath.boundOrder.toLowerCase()] || null;
  }
  if (radiantTier0TalentId && !totalTalents.includes(radiantTier0TalentId)) {
    totalTalents = [...totalTalents, radiantTier0TalentId];
    console.log('[TalentsService] Added radiant tier 0 talent to totalTalents:', radiantTier0TalentId);
  }
  
  // Include singer tier 0 talents in totalTalents if character is a singer and not already there
  // Singers have two tier 0 talents: singer_ancestry and singer_change_form
  if (character.ancestry?.toLowerCase() === 'singer') {
    if (!totalTalents.includes('singer_ancestry')) {
      totalTalents = [...totalTalents, 'singer_ancestry'];
    }
    if (!totalTalents.includes('singer_change_form')) {
      totalTalents = [...totalTalents, 'singer_change_form'];
    }
  }
  
  const unlockedTalents = new Set([...totalTalents, ...pendingTalents]);
  const pendingTreesArray = state.pendingTrees ?? [];

  const { availableTrees, selectedTreeId, requiresSingerSelection } = 
    determineAvailableTrees(character, paths, unlockedTalents, pendingTreesArray, new Set(pendingTalents));
  
  console.log('[TalentsService] Determined trees:', { availableTrees, selectedTreeId, requiresSingerSelection });

  // Build radiant path data for response
  let radiantPathData: RadiantPathData | undefined;
  if (character.radiantPath) {
    radiantPathData = {
      boundOrder: character.radiantPath.boundOrder || null,
      currentIdeal: character.radiantPath.currentIdeal || 1,
      idealSpoken: character.radiantPath.idealSpoken || false,
      surgePair: character.radiantPath.surgePair || null,
      sprenType: character.radiantPath.sprenType || null
    };
  }

  return {
    characterId,
    totalPoints: state.totalPoints,
    pointsSpent: state.pointsSpent,
    pointsRemaining: state.pointsRemaining,
    finalized: state.finalized,
    totalTalents,
    pendingTalents,
    pendingTrees: state.pendingTrees ?? [],
    availableTrees,
    selectedTreeId,
    requiresSingerSelection,
    ancestry: character.ancestry || null,
    level: character.level || 1,
    radiantPath: radiantPathData
  };
}

export async function setTalentsByCharacterId(
  characterId: string,
  talents: Partial<TalentsStateDTO>
): Promise<TalentsStateDTO> {
  const existing = await getTalentsStateRecord(characterId);

  let totalTalents = Array.isArray(talents.totalTalents)
    ? talents.totalTalents
    : existing?.totalTalents ?? [];
  let pendingTalents = Array.isArray(talents.pendingTalents)
    ? talents.pendingTalents
    : existing?.pendingTalents ?? [];
  let pendingTrees = Array.isArray(talents.pendingTrees)
    ? talents.pendingTrees
    : existing?.pendingTrees ?? [];
  const finalized = typeof talents.finalized === 'boolean'
    ? talents.finalized
    : existing?.finalized ?? false;

  if (finalized) {
    const merged = new Set<string>([...totalTalents, ...pendingTalents]);
    totalTalents = Array.from(merged);
    pendingTalents = [];
    // Note: pendingTrees are kept as-is; finalization doesn't merge them into another structure
    // They represent selected bonus paths that remain available to the character
  }

  const totalPoints = typeof talents.totalPoints === 'number'
    ? talents.totalPoints
    : existing?.totalPoints ?? 0;

  // FIRST: Sync pendingTalents with pendingTrees selections BEFORE calculating points.
  // This ensures tier 0 talents are properly added/removed before we count spent points.
  try {
    const existingPendingTrees = existing?.pendingTrees ?? [];
    const removedTrees = existingPendingTrees.filter(t => !pendingTrees.includes(t));
    const addedTrees = pendingTrees.filter(t => !existingPendingTrees.includes(t));

    if (removedTrees.length || addedTrees.length) {
      console.log('[TalentsService] pendingTrees changed - added:', addedTrees, 'removed:', removedTrees);
    }

    // Handle additions: add tier-0 talent for newly added bonus paths
    addedTrees.forEach(treeIdRaw => {
      const treeId = (treeIdRaw || '').toLowerCase();
      const talentPath = getTalentPath(treeId);
      const tier0Id = talentPath?.talentNodes?.find((n: any) => n.tier === 0)?.id;
      if (tier0Id) {
        if (!pendingTalents.includes(tier0Id) && !totalTalents.includes(tier0Id)) {
          pendingTalents = [...pendingTalents, tier0Id];
          console.log('[TalentsService] Added tier0 pending talent for tree', treeId, ':', tier0Id);
        }
      }
    });

    // Handle removals: remove tier-0 talent AND all specialization talents for removed bonus paths
    removedTrees.forEach(treeIdRaw => {
      const treeId = (treeIdRaw || '').toLowerCase();
      const talentPath = getTalentPath(treeId);
      
      // Remove tier-0 talent
      const tier0Id = talentPath?.talentNodes?.find((n: any) => n.tier === 0)?.id;
      if (tier0Id && pendingTalents.includes(tier0Id)) {
        pendingTalents = pendingTalents.filter(id => id !== tier0Id);
        console.log('[TalentsService] Removed tier0 pending talent for tree', treeId, ':', tier0Id);
      }
      
      // Also remove any talents from this path's specialization trees
      if (talentPath?.paths) {
        talentPath.paths.forEach((specTree: any) => {
          const specTalentIds = (specTree.nodes || []).map((n: any) => n.id);
          const removedFromSpec = pendingTalents.filter(id => specTalentIds.includes(id));
          if (removedFromSpec.length > 0) {
            console.log('[TalentsService] Removing specialization talents for', treeId, ':', removedFromSpec);
            pendingTalents = pendingTalents.filter(id => !specTalentIds.includes(id));
          }
        });
      }
    });
  } catch (err) {
    console.warn('[TalentsService] Error syncing pendingTalents with pendingTrees', err);
  }

  // NOW calculate points spent, EXCLUDING free tier 0 talents
  // Load character to determine which talents are free
  const character = await loadCharacter(characterId);
  const paths = await getPathsByCharacterId(characterId);
  const freeTier0Ids = getFreeTier0TalentIds(character, paths, pendingTrees);
  
  // Count only talents that aren't free tier 0 talents
  const allTalentIds = [...totalTalents, ...pendingTalents];
  const pointsSpent = allTalentIds.filter(id => !freeTier0Ids.has(id)).length;
  const pointsRemaining = Math.max(0, totalPoints - pointsSpent);
  
  console.log('[TalentsService] Point calculation:', {
    totalPoints,
    allTalentsCount: allTalentIds.length,
    freeTier0Count: freeTier0Ids.size,
    freeTier0Ids: Array.from(freeTier0Ids),
    pointsSpent,
    pointsRemaining
  });

  // Rebuild record after syncing pendingTalents/pendingTrees so DB write is accurate
  const record = {
    characterId,
    totalPoints,
    pointsSpent,
    pointsRemaining,
    finalized,
    totalTalents,
    pendingTalents,
    pendingTrees
  };

  // Server-side validation: ensure pending talents are actually unlockable
  // Note: character and paths already loaded above for tier 0 calculation
  try {
    if (!character) {
      throw new Error('validation:character_not_found');
    }

    if (pointsRemaining < 0) {
      throw new Error('validation:insufficient_points');
    }

    const pendingSet = new Set(pendingTalents);
    const unlockedSet = new Set(totalTalents);

    // Allow pending tier-1 talents even if prereqs are not yet satisfied so the
    // user can pre-select them while reallocating other resources. For tiers >1
    // require that prereqs are satisfied.
    //
    // Build the character's actual available tree list so we resolve duplicate
    // talent IDs (e.g. "baleful") to the correct specialization tree.
    const characterTreeIds: string[] = [];
    const { mainPathName: valMainPath } = normalizePaths(paths);
    if (valMainPath) {
      const mp = getTalentPath(valMainPath);
      mp?.paths?.forEach(t => characterTreeIds.push(t.pathName?.toLowerCase()));
    }
    pendingTrees.forEach(bonusId => {
      const bp = getTalentPath(bonusId.toLowerCase());
      bp?.paths?.forEach(t => {
        const tid = t.pathName?.toLowerCase();
        if (tid && !characterTreeIds.includes(tid)) characterTreeIds.push(tid);
      });
    });
    if (character?.ancestry === 'singer') characterTreeIds.push('singer');
    if (character?.radiantPath?.boundOrder) {
      const rp = getTalentPath(character.radiantPath.boundOrder);
      if (rp?.paths?.[0]) characterTreeIds.push(rp.paths[0].pathName.toLowerCase());
    }

    const findNodeInfo = (talentId: string): { tier: number | null; treeId: string | undefined } => {
      // Search character's actual trees first (avoids wrong duplicate resolution)
      for (const tid of characterTreeIds) {
        const tree = getTalentTree(tid);
        if (!tree?.nodes) continue;
        const n = tree.nodes.find((x: any) => x.id === talentId);
        if (n) return { tier: n.tier ?? null, treeId: tid };
      }
      // Also check path-level talentNodes (tier 0 key talents)
      if (valMainPath) {
        const mp = getTalentPath(valMainPath);
        const n = mp?.talentNodes?.find((x: any) => x.id === talentId);
        if (n) return { tier: n.tier ?? null, treeId: undefined };
      }
      return { tier: null, treeId: undefined };
    };

    for (const tid of pendingSet) {
      const { tier, treeId: resolvedTreeId } = findNodeInfo(tid);
      const result = canUnlockTalentForCharacter(character, tid, unlockedSet, pendingSet, { level: character.level || 1, ancestry: character.ancestry, paths, radiant: character.radiantPath }, resolvedTreeId);
      if (result && result.canUnlock) continue;
      // allow tier 1 even if prereqs missing
      if (tier === 1) continue;
      throw new Error(`validation:invalid_pending_talent:${tid}`);
    }
  } catch (err) {
    console.warn('[TalentsService] Validation failed for pendingTalents:', err);
    throw err;
  }

  const updated = existing
    ? await updateTalentsStateRecord(characterId, record)
    : await createTalentsStateRecord(record);

  return getTalentsByCharacterId(characterId);
}

function determineAvailableTrees(
  character: any,
  paths: { type: string | null; sub: string | null },
  unlockedTalents: Set<string>,
  pendingTrees: string[] = [],
  pendingTalentIds: Set<string> = new Set()
): { availableTrees: AvailableTreeDTO[]; selectedTreeId: string | null; requiresSingerSelection: boolean } {
  const treeIds: string[] = [];
  const addedTreeNames = new Set<string>();

  const { mainPathName, specializationName } = normalizePaths(paths);
  const ancestry = character.ancestry;
  const level = character.level || 1;
  
  console.log('[TalentsService] determineAvailableTrees START -', { mainPathName, specializationName, ancestry, level });
  console.log('[TalentsService] unlockedTalents:', Array.from(unlockedTalents));

  // At ancestry talent milestone levels (1, 6, 11, 16), singers must spend at
  // least one pending talent on the singer tree before they can finalize.
  const isAncestryTalentLevel = ANCESTRY_TALENT_LEVELS.includes(level);
  const pendingHasSingerTalent = Array.from(pendingTalentIds).some(id => isSingerTalent(id));
  const requiresSingerSelection = ancestry === 'singer' && isAncestryTalentLevel && !pendingHasSingerTalent;

  // Helper to check if a path's tier-0 talent is unlocked
  const hasPathKeyTalent = (pathId: string): boolean => {
    const talentPath = getTalentPath(pathId);
    if (!talentPath?.talentNodes) {
      console.log('[TalentsService] hasPathKeyTalent - no talent nodes for path:', pathId);
      return false;
    }
    return talentPath.talentNodes.some(node => 
      node.tier === 0 && unlockedTalents.has(node.id)
    );
  };

  // For humans and singers at level 1 or during level-up
  if (['human', 'singer'].includes(ancestry) && level === 1) {
    console.log('[TalentsService] Processing level 1 character');
    
    // Add main path specialization trees
    if (mainPathName) {
      console.log('[TalentsService] Getting main path:', mainPathName);
      const talentPath = getTalentPath(mainPathName);
      console.log('[TalentsService] talentPath for', mainPathName, ':', talentPath ? 'FOUND' : 'NOT FOUND');
      if (talentPath?.paths) {
        console.log('[TalentsService] Found specialization trees:', talentPath.paths.map(p => p.pathName));
        talentPath.paths.forEach(specTree => {
          const treeId = specTree.pathName.toLowerCase();
          if (!addedTreeNames.has(treeId)) {
            console.log('[TalentsService] Adding tree:', treeId);
            treeIds.push(treeId);
            addedTreeNames.add(treeId);
          }
        });
      } else {
        console.log('[TalentsService] No specialization trees found for:', mainPathName);
      }
    } else {
      console.log('[TalentsService] No mainPathName provided');
    }

    // Check all paths for unlocked key talents and add their specialties
    const allPaths = ['warrior', 'scholar', 'hunter', 'leader', 'envoy', 'agent'];
    console.log('[TalentsService] Checking all paths for unlocked key talents');
    allPaths.forEach(pathId => {
      if (hasPathKeyTalent(pathId)) {
        console.log('[TalentsService] Path has key talent:', pathId);
        const talentPath = getTalentPath(pathId);
        if (talentPath?.paths) {
          talentPath.paths.forEach(specTree => {
            const treeId = specTree.pathName.toLowerCase();
            if (!addedTreeNames.has(treeId)) {
              console.log('[TalentsService] Adding unlocked path tree:', treeId);
              treeIds.push(treeId);
              addedTreeNames.add(treeId);
            }
          });
        }
      }
    });

    // Bonus tree processing moved outside level check - applies to ALL characters
  } else {
    console.log('[TalentsService] Processing non-level-1 or non-human/singer character');
    // For other ancestries or higher levels, still add all specializations from the main path
    if (mainPathName) {
      console.log('[TalentsService] Getting main path:', mainPathName);
      const talentPath = getTalentPath(mainPathName);
      console.log('[TalentsService] talentPath for', mainPathName, ':', talentPath ? 'FOUND' : 'NOT FOUND');
      if (talentPath?.paths) {
        console.log('[TalentsService] Found specialization trees:', talentPath.paths.map(p => p.pathName));
        talentPath.paths.forEach(specTree => {
          const treeId = specTree.pathName.toLowerCase();
          if (!addedTreeNames.has(treeId)) {
            console.log('[TalentsService] Adding tree:', treeId);
            treeIds.push(treeId);
            addedTreeNames.add(treeId);
          }
        });
      } else {
        console.log('[TalentsService] No specialization trees found for:', mainPathName);
      }
    } else {
      console.log('[TalentsService] No mainPathName provided');
    }
  }

  // Add specializations for bonus paths selected (pendingTrees) - applies to ALL characters
  console.log('[TalentsService] Processing bonus paths from pendingTrees:', pendingTrees);
  pendingTrees.forEach(bonusPathId => {
    const normalizedPathId = bonusPathId.toLowerCase();
    // Skip if it's the main path
    if (normalizedPathId === mainPathName?.toLowerCase()) {
      return;
    }
    const talentPath = getTalentPath(normalizedPathId);
    if (talentPath?.paths) {
      console.log('[TalentsService] Adding bonus path specializations:', normalizedPathId);
      talentPath.paths.forEach(specTree => {
        const treeId = specTree.pathName.toLowerCase();
        if (!addedTreeNames.has(treeId)) {
          treeIds.push(treeId);
          addedTreeNames.add(treeId);
        }
      });
    }
  });


  // Add ancestry-specific trees
  if (ancestry === 'singer') {
    console.log('[TalentsService] Character is singer, adding singer tree');
    if (!addedTreeNames.has('singer')) {
      treeIds.push('singer');
      addedTreeNames.add('singer');
    }
  }

  // Add Radiant Order tree if spren is bound
  if (character.radiantPath?.boundOrder) {
    console.log('[TalentsService] Character has radiant order:', character.radiantPath.boundOrder);
    const orderTree = getTalentPath(character.radiantPath.boundOrder);
    if (orderTree?.paths && orderTree.paths.length > 0) {
      const radiantOrderTree = orderTree.paths[0];
      const treeId = radiantOrderTree.pathName.toLowerCase();
      if (!addedTreeNames.has(treeId)) {
        console.log('[TalentsService] Adding radiant order tree:', treeId);
        treeIds.push(treeId);
        addedTreeNames.add(treeId);
      }
    }
  }

  // Build detailed tree objects with node state
  const bonusSet = new Set(pendingTrees.map(p => p.toLowerCase()));
  const availableTrees: AvailableTreeDTO[] = [];

  treeIds.forEach(treeId => {
    const tree = getTalentTree(treeId);
    if (!tree) return;
    const isBonus = bonusSet.has(treeId);
    const lookupPathId = isBonus ? treeId : (mainPathName || treeId);

    const nodes: AvailableNodeDTO[] = (tree.nodes || []).map((node: any) => {
      const isUnlocked = unlockedTalents.has(node.id);
      const isPending = pendingTalentIds.has(node.id);
      const prereqResult = canUnlockTalentForCharacter(character, node.id, unlockedTalents, pendingTalentIds, { level, ancestry, paths, radiant: character.radiantPath }, treeId);

      const availableNode: AvailableNodeDTO = {
        id: node.id,
        name: node.name,
        description: node.description,
        tier: node.tier,
        pathId: tree.pathName?.toLowerCase() || treeId,
        mainPathId: lookupPathId,
        isUnlocked,
        isPending,
        isAvailable: prereqResult.canUnlock,
        prerequisites: node.prerequisites || []
      };

      return availableNode;
    });

    availableTrees.push({
      id: treeId,
      pathName: tree.pathName || treeId,
      mainPathId: lookupPathId,
      isBonus,
      nodes
    });
  });

  // Determine selected tree (singer tree for singers, otherwise first available)
  let selectedTreeId: string | null = null;
  if (availableTrees.length > 0) {
    if (ancestry === 'singer' && availableTrees.some(t => t.id === 'singer')) {
      selectedTreeId = 'singer';
    } else {
      selectedTreeId = availableTrees[0].id;
    }
  }

  console.log('[TalentsService] determineAvailableTrees END -', { availableTrees: availableTrees.map(t=>t.id), selectedTreeId, requiresSingerSelection });

  return { availableTrees, selectedTreeId, requiresSingerSelection };
}
/**
 * Find the parent core path for a specialization tree ID.
 * e.g., findParentPath('duelist') => 'warrior'
 * e.g., findParentPath('diplomat') => 'envoy'
 */
export function findParentPath(treeId: string): string | null {
  const allPaths = ['warrior', 'scholar', 'hunter', 'leader', 'envoy', 'agent'];
  const normalizedTreeId = treeId.toLowerCase();
  
  for (const pathId of allPaths) {
    const talentPath = getTalentPath(pathId);
    if (talentPath?.paths?.some(tree => tree.pathName.toLowerCase() === normalizedTreeId)) {
      return pathId;
    }
  }
  
  return null;
}

/**
 * Get specializations (sub-trees) for a given core path.
 * e.g., getSpecializationsForPath('warrior') => ['duelist', 'shardbearer', 'soldier']
 */
export function getSpecializationsForPath(pathId: string): string[] {
  const talentPath = getTalentPath(pathId);
  if (!talentPath?.paths) return [];
  return talentPath.paths.map(tree => tree.pathName.toLowerCase());
}

/**
 * Get available bonus class core paths.
 * Returns all 6 core paths except the main path and specialty.
 * e.g., getAvailableBonusClasses('warrior', 'scholar') => ['hunter', 'leader', 'envoy', 'agent']
 */
export function getAvailableBonusClasses(mainPath: string | null, specialty: string | null): string[] {
  const allCorePaths = ['warrior', 'scholar', 'hunter', 'leader', 'envoy', 'agent'];
  const normalizedMain = mainPath?.toLowerCase() || null;
  const normalizedSpecialty = specialty?.toLowerCase() || null;
  
  return allCorePaths.filter(path => 
    path !== normalizedMain && path !== normalizedSpecialty
  );
}

/**
 * Extract expertise keywords from a TalentNode
 * Returns simple list of expertise names (no structure)
 */
function extractExpertiseKeywords(talentNode: any): string[] {
  const keywords: string[] = [];
  
  if (talentNode.expertiseGrants && Array.isArray(talentNode.expertiseGrants)) {
    talentNode.expertiseGrants.forEach((grant: any) => {
      if (grant.type === 'fixed' && grant.expertises) {
        keywords.push(...grant.expertises);
      } else if (grant.type === 'choice' && grant.options) {
        keywords.push(...grant.options);
      } else if (grant.type === 'category' && grant.category) {
        // Just add the category name for UI display
        keywords.push(grant.category);
      }
    });
  }
  
  return keywords;
}

/**
 * Build talent keywords map for all available talents
 * Returns { [talentId]: { name, description, tier, expertiseKeywords, pathId } }
 */
function buildTalentKeywordsMap(availableTreeIds: string[], mainPathName?: string, bonusTreeIds?: string[]): { [talentId: string]: any } {
  const keywords: { [talentId: string]: any } = {};
  const bonusSet = new Set(bonusTreeIds || []);
  
  // Add talents from each available tree
  availableTreeIds.forEach(treeId => {
    const tree = getTalentTree(treeId);
    if (tree && tree.nodes) {
      // Determine the main path for this tree:
      // - If it's a bonus tree, use the treeId itself
      // - Otherwise it's a specialization, use mainPathName
      const isBonus = bonusSet.has(treeId);
      const lookupPathId = isBonus ? treeId : (mainPathName || treeId);
      
      tree.nodes.forEach((node: any) => {
        keywords[node.id] = {
          name: node.name,
          description: node.description,
          tier: node.tier,
          expertiseKeywords: extractExpertiseKeywords(node),
          pathId: tree.pathName?.toLowerCase() || treeId,  // Specialization name for display
          mainPathId: lookupPathId    // The actual path ID to use with getTalentPath()
        };
      });
    }
  });
  
  return keywords;
}

/**
 * Get available talent IDs that character can select
 * Based on unlocked talents and tree availability
 */
function getAvailableTalentIds(
  availableTreeIds: string[],
  unlockedTalents: Set<string>,
  pendingTalentIds: Set<string>,
  character: any,
  context?: { level?: number; ancestry?: string; paths?: { type?: string | null; sub?: string | null }; radiant?: any }
): string[] {
  const talentIds = new Set<string>();

  availableTreeIds.forEach(treeId => {
    const tree = getTalentTree(treeId);
    if (tree && tree.nodes) {
      tree.nodes.forEach((node: any) => {
        // Allow all tier-1 talents to appear in the available list so users
        // can pre-select them while adjusting other resources (skill points)
        // later. For higher tiers, require prereq checks.
        try {
          if (node.tier === 1) {
            talentIds.add(node.id);
            return;
          }

          const result = canUnlockTalentForCharacter(character, node.id, unlockedTalents, pendingTalentIds, context, treeId);
          if (result && result.canUnlock) {
            talentIds.add(node.id);
          }
        } catch (err) {
          // In case of unexpected errors, skip the node and continue
          console.warn('[TalentsService] Error checking prereqs for', node.id, err);
        }
      });
    }
  });

  return Array.from(talentIds);
}

/**
 * Get minimal UI response for talent view
 * Returns only data needed for UI: points, unlocked talents, available talents, keywords
 */
export async function getTalentUIResponseForCharacterId(characterId: string) {
  const state = await getTalentsStateRecord(characterId);
  const character = await loadCharacter(characterId);
  const paths = await getPathsByCharacterId(characterId);

  if (!state || !character) {
    return {
      characterId,
      pointsAvailable: 0,
      pointsOverBudget: 0,
      unlockedTalentIds: [],
      availableTalentIds: [],
      selectedTreeId: null,
      requiresSingerSelection: false,
      ancestry: null,
      bonusPathIds: [],
      selectedBonusPathIds: [],
      talentKeywords: {}
    };
  }

  const { mainPathName } = normalizePaths(paths);
  const mainPath = mainPathName ? getTalentPath(mainPathName) : null;
  const tier0TalentId = mainPath?.talentNodes?.find(node => node.tier === 0)?.id ?? null;

  let totalTalents = state.totalTalents ?? [];
  const pendingTalents = state.pendingTalents ?? [];
  
  // Include tier 0 talents
  if (tier0TalentId && !totalTalents.includes(tier0TalentId)) {
    totalTalents = [...totalTalents, tier0TalentId];
  }
  
  let radiantTier0TalentId: string | null = character.radiantTier0TalentId || null;
  if (!radiantTier0TalentId && character.radiantPath?.boundOrder) {
    radiantTier0TalentId = RADIANT_TIER0_TALENTS[character.radiantPath.boundOrder.toLowerCase()] || null;
  }
  if (radiantTier0TalentId && !totalTalents.includes(radiantTier0TalentId)) {
    totalTalents = [...totalTalents, radiantTier0TalentId];
  }
  
  if (character.ancestry?.toLowerCase() === 'singer') {
    if (!totalTalents.includes('singer_ancestry')) {
      totalTalents = [...totalTalents, 'singer_ancestry'];
    }
    if (!totalTalents.includes('singer_change_form')) {
      totalTalents = [...totalTalents, 'singer_change_form'];
    }
  }
  
  const unlockedTalents = new Set([...totalTalents, ...pendingTalents]);
  const pendingTreesArray = state.pendingTrees ?? [];
  
  console.log('[TalentsService] Building response for getTalentUI:', {
    characterId,
    totalTalents,
    pendingTalents,
    unlockedTalentsSet: Array.from(unlockedTalents),
    pendingTreesArray
  });
  
  const { availableTrees, selectedTreeId, requiresSingerSelection } = 
    determineAvailableTrees(character, paths, unlockedTalents, pendingTreesArray, new Set(pendingTalents));
  
  // Get bonus path options
  const availableBonusClasses = getAvailableBonusClasses(mainPathName, null);
  const selectedBonusPathIds = pendingTreesArray;

  // Build talent keywords map (pass tree ids)
  const talentKeywords = buildTalentKeywordsMap(availableTrees.map(t => t.id), mainPathName, pendingTreesArray);
  
  // Get available talent IDs (from tree ids) using authoritative prereq checks
  const pendingSet = new Set(pendingTalents);
  const availableTalentIds = getAvailableTalentIds(
    availableTrees.map(t => t.id),
    unlockedTalents,
    pendingSet,
    character,
    { level: character.level || 1, ancestry: character.ancestry, paths, radiant: character.radiantPath }
  );

  // Calculate over-budget amount so frontend can warn the user to remove talents
  const freeTier0Ids = getFreeTier0TalentIds(character, paths, pendingTreesArray);
  const allTalentIds = [...totalTalents, ...pendingTalents];
  const actualPointsSpent = allTalentIds.filter(id => !freeTier0Ids.has(id)).length;
  const totalPointsBudget = state.totalPoints || 0;
  const pointsOverBudget = Math.max(0, actualPointsSpent - totalPointsBudget);
  
  return {
    characterId,
    pointsAvailable: state.pointsRemaining || 0,
    pointsOverBudget,
    unlockedTalentIds: Array.from(unlockedTalents),
    pendingTalentIds: pendingTalents,
    availableTalentIds,
    availableTrees,
    selectedTreeId,
    requiresSingerSelection,
    ancestry: character.ancestry || null,
    bonusPathIds: availableBonusClasses,
    selectedBonusPathIds,
    talentKeywords
  };
}

/**
 * Finalize talents for a character (called by finalization step).
 * Validates all points are spent, merges pendingTalents into totalTalents,
 * clears pending state, and syncs to the UnlockedTalent table.
 * pendingTrees are preserved as they represent permanent bonus class selections.
 */
export async function finalizeTalentsByCharacterId(characterId: string): Promise<TalentsStateDTO> {
  const state = await getTalentsStateRecord(characterId);
  if (!state) {
    throw new Error(`Talents state record not found for character ${characterId}`);
  }

  // Validate all points are spent
  if (state.pointsRemaining > 0) {
    throw new Error(
      `Cannot finalize talents: ${state.pointsRemaining} points remaining. All points must be spent.`
    );
  }

  // Singers must have at least one pending singer talent at ancestry milestone levels
  const character = await loadCharacter(characterId);
  if (character?.ancestry === 'singer') {
    const level = character.level || 1;
    if (ANCESTRY_TALENT_LEVELS.includes(level)) {
      const hasPendingSingerTalent = state.pendingTalents.some(id => isSingerTalent(id));
      if (!hasPendingSingerTalent) {
        throw new Error(
          'Cannot finalize talents: Singers must select at least one Singer talent at ancestry milestone levels.'
        );
      }
    }
  }

  // Merge pending into total and finalize
  const result = await setTalentsByCharacterId(characterId, {
    totalTalents: Array.from(new Set([...state.totalTalents, ...state.pendingTalents])),
    pendingTalents: [],
    finalized: true
  });

  return result;
}

// ============================================================================
// TALENT POINTS & TIER 0 — Migrated from legacy talent-service.js / talent-service.ts
// ============================================================================

const TALENT_POINTS_PER_LEVEL = [
  2, // Level 1 (tier 0 + 1 tier 1)
  1, 1, 1, 1, // Levels 2-5
  2, // Level 6 (bonus)
  1, 1, 1, 1, // Levels 7-10
  2, // Level 11 (bonus)
  1, 1, 1, 1, // Levels 12-15
  2, // Level 16 (bonus)
  1, 1, 1, 1, 1 // Levels 17-21
];

/** Levels where 2 talent points are awarded — the extra point is an ancestry talent.
 *  Singers MUST spend at least one of their pending talents on the singer tree at these levels. */
export const ANCESTRY_TALENT_LEVELS = [1, 6, 11, 16];

/** Check whether a talent ID belongs to the Singer Forms talent tree (any tier). */
export function isSingerTalent(talentId: string): boolean {
  const singerTree = getTalentTree('singer');
  if (!singerTree) return false;
  return (singerTree.nodes || []).some((n: any) => n.id === talentId);
}

const PATH_TIER0_TALENTS: Record<string, string> = {
  'warrior': 'vigilant_stance',
  'scholar': 'education',
  'hunter': 'seek_quarry',
  'leader': 'decisive_command',
  'envoy': 'rousing_presence',
  'agent': 'opportunist'
};

/** Get the tier 0 (free) talent for a given path */
export function getTier0TalentForPath(pathId: string | null): string | null {
  if (!pathId) return null;
  return PATH_TIER0_TALENTS[pathId] || null;
}

/** Calculate total talent points available from level 1 to a given level */
export function calculateTotalTalentPoints(level: number): number {
  if (level < 1 || level > 21) return 0;
  let total = 0;
  for (let i = 0; i < level; i++) {
    total += TALENT_POINTS_PER_LEVEL[i];
  }
  return total;
}

/** Get talent points available at a specific level */
export function getTalentPointsForLevel(level: number): number {
  if (level < 1 || level > 21) return 0;
  return TALENT_POINTS_PER_LEVEL[level - 1];
}

/**
 * Ensure tier 0 talent is included in the CharacterTalents totalTalents.
 * Called when a path is selected so the free talent appears immediately.
 */
export async function ensureTier0Unlocked(
  characterId: string,
  mainPath: string | null
): Promise<string | null> {
  const tier0TalentId = getTier0TalentForPath(mainPath);
  if (!tier0TalentId) return null;

  const state = await getTalentsStateRecord(characterId);
  if (!state) return tier0TalentId; // Record doesn't exist yet; tier 0 will be enriched on read

  const totalTalents = state.totalTalents ?? [];
  if (!totalTalents.includes(tier0TalentId)) {
    await updateTalentsStateRecord(characterId, {
      totalTalents: [...totalTalents, tier0TalentId]
    });
    console.log(`[TalentsService] Tier 0 talent ensured for ${characterId}: ${tier0TalentId}`);
  }

  return tier0TalentId;
}

/**
 * Get talent selection state for legacy level-up endpoints.
 * Wraps the new CharacterTalents-based system to provide the same shape
 * expected by the server.ts level-up handlers.
 */
export async function getTalentSelectionState(
  characterId: string,
  level: number,
  isCreationMode: boolean
) {
  const character = await loadCharacter(characterId);
  if (!character) throw new Error(`Character not found: ${characterId}`);

  const mainPath = character.paths?.[0] || null;
  const state = await getTalentsStateRecord(characterId);
  const totalTalents = state?.totalTalents ?? [];
  const pendingTalents = state?.pendingTalents ?? [];

  // Merge for display
  const unlockedTalents = [...new Set([...totalTalents, ...pendingTalents])];

  // Enrich with free tier 0
  const tier0 = getTier0TalentForPath(mainPath);
  if (tier0 && !unlockedTalents.includes(tier0)) {
    unlockedTalents.push(tier0);
  }

  const previouslySelected = unlockedTalents.filter(id => id !== tier0);
  const totalPoints = isCreationMode
    ? calculateTotalTalentPoints(level)
    : getTalentPointsForLevel(level);
  const spentCount = previouslySelected.length;
  const availablePoints = totalPoints - spentCount;

  return {
    talentPoints: availablePoints,
    previouslySelectedTalents: isCreationMode ? [] : previouslySelected,
    unlockedTalents,
    spentPoints: { talents: {} },
    lockedTalents: isCreationMode ? [] : previouslySelected,
    requiresSingerSelection: character.ancestry === 'singer' && ANCESTRY_TALENT_LEVELS.includes(level),
    tier0TalentId: tier0
  };
}

/**
 * Validate talent selection for level-up endpoint
 */
export function validateTalentSelection(
  character: any,
  talentIds: string[],
  level: number,
  mainPath: string | null
): { isValid: boolean; error?: string } {
  const tier0 = getTier0TalentForPath(mainPath);
  const nonTier0 = talentIds.filter(id => id !== tier0);
  const totalPoints = calculateTotalTalentPoints(level);

  if (nonTier0.length > totalPoints) {
    return { isValid: false, error: `Talent point limit exceeded by ${nonTier0.length - totalPoints} point(s)` };
  }

  return { isValid: true };
}

/**
 * Validate and prepare talent selections for saving (level-up flow)
 */
export function saveTalentSelections(
  character: any,
  talentIds: string[],
  level: number,
  mainPath: string | null
): { success: boolean; error?: string } {
  const validation = validateTalentSelection(character, talentIds, level, mainPath);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }
  return { success: true };
}