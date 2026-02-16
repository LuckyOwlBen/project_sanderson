import { TalentTree, TalentPath, TalentNode, TalentPrerequisite } from '../../types/talents';
import { ALL_TALENT_TREES, ALL_TALENT_PATHS } from './talentTrees';

type NodeEntry = { node: TalentNode; treeKey?: string; pathKey?: string };

export class TalentTreeManager {
    private treeByKey = new Map<string, TalentTree>();
    private pathByKey = new Map<string, TalentPath>();
    private nodeById = new Map<string, NodeEntry>();
    private duplicates = new Map<string, NodeEntry[]>();
    private strict = false;

    constructor(options?: { strictDuplicateIds?: boolean }) {
        this.strict = !!options?.strictDuplicateIds;
        this.buildIndexes();
    }

    private buildIndexes() {
        const addNode = (n: TalentNode, entry: Omit<NodeEntry, 'node'>) => {
            const existing = this.nodeById.get(n.id);
            if (!existing) {
                this.nodeById.set(n.id, { node: n, ...entry });
            } else {
                const list = this.duplicates.get(n.id) || [existing];
                list.push({ node: n, ...entry });
                this.duplicates.set(n.id, list);
                if (this.strict) throw new Error(`Duplicate talent id detected: ${n.id}`);
            }
        };

        // Trees
        Object.entries(ALL_TALENT_TREES).forEach(([key, tree]) => {
            const k = key.toLowerCase();
            this.treeByKey.set(k, tree);
            tree.nodes?.forEach(n => addNode(n, { treeKey: k }));
        });

        // Paths (specializations and path-level nodes)
        Object.entries(ALL_TALENT_PATHS).forEach(([key, path]) => {
            const k = key.toLowerCase();
            this.pathByKey.set(k, path);
            // path-level nodes
            path.talentNodes?.forEach(n => addNode(n, { pathKey: k }));
            // trees under path - try to map each subtree to its registered tree key
            path.paths?.forEach(tree => {
                // Attempt to find a matching key in treeByKey for this subtree
                let treeKey: string | undefined;
                for (const [registeredKey, registeredTree] of this.treeByKey.entries()) {
                    if (registeredTree === tree) {
                        treeKey = registeredKey;
                        break;
                    }
                    // Also match on pathName equality as a fallback
                    if (registeredTree.pathName && tree.pathName && registeredTree.pathName.toLowerCase() === tree.pathName.toLowerCase()) {
                        treeKey = registeredKey;
                        break;
                    }
                }
                if (!treeKey) treeKey = tree.pathName?.toLowerCase?.();
                tree.nodes?.forEach(n => addNode(n, { treeKey, pathKey: k }));
            });
        });
    }

    getTalentTree(key: string): TalentTree | undefined {
        if (!key) return undefined;
        return this.treeByKey.get(key.toLowerCase());
    }

    getTalentPath(key: string): TalentPath | undefined {
        if (!key) return undefined;
        return this.pathByKey.get(key.toLowerCase());
    }

    getAllTalentTrees(): TalentTree[] {
        return Array.from(this.treeByKey.values());
    }

    getTalentNodeById(nodeId: string): NodeEntry | undefined {
        if (!nodeId) return undefined;
        return this.nodeById.get(nodeId);
    }

    findNodes(predicate: (n: TalentNode) => boolean): NodeEntry[] {
        const out: NodeEntry[] = [];
        for (const entry of this.nodeById.values()) {
            if (predicate(entry.node)) out.push(entry);
        }
        return out;
    }

    getNodesByTier(treeOrPathKey: string, tier: number): TalentNode[] {
        const k = treeOrPathKey?.toLowerCase();
        if (!k) return [];

        const byTree = this.treeByKey.get(k);
        if (byTree) return (byTree.nodes || []).filter(n => n.tier === tier);

        const byPath = this.pathByKey.get(k);
        if (!byPath) return [];

        const nodes: TalentNode[] = [];
        byPath.talentNodes?.forEach(n => { if (n.tier === tier) nodes.push(n); });
        byPath.paths?.forEach(t => t.nodes?.forEach(n => { if (n.tier === tier) nodes.push(n); }));
        return nodes;
    }

