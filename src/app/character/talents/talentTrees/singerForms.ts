import { BonusType } from '../../bonuses/bonusModule';
import { TalentTree } from '../talentInterface';

export const SINGER_FORMS_TALENT_TREE: TalentTree = {
    pathName: "Singer Forms",
    nodes: [
        {
            id: "singer_ancestry",
            name: "Singer Ancestry",
            description: "You possess the innate abilities of a Singer, allowing you to assume various forms during highstorms.",
            actionCost: Infinity,
            prerequisites: [],
            tier: 0,
            bonuses: [],
        },
        {
            id: "singer_change_form",
            name: "Change Form",
            description: "During a highstorm, you can change into dullform, mateform, or another one of your singer forms.",
            actionCost: 3,
            prerequisites: [
                { type: 'talent', target: 'singer_ancestry' }
            ],
            tier: 1,
            bonuses: [],
        },
        {
            id: "forms_of_finesse",
            name: "Forms of Finesse",
            description: "Gain artform and nimbleform",
            actionCost: Infinity,
            prerequisites: [
                { type: 'talent', target: 'singer_ancestry' },
                { type: 'talent', target: 'singer_change_form' },
            ],
            tier: 2,
            bonuses: [],
        },
        {
            id: "nimbleform",
            name: "Nimbleform",
            description: "Speed +1, Focus+2",
            actionCost: Infinity,
            prerequisites: [
                { type: 'talent', target: 'singer_ancestry' },
                { type: 'talent', target: 'singer_change_form' },
                { type: 'talent', target: 'forms_of_finesse' },
            ],
            tier: 2,
            bonuses: [
                { type: BonusType.ATTRIBUTE, target: "speed", value: 1, scaling: false, condition: "while in nimbleform" },
                { type: BonusType.RESOURCE, target: "focus", value: 2, scaling: false, condition: "while in nimbleform" },
            ],
        },
        {
            id: "artform",
            name: "Artform",
            description: "Awareness +1, expertise in Painting and Music, advantage on Crafting tests and tests to entertain",
            actionCost: Infinity,
            prerequisites: [
                { type: 'talent', target: 'singer_ancestry' },
                { type: 'talent', target: 'singer_change_form' },
                { type: 'talent', target: 'forms_of_finesse' },
            ],
            tier: 2,
            bonuses: [
                { type: BonusType.ATTRIBUTE, target: "awareness", value: 1, scaling: false, condition: "while in artform" },
            ],
            grantsAdvantage: [
                "crafting",
                "entertainment"
            ],
            otherEffects: [
                "Expertise in Painting and Music"
            ],
        },
        {
            id: "forms_of_wisdom",
            name: "Forms of Wisdom",
            description: "Gain meditationform and scholarform",
            actionCost: Infinity,
            prerequisites: [
                { type: 'talent', target: 'singer_ancestry' },
                { type: 'talent', target: 'singer_change_form' },
            ],
            tier: 2,
            bonuses: [],
        },
        {
            id: "meditationform",
            name: "Meditationform",
            description: "Presence +1, you can aid without spending focus",
            actionCost: Infinity,
            prerequisites: [
                { type: 'talent', target: 'singer_ancestry' },
                { type: 'talent', target: 'singer_change_form' },
                { type: 'talent', target: 'forms_of_wisdom' },
            ],
            tier: 2,
            bonuses: [
                { type: BonusType.ATTRIBUTE, target: "presence", value: 1, scaling: false, condition: "while in meditationform" },
            ],
            otherEffects: ["Can aid without spending focus while in meditationform"],
        },
        {
            id: "scholarform",
            name: "Scholarform",
            description: "Intellect +1, Temporarily gain a cultural or utility expertise and a rank in a non-surge cognitive skill",
            actionCost: Infinity,
            prerequisites: [
                { type: 'talent', target: 'singer_ancestry' },
                { type: 'talent', target: 'singer_change_form' },
                { type: 'talent', target: 'forms_of_wisdom' },
            ],
            tier: 2,
            bonuses: [
                { type: BonusType.ATTRIBUTE, target: "intellect", value: 1, scaling: false, condition: "while in scholarform" },
            ],
            otherEffects: ["Temporarily gain a cultural or utility expertise and a rank in a non-surge cognitive skill while in scholarform"],
        },
        {
            id: "forms_of_resolve",
            name:"Forms of Resolve",
            description: "Gain warform and workform",
            actionCost: Infinity,
            prerequisites: [
                { type: 'talent', target: 'singer_ancestry' },
                { type: 'talent', target: 'singer_change_form' },
            ],
            tier: 2,
            bonuses: [],
        },
        {
            id: "warform",
            name: "Warform",
            description: "Strength +1, Deflect +1",
            actionCost: Infinity,
            prerequisites: [
                { type: 'talent', target: 'singer_ancestry' },
                { type: 'talent', target: 'singer_change_form' },
                { type: 'talent', target: 'forms_of_resolve' },
            ],
            tier: 2,
            bonuses: [
                { type: BonusType.ATTRIBUTE, target: "strength", value: 1, scaling: false, condition: "while in workform" },
                { type: BonusType.DEFLECT, target: "physical", value: 1, scaling: false, condition: "while in workform" },
            ],
        },
        {
            id: "workform",
            name: "Workform",
            description: "Willpower +1, ignore Exausted. You can disguise youself as parshman.",
            actionCost: Infinity,
            prerequisites: [
                { type: 'talent', target: 'singer_ancestry' },
                { type: 'talent', target: 'singer_change_form' },
                { type: 'talent', target: 'forms_of_resolve' },
            ],
            tier: 2,
            bonuses: [
                { type: BonusType.ATTRIBUTE, target: "willpower", value: 1, scaling: false, condition: "while in workform" },
            ],
            otherEffects: [
                "Ignore Exhausted condition while in workform",
                "Can disguise yourself as parshman while in workform"
            ],
        },
        {
            id: "ambitious_mind",
            name: "Ambitious Mind",
            description: "Increase Cognitive defense by 2. You can bond a Voidspren but once per day on a complication you must test Discipline (DC 15) or be Stunned.",
            actionCost: Infinity,
            prerequisites: [
                { type: 'talent', target: 'singer_ancestry' },
                { type: 'talent', target: 'singer_change_form' },
                { type: 'skill', target: 'discipline', value: 3 },
            ],
            tier: 3,
            bonuses: [
                { type: BonusType.DEFENSE, target: "cognitive", value: 2, scaling: false },
            ],
            otherEffects: [
                "You can bond a Voidspren",
                "Once per day on a complication you must test Discipline (DC 15) or be Stunned"
            ],
        },
        {
            id: "Forms of Destruction",
            name: "Forms of Destruction",
            description: "Gain direform and stormform",
            actionCost: Infinity,
            prerequisites: [
                { type: 'talent', target: 'singer_ancestry' },
                { type: 'talent', target: 'singer_change_form' },
                { type: 'talent', target: 'ambitious_mind' },
            ],
            tier: 4,
            bonuses: [],
        },
        {
            id:"direform",
            name:"Direform",
            description:"Strength + 2, deflect +2. You can use reactive strikes to grapple instead of attacking",
            actionCost: Infinity,
            prerequisites: [
                { type: 'talent', target: 'singer_ancestry' },
                { type: 'talent', target: 'singer_change_form' },
                { type: 'talent', target: 'forms_of_destruction' },
                { type: 'talent', target: 'ambitious_mind' },
            ],
            tier: 4,
            bonuses: [
                { type: BonusType.ATTRIBUTE, target: "strength", value: 2, scaling: false, condition: "while in direform" },
                { type: BonusType.DEFLECT, target: "physical", value: 2, scaling: false, condition: "while in direform" },
            ],
        },
        {
            id: "stormform",
            name:"Stormform",
            description:"Strength + 1, Speed + 1, deflect + 1. You can Unleash Lightning as a 2 action ability: Spend one focus or 1 investiture to make a ranged Discipline attack (60 Feet) vs Physical. Roll 2d8 energy damage, and on a hit, the target is disoriented.",
            actionCost: Infinity,
            prerequisites: [
                { type: 'talent', target: 'singer_ancestry' },
                { type: 'talent', target: 'singer_change_form' },
                { type: 'talent', target: 'forms_of_destruction' },
                { type: 'talent', target: 'ambitious_mind' },
            ],
            tier: 4,
            bonuses: [
                { type: BonusType.ATTRIBUTE, target: "strength", value: 1, scaling: false, condition: "while in stormform" },
                { type: BonusType.ATTRIBUTE, target: "speed", value: 1, scaling: false, condition: "while in stormform" },
                { type: BonusType.DEFLECT, target: "physical", value: 1, scaling: false, condition: "while in stormform" },
            ],
            otherEffects: [
                "You can Unleash Lightning as a 2 action ability: Spend one focus or 1 investiture to make a ranged Discipline attack (60 Feet) vs Physical. Roll 2d8 energy damage, and on a hit, the target is disoriented."
            ],
        },
        {
            id: "forms_of_expansion",
            name: "Forms of Expansion",
            description: "Gain envoyform and relayform.",
            actionCost: Infinity,
            prerequisites: [
                { type: 'talent', target: 'singer_ancestry' },
                { type: 'talent', target: 'singer_change_form' },
                { type: 'talent', target: 'ambitious_mind' },
            ],
            tier: 4,
            bonuses: [],
        },
        {
            id: "envoyform",
            name: "Envoyform",
            description: "Intellect + 1, Presence + 1, you know all languages and gain an advantage on Insight tests about the intentions of others.",
            actionCost:Infinity,
            prerequisites: [
                { type: 'talent', target: 'singer_ancestry' },
                { type: 'talent', target: 'singer_change_form' },
                { type: 'talent', target: 'forms_of_expansion' },
                { type: 'talent', target: 'ambitious_mind' },
            ],
            tier: 4,
            bonuses: [
                { type: BonusType.ATTRIBUTE, target: "intellect", value: 1, scaling: false, condition: "while in envoyform" },
                { type: BonusType.ATTRIBUTE, target: "presence", value: 1, scaling: false, condition: "while in envoyform" },
            ],
            otherEffects: [
                "You know all languages and gain an advantage on Insight tests about the intentions of others while in envoyform."
            ],
        },
        {
            id: "relayform",
            name: "Relayform",
            description: "Speed + 2, ignore slowed. Spend 1 focus to gain an advantage when you test Agility, Stealth, or Thievery.",
            actionCost: Infinity,
            prerequisites: [
                { type: 'talent', target: 'singer_ancestry' },
                { type: 'talent', target: 'singer_change_form' },
                { type: 'talent', target: 'forms_of_expansion' },
                { type: 'talent', target: 'ambitious_mind' },
            ],
            tier: 4,
            bonuses: [
                { type: BonusType.ATTRIBUTE, target: "speed", value: 2, scaling: false, condition: "while in relayform" },
            ],
            otherEffects: [
                "Ignore slowed while in relayform.",
                "Spend 1 focus to gain an advantage when you test Agility, Stealth, or Thievery while in relayform."
            ],
        },
        {
            id: "forms_of_mystery",
            name: "Forms of Mystery",
            description: "Gain decayform and nightform",
            actionCost: Infinity,
            prerequisites: [
                { type: 'talent', target: 'singer_ancestry' },
                { type: 'talent', target: 'singer_change_form' },
                { type: 'talent', target: 'ambitious_mind' },
            ],
            tier: 4,
            bonuses: [],
        },
        {
            id: "decayform",
            name: "Decayform",
            description: "Willpower + 2. You can spend 1 focus or 1 investiture to prevent a character within reach from recovering health or focus.",
            actionCost: Infinity,
            prerequisites: [
                { type: 'talent', target: 'singer_ancestry' },
                { type: 'talent', target: 'singer_change_form' },
                { type: 'talent', target: 'forms_of_mystery' },
                { type: 'talent', target: 'ambitious_mind' },
            ],
            tier: 4,
            bonuses: [
                { type: BonusType.ATTRIBUTE, target: "willpower", value: 2, scaling: false, condition: "while in decayform" },
            ],
            otherEffects: [
                "You can spend 1 focus or 1 investiture to prevent a character within reach from recovering health or focus while in decayform."
            ],
        },
        {
            id: "nightform",
            name: "Nightform",
            description:"Awareness + 1, Intellect + 1, focus + 2. You revceive unpredictable glimpses of the future. Preroll two d20s each session, which you can use to replcae enemy and ally d20 rolls.",
            actionCost: Infinity,
            prerequisites: [
                { type: 'talent', target: 'singer_ancestry' },
                { type: 'talent', target: 'singer_change_form' },
                { type: 'talent', target: 'forms_of_mystery' },
                { type: 'talent', target: 'ambitious_mind' },
            ],
            tier: 4,
            bonuses: [
                { type: BonusType.ATTRIBUTE, target: "awareness", value: 1, scaling: false, condition: "while in nightform" },
                { type: BonusType.ATTRIBUTE, target: "intellect", value: 1, scaling: false, condition: "while in nightform" },
                { type: BonusType.ATTRIBUTE, target: "focus", value: 2, scaling: false, condition: "while in nightform" },
            ],
            otherEffects: [
                "You receive unpredictable glimpses of the future. Preroll two d20s each session, which you can use to replace enemy and ally d20 rolls while in nightform."
            ],
        },
    ]
};