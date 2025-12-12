import { TalentPath } from "../../talentInterface";

export const ELSECALLER_TALENT_TREE: TalentPath = {
    name: "Elsecaller",
    paths: [],
    talentNodes: [
        {
            id: 'elsecaller_key_talent',
            name: 'Elsecaller\'s Potential',
            description: 'You have bonded an Inkspren and become an Elsecaller. Philosophy: Strive to reach your true potential. You may now speak the First Ideal to unlock your Surges of Transformation and Transportation.',
            actionCost: Infinity,
            prerequisites: [],
            tier: 0,
            bonuses: [],
            otherEffects: ['Grants access to Transformation and Transportation surge trees upon speaking the First Ideal.']
        }
    ]
};
