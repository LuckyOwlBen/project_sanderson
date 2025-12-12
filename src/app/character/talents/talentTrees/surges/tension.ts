import { TalentTree } from "../../talentInterface";

export const TENSION_SURGE_TREE: TalentTree = {
    pathName: "Tension",
    nodes: [
        {
            id: 'tension_placeholder_1',
            name: 'Tension Power (Placeholder)',
            description: 'Surge ability to be populated from rulebook.',
            actionCost: 1,
            prerequisites: [{ type: 'skill', target: 'TENSION', value: 1 }],
            tier: 1,
            bonuses: [],
            otherEffects: ['To be populated with actual surge power.']
        },
        {
            id: 'tension_placeholder_2',
            name: 'Advanced Tension (Placeholder)',
            description: 'Advanced surge ability to be populated from rulebook.',
            actionCost: 1,
            prerequisites: [
                { type: 'skill', target: 'TENSION', value: 3 },
                { type: 'talent', target: 'tension_placeholder_1' }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: ['To be populated with actual surge power.']
        }
    ]
};