    findParentPath(treeKey: string): string | null {
        if (!treeKey) return null;
        const k = treeKey.toLowerCase();
        for (const [pathKey, path] of this.pathByKey.entries()) {
            if (path.paths?.some(t => (t.pathName?.toLowerCase?.() || '').toLowerCase() === k || (t.pathName && t.pathName.toLowerCase() === k))) {
                return pathKey;
            }
        }
        return null;
    }

    getSpecializationsForPath(pathKey: string): TalentTree[] {
        const p = this.getTalentPath(pathKey);
        return p?.paths || [];
    }

    validateUniqueIds(): Array<{ id: string; occurrences: NodeEntry[] }> {
        const out: Array<{ id: string; occurrences: NodeEntry[] }> = [];
        for (const [id, list] of this.duplicates.entries()) {
            out.push({ id, occurrences: list });
        }
        return out;
    }

    registerTree(key: string, tree: TalentTree): void {
        const k = key.toLowerCase();
        if (this.treeByKey.has(k)) throw new Error(`Tree already registered: ${k}`);
        // add tree
        this.treeByKey.set(k, tree);
        // index nodes and detect duplicates
        tree.nodes?.forEach(n => {
            if (this.nodeById.has(n.id)) {
                if (this.strict) throw new Error(`Duplicate talent id on register: ${n.id}`);
                const existing = this.nodeById.get(n.id)!;
                const list = this.duplicates.get(n.id) || [existing];
                list.push({ node: n, treeKey: k });
                this.duplicates.set(n.id, list);
            } else {
                this.nodeById.set(n.id, { node: n, treeKey: k });
            }
        });
    }

    unregisterTree(key: string): void {
        const k = key.toLowerCase();
        const tree = this.treeByKey.get(k);
        if (!tree) return;
        this.treeByKey.delete(k);
        // remove node entries belonging to this tree
        tree.nodes?.forEach(n => {
            const entry = this.nodeById.get(n.id);
            if (entry && entry.treeKey === k) this.nodeById.delete(n.id);
            // also clean duplicates map entries that reference this tree
            const dupList = this.duplicates.get(n.id);
            if (dupList) {
                const filtered = dupList.filter(e => e.treeKey !== k);
                if (filtered.length === 0) this.duplicates.delete(n.id);
                else this.duplicates.set(n.id, filtered);
            }
        });
    }

    /**
     * Return the raw prerequisites for a node id (static data only).
     * This helper does NOT perform any validation or availability logic.
     */
    getNodePrerequisites(nodeId: string): TalentPrerequisite[] {
        if (!nodeId) return [];
        const entry = this.getTalentNodeById(nodeId);
        const node = entry?.node;
        return (node?.prerequisites || []) as TalentPrerequisite[];
    }

