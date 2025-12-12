import { TalentPath } from "../../talentInterface";

export const DUSTBRINGER_TALENT_TREE: TalentPath = {
    name: "Dustbringer",
    paths: [],
    talentNodes: [
        {
            id: 'dustbringer_key_talent',
            name: 'Dustbringer\'s Discipline',
            description: 'You have bonded an Ashspren and become a Dustbringer. Philosophy: Great power requires strong discipline. You may now speak the First Ideal to unlock your Surges of Division and Abrasion.',
            actionCost: Infinity,
            prerequisites: [],
            tier: 0,
            bonuses: [],
            otherEffects: ['Grants access to Division and Abrasion surge trees upon speaking the First Ideal.']
        }
    ]
};
