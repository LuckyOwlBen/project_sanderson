import { TalentPath } from "../../talentInterface";

export const WILLSHAPER_TALENT_TREE: TalentPath = {
    name: "Willshaper",
    paths: [],
    talentNodes: [
        {
            id: 'willshaper_key_talent',
            name: 'Willshaper\'s Freedom',
            description: 'You have bonded a Lightspren and become a Willshaper. Philosophy: Seek freedom and choice for all peoples. You may now speak the First Ideal to unlock your Surges of Cohesion and Transportation.',
            actionCost: Infinity,
            prerequisites: [],
            tier: 0,
            bonuses: [],
            otherEffects: ['Grants access to Cohesion and Transportation surge trees upon speaking the First Ideal.']
        }
    ]
};
