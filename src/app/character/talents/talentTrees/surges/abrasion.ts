import { TalentTree } from "../../talentInterface";

export const ABRASION_SURGE_TREE: TalentTree = {
    pathName: "Abrasion",
    nodes: [
        {
            id: 'abrasion_placeholder_1',
            name: 'Abrasion Power (Placeholder)',
            description: 'Surge ability to be populated from rulebook.',
            actionCost: 1,
            prerequisites: [{ type: 'skill', target: 'ABRASION', value: 1 }],
            tier: 1,
            bonuses: [],
            otherEffects: ['To be populated with actual surge power.']
        },
        {
            id: 'abrasion_placeholder_2',
            name: 'Advanced Abrasion (Placeholder)',
            description: 'Advanced surge ability to be populated from rulebook.',
            actionCost: 1,
            prerequisites: [
                { type: 'skill', target: 'ABRASION', value: 3 },
                { type: 'talent', target: 'abrasion_placeholder_1' }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: ['To be populated with actual surge power.']
        }
    ]
};
