import { describe, it, expect } from 'vitest';
import { meetsPrereqs, getAvailableTalentIds } from '../talent-availability.service';

describe('Talent Availability Service', () => {
  it('meetsPrereqs returns true when all prereqs satisfied and false otherwise', () => {
    const node = {
      prerequisites: [
        { type: 'skill', target: 'intimidation', value: 1 },
        { type: 'talent', target: 'vigilant_stance' },
      ],
    } as any;

    const unlocked = new Set<string>(['vigilant_stance']);
    const character = { skills: { intimidation: 1 }, attributes: {}, level: 2 } as any;

    expect(meetsPrereqs(node, unlocked, character)).toBe(true);

    // Missing skill
    const charNoSkill = { skills: { intimidation: 0 }, attributes: {}, level: 2 } as any;
    expect(meetsPrereqs(node, unlocked, charNoSkill)).toBe(false);

    // Missing talent
    const unlockedEmpty = new Set<string>();
    expect(meetsPrereqs(node, unlockedEmpty, character)).toBe(false);
  });

  it('getAvailableTalentIds includes nodes when prereqs met and excludes when not', () => {
    // Use the 'duelist' tree which contains known nodes like 'flamestance' and 'signature_weapon'
    const treeIds = ['duelist'];

    // Case: has vigilant_stance and intimidation 1 => flamestance and practiced_kata available
    const unlocked = new Set<string>(['vigilant_stance']);
    const character = {
      skills: { intimidation: 1, athletics: 0 },
      attributes: {},
      level: 2,
    } as any;

    const avail = getAvailableTalentIds(treeIds, unlocked, character, false);
    expect(avail).toContain('flamestance');
    expect(avail).toContain('practiced_kata');

    // signature_weapon requires flamestance, should NOT be available unless flamestance unlocked
    expect(avail).not.toContain('signature_weapon');

    // If we mark flamestance as unlocked, signature_weapon becomes available (prereq satisfied)
    const unlocked2 = new Set<string>(['vigilant_stance', 'flamestance']);
    const avail2 = getAvailableTalentIds(treeIds, unlocked2, character, false);
    expect(avail2).toContain('signature_weapon');
  });
});
