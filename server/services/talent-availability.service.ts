import { getTalentTree } from '../../shared/data/talents/talentTrees';

/**
 * Evaluate whether a single talent node's prerequisites are satisfied
 * by the provided character snapshot and unlocked talents set.
 */
export function meetsPrereqs(node: any, unlockedTalents: Set<string>, character: any): boolean {
  const prereqs = node.prerequisites || [];
  if (!prereqs || prereqs.length === 0) return true;

  // Currently treat prereqs as AND across entries. This function is
  // the canonical place to extend support for OR groups and complex logic.
  for (const p of prereqs) {
    if (!p) continue;
    const type = p.type;
    const target = p.target;
    const value = p.value ?? 0;

    if (type === 'talent') {
      if (!unlockedTalents.has(String(target))) return false;
    } else if (type === 'level') {
      const charLevel = Number(character?.level || 0);
      if (charLevel < Number(value)) return false;
    } else if (type === 'skill') {
      const skillVal = Number(character?.skills?.[String(target)] ?? 0);
      if (skillVal < Number(value)) return false;
    } else if (type === 'attribute') {
      const attrVal = Number(character?.attributes?.[String(target)] ?? 0);
      if (attrVal < Number(value)) return false;
    } else {
      // Unknown prerequisite types are treated permissively for now
      continue;
    }
  }

  return true;
}

/**
 * Compute available talent IDs for a character given available trees and unlocked talents.
 * Delegates prerequisite checks to `meetsPrereqs`.
 */
export function getAvailableTalentIds(
  availableTreeIds: string[],
  unlockedTalents: Set<string>,
  character: any,
  _requiresSingerSelection: boolean
): string[] {
  const talentIds = new Set<string>();

  availableTreeIds.forEach((treeId) => {
    const tree = getTalentTree(treeId);
    if (tree && tree.nodes) {
      tree.nodes.forEach((node: any) => {
        // Tier 0 talents are handled elsewhere; consider tier>=1
        if (node.tier >= 1) {
          // Include unlocked talents always
          if (unlockedTalents.has(node.id)) {
            talentIds.add(node.id);
            return;
          }

          // Only include if prerequisites are met for this character
          if (meetsPrereqs(node, unlockedTalents, character)) {
            talentIds.add(node.id);
          }
        }
      });
    }
  });

  return Array.from(talentIds);
}

export default {
  meetsPrereqs,
  getAvailableTalentIds,
};
