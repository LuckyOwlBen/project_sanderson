import { TalentTree } from "../../talentInterface";

export const ILLUMINATION_SURGE_TREE: TalentTree = {
    pathName: "Illumination",
    nodes: [
        {
            id: 'illumination_placeholder_1',
            name: 'Illumination Power (Placeholder)',
            description: 'Surge ability to be populated from rulebook.',
            actionCost: 1,
            prerequisites: [{ type: 'skill', target: 'ILLUMINATION', value: 1 }],
            tier: 1,
            bonuses: [],
            otherEffects: ['To be populated with actual surge power.']
        },
        {
            id: 'illumination_placeholder_2',
            name: 'Advanced Illumination (Placeholder)',
            description: 'Advanced surge ability to be populated from rulebook.',
            actionCost: 1,
            prerequisites: [
                { type: 'skill', target: 'ILLUMINATION', value: 3 },
                { type: 'talent', target: 'illumination_placeholder_1' }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: ['To be populated with actual surge power.']
        }
    ]
};