    /**
     * Build display-ready trees from backend-provided keywords.
     * Groups keywords by `mainPathId` (preferred) or `pathId` (fallback).
     * For each node it attaches `__keywords` (the keyword object) and raw `prerequisites` (from static node if available).
     * This method deliberately does NOT compute unlocked/available state — that belongs to the backend.
     */
    buildDisplayTreesFromKeywords(talentKeywords: Record<string, any>): Array<{ key: string; pathName: string; nodes: Array<any> }> {
        const groups = new Map<string, { key: string; pathName: string; nodes: any[] }>();

        if (!talentKeywords) return [];

        for (const [talentId, kw] of Object.entries(talentKeywords)) {
            // Prefer static index treeKey (subtree) if available; otherwise fall back to provided keywords
            const entry = this.getTalentNodeById(talentId);
            const subtreeKey = entry?.treeKey;
            const pathKey = entry?.pathKey;

            // Determine grouping key with this preference order:
            // 1) static subtree (entry.treeKey) if available
            // 2) keyword-provided `pathId` (specialization) if present
            // 3) keyword-provided `mainPathId` as fallback
            // 4) entry.pathKey grouped as `pathKey.base`
            // 5) 'ungrouped'
            let groupKey: string | undefined;

            // 2) prefer keyword pathId (specialization) over mainPathId
            const kwPath = kw?.pathId?.toString()?.toLowerCase();
            const kwMain = kw?.mainPathId?.toString()?.toLowerCase();

            // 1) static subtree from index, but disambiguate duplicates using keyword pathId or mainPathId when provided
            const dupList = this.duplicates.get(talentId);
            if (dupList && (kwPath || kwMain)) {
                const desired = kwPath || kwMain;
                const match = dupList.find(e => (e.treeKey === desired) || (e.pathKey === desired));
                if (match) {
                    groupKey = (match.treeKey || match.pathKey) as string;
                }
            }
            if (!groupKey && subtreeKey) {
                groupKey = String(subtreeKey).toLowerCase();
            }

            if (!groupKey && kwPath) {
                if (this.getTalentTree(kwPath) || this.getTalentPath(kwPath)) {
                    groupKey = kwPath;
                } else if (dupList) {
                    const match = dupList.find(e => (e.treeKey === kwPath) || (e.pathKey === kwPath));
                    if (match) groupKey = match.treeKey || match.pathKey;
                }
            }

            // 3) try mainPathId if still missing
            if (!groupKey && kwMain) {
                if (this.getTalentTree(kwMain) || this.getTalentPath(kwMain)) {
                    groupKey = kwMain;
                } else {
                    const dupList = this.duplicates.get(talentId);
                    if (dupList) {
                        const match = dupList.find(e => (e.treeKey === kwMain) || (e.pathKey === kwMain));
                        if (match) groupKey = match.treeKey || match.pathKey;
                    }
                }
            }

            // 4) fallback to pathKey.base or ungrouped
            if (!groupKey) {
                if (pathKey) {
                    groupKey = (String(pathKey).toLowerCase() + '.base');
                } else {
                    groupKey = 'ungrouped';
                }
            }

            if (!groups.has(groupKey)) {
                // Build a sensible display name: prefer the subtree/tree name, then the path name, then keyword pathName
                const tree = subtreeKey ? this.getTalentTree(subtreeKey) : undefined;
                const path = pathKey ? this.getTalentPath(pathKey) : undefined;
                // If we're grouping under path base, make a clear display name
                const pathName = tree?.pathName || (groupKey?.endsWith('.base') ? (path?.name ? `${path.name} (base)` : kw?.pathName) : path?.name) || kw?.pathName || groupKey;
                groups.set(groupKey, { key: groupKey, pathName, nodes: [] });
            }

            const group = groups.get(groupKey)!;

            // attempt to attach static node if available, otherwise create minimal placeholder
            const staticNode = entry?.node;
            const node = staticNode ? { ...staticNode } : {
                id: talentId,
                name: kw?.name || talentId,
                description: kw?.description || '',
                actionCost: 0,
                prerequisites: [],
                tier: kw?.tier || 0,
                bonuses: []
            };

            // attach keyword and raw prerequisites
            const rawPrereqs = (node.prerequisites && node.prerequisites.length > 0) ? node.prerequisites : (this.getNodePrerequisites(talentId) || []);
            group.nodes.push({ ...node, __keywords: kw, prerequisites: rawPrereqs });
        }

        // Return array of groups (subtrees/paths) sorted by display name for stable UI order
        return Array.from(groups.values())
            .map(g => ({ key: g.key, pathName: g.pathName, nodes: g.nodes }))
            .sort((a, b) => (a.pathName || '').localeCompare(b.pathName || ''));
    }

    /**
     * Return all node ids for a tree or path key.
     */
    getTreeNodeIds(treeKey: string): string[] {
        if (!treeKey) return [];
        const k = treeKey.toLowerCase();
        const tree = this.getTalentTree(k);
        if (tree) return (tree.nodes || []).map(n => n.id);
        const path = this.getTalentPath(k);
        if (!path) return [];
        const ids: string[] = [];
        path.talentNodes?.forEach(n => ids.push(n.id));
        path.paths?.forEach(t => t.nodes?.forEach(n => ids.push(n.id)));
        return ids;
    }
}

export const talentTreeManager = new TalentTreeManager();

export default talentTreeManager;
