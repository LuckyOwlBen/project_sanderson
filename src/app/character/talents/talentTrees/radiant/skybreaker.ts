import { TalentPath } from "../../talentInterface";

export const SKYBREAKER_TALENT_TREE: TalentPath = {
    name: "Skybreaker",
    paths: [],
    talentNodes: [
        {
            id: 'skybreaker_key_talent',
            name: 'Skybreaker\'s Justice',
            description: 'You have bonded a Highspren and become a Skybreaker. Philosophy: Enforce the law and strive for justice. You may now speak the First Ideal to unlock your Surges of Division and Gravitation.',
            actionCost: Infinity,
            prerequisites: [],
            tier: 0,
            bonuses: [],
            otherEffects: ['Grants access to Division and Gravitation surge trees upon speaking the First Ideal.']
        }
    ]
};
