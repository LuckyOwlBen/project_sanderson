import { ENVOY_HEROIC_PATH } from './envoyHeroicPaths';
import { MENTOR_TALENT_TREE } from './mentor';
import { FAITHFUL_TALENT_TREE } from './faithful';

describe('Envoy Heroic Path - Tier 0 Power', () => {
  it('should include Rousing Presence with id rousing_presence', () => {
    expect(ENVOY_HEROIC_PATH.talentNodes).toBeDefined();
    const nodes = ENVOY_HEROIC_PATH.talentNodes ?? [];
    const node = nodes.find(n => n.id === 'rousing_presence');
    expect(node).toBeDefined();
    expect(node!.name).toBe('Rousing Presence');
    expect(node!.tier).toBe(0);
    expect(node!.actionCost).toBe(1);
  });

  it('mentor talents should reference rousing_presence prerequisite', () => {
    const requiresRousingPresence = MENTOR_TALENT_TREE.nodes.some(n =>
      (n.prerequisites || []).some(p => p.type === 'talent' && p.target === 'rousing_presence')
    );
    expect(requiresRousingPresence).toBe(true);
  });

  it('faithful talents should reference rousing_presence prerequisite', () => {
    const requiresRousingPresence = FAITHFUL_TALENT_TREE.nodes.some(n =>
      (n.prerequisites || []).some(p => p.type === 'talent' && p.target === 'rousing_presence')
    );
    expect(requiresRousingPresence).toBe(true);
  });
});
