import { TalentPath } from "../../talentInterface";

export const WINDRUNNER_TALENT_TREE: TalentPath = {
    name: "Windrunner",
    paths: [],
    talentNodes: [
        {
            id: 'windrunner_key_talent',
            name: 'Windrunner\'s Blessing',
            description: 'You have bonded an Honorspren and become a Windrunner. Philosophy: Protect the innocent and the defenseless. You may now speak the First Ideal to unlock your Surges of Adhesion and Gravitation.',
            actionCost: Infinity,
            prerequisites: [],
            tier: 0,
            bonuses: [],
            otherEffects: ['Grants access to Adhesion and Gravitation surge trees upon speaking the First Ideal.']
        }
    ]
};
