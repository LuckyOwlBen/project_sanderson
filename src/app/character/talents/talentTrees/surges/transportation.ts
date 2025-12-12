import { TalentTree } from "../../talentInterface";

export const TRANSPORTATION_SURGE_TREE: TalentTree = {
    pathName: "Transportation",
    nodes: [
        {
            id: 'transportation_placeholder_1',
            name: 'Transportation Power (Placeholder)',
            description: 'Surge ability to be populated from rulebook.',
            actionCost: 1,
            prerequisites: [{ type: 'skill', target: 'TRANSPORTATION', value: 1 }],
            tier: 1,
            bonuses: [],
            otherEffects: ['To be populated with actual surge power.']
        },
        {
            id: 'transportation_placeholder_2',
            name: 'Advanced Transportation (Placeholder)',
            description: 'Advanced surge ability to be populated from rulebook.',
            actionCost: 1,
            prerequisites: [
                { type: 'skill', target: 'TRANSPORTATION', value: 3 },
                { type: 'talent', target: 'transportation_placeholder_1' }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: ['To be populated with actual surge power.']
        }
    ]
};
