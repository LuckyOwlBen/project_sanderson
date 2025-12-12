import { TalentTree } from "../../talentInterface";

export const GRAVITATION_SURGE_TREE: TalentTree = {
    pathName: "Gravitation",
    nodes: [
        {
            id: 'gravitation_placeholder_1',
            name: 'Gravitation Power (Placeholder)',
            description: 'Surge ability to be populated from rulebook.',
            actionCost: 1,
            prerequisites: [{ type: 'skill', target: 'GRAVITATION', value: 1 }],
            tier: 1,
            bonuses: [],
            otherEffects: ['To be populated with actual surge power.']
        },
        {
            id: 'gravitation_placeholder_2',
            name: 'Advanced Gravitation (Placeholder)',
            description: 'Advanced surge ability to be populated from rulebook.',
            actionCost: 1,
            prerequisites: [
                { type: 'skill', target: 'GRAVITATION', value: 3 },
                { type: 'talent', target: 'gravitation_placeholder_1' }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: ['To be populated with actual surge power.']
        }
    ]
};
