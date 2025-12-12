import { TalentPath } from "../../talentInterface";

export const LIGHTWEAVER_TALENT_TREE: TalentPath = {
    name: "Lightweaver",
    paths: [],
    talentNodes: [
        {
            id: 'lightweaver_key_talent',
            name: 'Lightweaver\'s Truth',
            description: 'You have bonded a Cryptic and become a Lightweaver. Philosophy: Separate truth from lies. You may now speak the First Ideal to unlock your Surges of Illumination and Transformation.',
            actionCost: Infinity,
            prerequisites: [],
            tier: 0,
            bonuses: [],
            otherEffects: ['Grants access to Illumination and Transformation surge trees upon speaking the First Ideal.']
        }
    ]
};
