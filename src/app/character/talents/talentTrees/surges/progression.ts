import { TalentTree } from "../../talentInterface";

export const PROGRESSION_SURGE_TREE: TalentTree = {
    pathName: "Progression",
    nodes: [
        {
            id: 'progression_placeholder_1',
            name: 'Progression Power (Placeholder)',
            description: 'Surge ability to be populated from rulebook.',
            actionCost: 1,
            prerequisites: [{ type: 'skill', target: 'PROGRESSION', value: 1 }],
            tier: 1,
            bonuses: [],
            otherEffects: ['To be populated with actual surge power.']
        },
        {
            id: 'progression_placeholder_2',
            name: 'Advanced Progression (Placeholder)',
            description: 'Advanced surge ability to be populated from rulebook.',
            actionCost: 1,
            prerequisites: [
                { type: 'skill', target: 'PROGRESSION', value: 3 },
                { type: 'talent', target: 'progression_placeholder_1' }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: ['To be populated with actual surge power.']
        }
    ]
};
