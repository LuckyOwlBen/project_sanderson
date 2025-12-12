import { TalentPath } from "../../talentInterface";

export const STONEWARD_TALENT_TREE: TalentPath = {
    name: "Stoneward",
    paths: [],
    talentNodes: [
        {
            id: 'stoneward_key_talent',
            name: 'Stoneward\'s Resolve',
            description: 'You have bonded a Peakspren and become a Stoneward. Philosophy: Be the support on which others can depend. You may now speak the First Ideal to unlock your Surges of Cohesion and Tension.',
            actionCost: Infinity,
            prerequisites: [],
            tier: 0,
            bonuses: [],
            otherEffects: ['Grants access to Cohesion and Tension surge trees upon speaking the First Ideal.']
        }
    ]
};
