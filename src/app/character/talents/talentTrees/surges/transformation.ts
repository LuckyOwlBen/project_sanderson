import { TalentTree } from "../../talentInterface";

export const TRANSFORMATION_SURGE_TREE: TalentTree = {
    pathName: "Transformation",
    nodes: [
        {
            id: 'transformation_placeholder_1',
            name: 'Transformation Power (Placeholder)',
            description: 'Surge ability to be populated from rulebook.',
            actionCost: 1,
            prerequisites: [{ type: 'skill', target: 'TRANSFORMATION', value: 1 }],
            tier: 1,
            bonuses: [],
            otherEffects: ['To be populated with actual surge power.']
        },
        {
            id: 'transformation_placeholder_2',
            name: 'Advanced Transformation (Placeholder)',
            description: 'Advanced surge ability to be populated from rulebook.',
            actionCost: 1,
            prerequisites: [
                { type: 'skill', target: 'TRANSFORMATION', value: 3 },
                { type: 'talent', target: 'transformation_placeholder_1' }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: ['To be populated with actual surge power.']
        }
    ]
};
