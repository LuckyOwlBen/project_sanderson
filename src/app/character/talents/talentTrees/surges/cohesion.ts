import { TalentTree } from "../../talentInterface";

export const COHESION_SURGE_TREE: TalentTree = {
    pathName: "Cohesion",
    nodes: [
        {
            id: 'cohesion_placeholder_1',
            name: 'Cohesion Power (Placeholder)',
            description: 'Surge ability to be populated from rulebook.',
            actionCost: 1,
            prerequisites: [{ type: 'skill', target: 'COHESION', value: 1 }],
            tier: 1,
            bonuses: [],
            otherEffects: ['To be populated with actual surge power.']
        },
        {
            id: 'cohesion_placeholder_2',
            name: 'Advanced Cohesion (Placeholder)',
            description: 'Advanced surge ability to be populated from rulebook.',
            actionCost: 1,
            prerequisites: [
                { type: 'skill', target: 'COHESION', value: 3 },
                { type: 'talent', target: 'cohesion_placeholder_1' }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: ['To be populated with actual surge power.']
        }
    ]
};
