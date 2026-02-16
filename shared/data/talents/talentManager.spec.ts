import { describe, it, expect } from 'vitest';
import { TalentTreeManager, talentTreeManager } from './talentManager';

describe('TalentTreeManager', () => {
    it('builds indexes and exposes trees', () => {
        const mgr = talentTreeManager as TalentTreeManager;
        const all = mgr.getAllTalentTrees();
        expect(Array.isArray(all)).toBe(true);
        expect(all.length).toBeGreaterThan(0);
    });

    it('can lookup a node by id when present', () => {
        const mgr = talentTreeManager as TalentTreeManager;
        const anyTree = mgr.getAllTalentTrees()[0];
        if (!anyTree) return;
        const node = anyTree.nodes?.[0];
        if (!node) return;
        const found = mgr.getTalentNodeById(node.id);
        expect(found).toBeDefined();
        expect(found?.node.id).toBe(node.id);
    });

    it('validateUniqueIds returns an array', () => {
        const dups = talentTreeManager.validateUniqueIds();
        expect(Array.isArray(dups)).toBe(true);
    });

    it('buildDisplayTreesFromKeywords groups by subtree when available', () => {
        const mgr = talentTreeManager as TalentTreeManager;

        const talentKeywords: Record<string, any> = {
            'flamestance': { name: 'Flamestance', description: 'desc', tier: 1 },
            // disambiguate duplicate id by providing mainPathId
            'combat_training': { name: 'Combat Training', description: 'desc', tier: 1, mainPathId: 'archer' }
        };

        const groups = mgr.buildDisplayTreesFromKeywords(talentKeywords);
        // debug removed
        // Expect at least two groups (duelist and archer)
        const keys = groups.map(g => g.key);
        expect(keys.some(k => k.includes('duelist'))).toBe(true);
        expect(keys.some(k => k.includes('archer'))).toBe(true);

        // Ensure nodes are present in their respective groups
        const duelistGroup = groups.find(g => g.key.includes('duelist'));
        const archerGroup = groups.find(g => g.key.includes('archer'));
        expect(duelistGroup).toBeDefined();
        expect(archerGroup).toBeDefined();
        expect(duelistGroup?.nodes.some((n: any) => n.id === 'flamestance')).toBe(true);
        expect(archerGroup?.nodes.some((n: any) => n.id === 'combat_training')).toBe(true);
    });
});
