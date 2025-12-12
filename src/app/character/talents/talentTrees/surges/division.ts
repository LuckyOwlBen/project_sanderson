import { TalentTree } from "../../talentInterface";

export const DIVISION_SURGE_TREE: TalentTree = {
    pathName: "Division",
    nodes: [
        {
            id: 'division_placeholder_1',
            name: 'Division Power (Placeholder)',
            description: 'Surge ability to be populated from rulebook.',
            actionCost: 1,
            prerequisites: [{ type: 'skill', target: 'DIVISION', value: 1 }],
            tier: 1,
            bonuses: [],
            otherEffects: ['To be populated with actual surge power.']
        },
        {
            id: 'division_placeholder_2',
            name: 'Advanced Division (Placeholder)',
            description: 'Advanced surge ability to be populated from rulebook.',
            actionCost: 1,
            prerequisites: [
                { type: 'skill', target: 'DIVISION', value: 3 },
                { type: 'talent', target: 'division_placeholder_1' }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: ['To be populated with actual surge power.']
        }
    ]
};
