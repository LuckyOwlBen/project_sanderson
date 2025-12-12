import { TalentPath } from "../../talentInterface";

export const TRUTHWATCHER_TALENT_TREE: TalentPath = {
    name: "Truthwatcher",
    paths: [],
    talentNodes: [
        {
            id: 'truthwatcher_key_talent',
            name: 'Truthwatcher\'s Insight',
            description: 'You have bonded a Mistspren and become a Truthwatcher. Philosophy: Search for fundamental truth and share it. You may now speak the First Ideal to unlock your Surges of Illumination and Progression.',
            actionCost: Infinity,
            prerequisites: [],
            tier: 0,
            bonuses: [],
            otherEffects: ['Grants access to Illumination and Progression surge trees upon speaking the First Ideal.']
        }
    ]
};
