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
  context?: { level?: number; ancestry?: string; paths?: { type?: string | null; sub?: string | null }; radiant?: any },
  treeId?: string
): { canUnlock: boolean; missingPrerequisites: TalentPrerequisite[]; reason?: string } {
  const combined = new Set<string>([...Array.from(unlockedTalentIds), ...Array.from(pendingTalentIds)]);

  // Try to locate the talent node in registered trees
  let foundNode: any | null = null;

  // Helper to search a tree for the node
  const searchTreeForId = (id: string) => {
    const tree = getTalentTree(id);
    if (!tree || !tree.nodes) return null;
    return tree.nodes.find((n: any) => n.id === talentId) || null;
  };

  // When a treeId hint is provided, look up the node directly from that tree
  // first. This avoids incorrect resolution when duplicate talent IDs exist
  // across different specialization trees.
  if (treeId) {
    foundNode = searchTreeForId(treeId);
  }

  // Fallback: scan core paths (for callers that don't pass a hint)
  if (!foundNode) {
    const corePaths = ['warrior', 'scholar', 'hunter', 'leader', 'envoy', 'agent'];
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

  // Split into AND (default) and OR groups based on operator field
  const andPrereqs = prereqs.filter(pr => pr.operator !== 'OR');
  const orPrereqs = prereqs.filter(pr => pr.operator === 'OR');

  const isPrereqMet = (pr: TalentPrerequisite): boolean => {
    switch (pr.type) {
      case 'talent':
        return combined.has(pr.target);
      case 'level': {
        const required = pr.value || 1;
        const lvl = (context && context.level) || (character && character.level) || 1;
        return lvl >= required;
      }
      case 'ideal': {
        const idealNeeded = pr.target;
        const currentIdeal = context?.radiant?.currentIdeal || character?.radiantPath?.currentIdeal || 1;
        if (typeof pr.value === 'number') {
          return currentIdeal >= pr.value;
        }
        const map: any = { first: 1, second: 2, third: 3 };
        const needed = map[idealNeeded] || 1;
        return currentIdeal >= needed;
      }
      case 'skill':
      case 'attribute': {
        const targetNormalized = pr.target?.toUpperCase();
        const val = character?.skills?.[targetNormalized]
          ?? character?.skills?.[pr.target]
          ?? character?.attributes?.[pr.target?.toLowerCase()]
          ?? character?.attributes?.[pr.target];
        if (typeof pr.value === 'number') {
          return typeof val === 'number' && val >= pr.value;
        }
        return val != null;
      }
      default:
        return false;
    }
  };

  // All AND prerequisites must be met
  andPrereqs.forEach(pr => {
    if (!isPrereqMet(pr)) missing.push(pr);
  });

  // At least one OR prerequisite must be met (if any exist)
  if (orPrereqs.length > 0) {
    const orMet = orPrereqs.some(pr => isPrereqMet(pr));
    console.log(`[PrereqChecker] OR group for ${talentId}:`, orPrereqs.map(p => p.target), '- met:', orMet);
    if (!orMet) {
      missing.push(...orPrereqs);
    }
  }

  console.log(`[PrereqChecker] ${talentId} - andPrereqs: ${andPrereqs.length}, orPrereqs: ${orPrereqs.length}, missing: ${missing.map(p => p.target)}, canUnlock: ${missing.length === 0}`);

  return { canUnlock: missing.length === 0, missingPrerequisites: missing };
}

export default canUnlockTalentForCharacter;
