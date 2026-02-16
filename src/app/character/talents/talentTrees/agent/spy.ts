import { BonusType } from "../../../bonuses/bonusModule";
import { TalentTree } from "../../talentInterface";

export const SPY_TALENT_TREE: TalentTree = {
    pathName: "Spy",
    nodes: [
        {
            id: "sureOutcome",
            name: "Sure Outcome",
            description: "When you use Opportunist, spend 2 focus to change an opportunity to 4 consequences, or change any consequence to an opportunity.",
            actionCost: -2, // Special
            specialActivation: "When you use Opportunist, spend 2 focus to change an opportunity to 4 consequences, or change any consequence to an opportunity.",
            prerequisites: [
                { type: 'talent', target: 'opportunist' },
                { type: 'skill', target: 'Insight', value: 2 },
            ],
            tier: 1,
            bonuses: [],
            otherEffects: ["When you use Opportunist, spend 2 focus to change an opportunity to 4 consequences, or change any consequence to an opportunity."],
        },
        {
            id: "plasibleExcuse",
            name: "Plausible Excuse",
            description: "Gain Sleight of Hand expertise. When discovered skulking, spend 2 focus to feign innocence.",
            actionCost: -1, // Reaction
            prerequisites: [
                { type: 'talent', target: 'opportunist' },
                { type: 'skill', target: 'Deception', value: 1 },
            ],
            tier: 1,
            bonuses: [],
            otherEffects: ["Gain Sleight of Hand expertise. When discovered skulking, spend 2 focus to feign innocence."],
        },
        {
            id: "collected",
            name: "Collected",
            description: "Increase your Cognitive and Spiritual defenses by 2.",
            actionCost: Infinity, // Passive
            prerequisites: [
                { type: 'talent', target: 'sureOutcome' },
            ],
            tier: 2,
            bonuses: [
                { type: BonusType.DEFENSE, target: 'Cognitive', value: 2 },
                { type: BonusType.DEFENSE, target: 'Spiritual', value: 2 },
            ],
        },
        {
            id: "coverStory",
            name: "Cover Story",
            description: "Gain a false identity and a relevant cultural expertise.",
            actionCost: Infinity, // Passive
            prerequisites: [
                { type: 'talent', target: 'plasibleExcuse'},

            ],
            tier: 2,
            bonuses: [],
            otherEffects: ["Gain a false identity and a relevant cultural expertise."],
        },
        {
            id: "subtleTakedown",
            name: "Subtle Takedown",
            description: "Make an unarmed attack with Insight vs. an unsuspecting target's Cognitive, raising the stakes. On a hit, they can't communicate.",
            actionCost: 2, // 2 actions
            prerequisites: [
                { type: 'talent', target: 'coverStory' },
                { type: 'skill', target: 'Insight', value: 3 },
            ],
            tier: 3,
            bonuses: [],
            otherEffects: ["Make an unarmed attack with Insight vs. an unsuspecting target's Cognitive, raising the stakes. On a hit, they can't communicate."],
        },
        {
            id: "mighty",
            name: "Mighty",
            description: "When you hit with a weapon or unarmed attack, for each action point spent deal extra damage equal to 1 + your tier.",
            actionCost: Infinity, // Passive
            prerequisites: [
                { type: 'talent', target: 'coverStory' },
            ],
            tier: 3,
            bonuses: [],
            otherEffects: ["When you hit with a weapon or unarmed attack, for each action point spent deal extra damage equal to 1 + your tier."],
        },
        {
            id: "highSocietyContacts",
            name: "High Society Contacts",
            description: "Gain High Society expertise. Spend 2 focus to add a opportunity to a test to interact in high society.",
            actionCost: -2, // Special
            specialActivation: "Spend 2 focus to add a opportunity to a test to interact in high society.",
            prerequisites: [
                {type: 'talent', target: 'coverStory'}

            ],
            tier: 4,
            bonuses: [],
        },
        {
            id: "mercurialFacade",
            name: "Mercurial Facade",
            description: "Disguise yourself using Deception without needing physical supplies. The first character to see through your disguise is surprised.",
            actionCost: -2, //special
            specialActivation: "Disguise yourself using Deception without needing physical supplies.",
            prerequisites: [
                {type: 'talent', target:'subtleTakedown'},
            ],
            tier: 4,
            bonuses: [],
        }
    ],
}