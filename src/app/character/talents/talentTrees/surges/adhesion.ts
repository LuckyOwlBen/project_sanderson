import { TalentTree } from "../../talentInterface";

export const ADHESION_SURGE_TREE: TalentTree = {
    pathName: "Adhesion",
    nodes: [
        {
            id: 'adhesion_placeholder_1',
            name: 'Adhesion Power (Placeholder)',
            description: 'Surge ability to be populated from rulebook.',
            actionCost: 1,
            prerequisites: [{ type: 'skill', target: 'ADHESION', value: 1 }],
            tier: 1,
            bonuses: [],
            otherEffects: ['To be populated with actual surge power.']
        },
        {
            id: 'adhesion_placeholder_2',
            name: 'Advanced Adhesion (Placeholder)',
            description: 'Advanced surge ability to be populated from rulebook.',
            actionCost: 1,
            prerequisites: [
                { type: 'skill', target: 'ADHESION', value: 3 },
                { type: 'talent', target: 'adhesion_placeholder_1' }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: ['To be populated with actual surge power.']
        }
    ]
};
