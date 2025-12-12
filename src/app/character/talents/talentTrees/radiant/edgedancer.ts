import { TalentPath } from "../../talentInterface";

export const EDGEDANCER_TALENT_TREE: TalentPath = {
    name: "Edgedancer",
    paths: [],
    talentNodes: [
        {
            id: 'edgedancer_key_talent',
            name: 'Edgedancer\'s Memory',
            description: 'You have bonded a Cultivationspren and become an Edgedancer. Philosophy: Remember and serve those who others forget. You may now speak the First Ideal to unlock your Surges of Abrasion and Progression.',
            actionCost: Infinity,
            prerequisites: [],
            tier: 0,
            bonuses: [],
            otherEffects: ['Grants access to Abrasion and Progression surge trees upon speaking the First Ideal.']
        }
    ]
};
