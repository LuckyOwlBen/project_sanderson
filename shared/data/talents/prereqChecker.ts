import { getTalentTree, getTalentPath } from './talentTrees';
import { TalentPrerequisite } from '../../types/talents';

/**
 * Check whether a talent can be unlocked for a character given current unlocked and pending talents.
 * Returns whether it can be unlocked and which prerequisites are missing.
 */
export function canUnlockTalentForCharacter(
  character: any,
  talentId: string,
  unlockedTalentIds: Set<string>,
  pendingTalentIds: Set<string>,
  context?: { level?: number; ancestry?: string; paths?: { type?: string | null; sub?: string | null }; radiant?: any }
): { canUnlock: boolean; missingPrerequisites: TalentPrerequisite[]; reason?: string } {
  const combined = new Set<string>([...Array.from(unlockedTalentIds), ...Array.from(pendingTalentIds)]);

  // Try to locate the talent node in registered trees
  let foundNode: any | null = null;
  // Search all known trees quickly via getTalentTree if caller passed a tree id; otherwise search all paths
  // We'll iterate over core paths
  const corePaths = ['warrior', 'scholar', 'hunter', 'leader', 'envoy', 'agent'];

  // Helper to search a tree for the node
  const searchTreeForId = (treeId: string) => {
    const tree = getTalentTree(treeId);
    if (!tree || !tree.nodes) return null;
    return tree.nodes.find((n: any) => n.id === talentId) || null;
  };

  // Try common lookups: direct tree id equal to talentId prefix? fallback to scanning core paths
  for (const path of corePaths) {
    const talentPath = getTalentPath(path);
    if (!talentPath) continue;
    if (talentPath.paths) {
      for (const t of talentPath.paths) {
        const node = (t.nodes || []).find((n: any) => n.id === talentId);
        if (node) { foundNode = node; break; }
      }
    }
    if (foundNode) break;
    // also check talentPath.talentNodes
    if (talentPath.talentNodes) {
      const node = talentPath.talentNodes.find((n: any) => n.id === talentId);
      if (node) { foundNode = node; break; }
    }
  }

  if (!foundNode) {
    // Try radiant or singer special trees by scanning a small set
    const maybe = ['singer'];
    for (const tId of maybe) {
      const node = searchTreeForId(tId);
      if (node) { foundNode = node; break; }
    }
  }

  if (!foundNode) {
    return { canUnlock: false, missingPrerequisites: [], reason: 'talent-not-found' };
  }

  const missing: TalentPrerequisite[] = [];

  const prereqs: TalentPrerequisite[] = Array.isArray(foundNode.prerequisites) ? foundNode.prerequisites : [];

  prereqs.forEach(pr => {
    switch (pr.type) {
      case 'talent': {
        if (!combined.has(pr.target)) missing.push(pr);
        break;
      }
      case 'level': {
        const required = pr.value || 1;
        const lvl = (context && context.level) || (character && character.level) || 1;
        if (lvl < required) missing.push(pr);
        break;
      }
      case 'ideal': {
        const idealNeeded = pr.target;
        const currentIdeal = context?.radiant?.currentIdeal || character?.radiantPath?.currentIdeal || 1;
        // If value is provided, compare numeric; otherwise just ensure currentIdeal >= 1
        if (typeof pr.value === 'number') {
          if (currentIdeal < pr.value) missing.push(pr);
        } else {
          // Best-effort: if target is a string like 'first' treat as 1
          const map: any = { first: 1, second: 2, third: 3 };
          const needed = map[idealNeeded] || 1;
          if (currentIdeal < needed) missing.push(pr);
        }
        break;
      }
      case 'skill':
      case 'attribute': {
        // Normalize skill/attribute name to uppercase for comparison (DB stores as UPPERCASE)
        const targetNormalized = pr.target?.toUpperCase();
        const val = character?.skills?.[targetNormalized] 
          ?? character?.skills?.[pr.target]  // fallback to original case
          ?? character?.attributes?.[pr.target?.toLowerCase()]
          ?? character?.attributes?.[pr.target];
        if (typeof pr.value === 'number') {
          if (!(typeof val === 'number' && val >= pr.value)) missing.push(pr);
        } else {
          if (val == null) missing.push(pr);
        }
        break;
      }
      default:
        break;
    }
  });

  return { canUnlock: missing.length === 0, missingPrerequisites: missing };
}

export default canUnlockTalentForCharacter;
