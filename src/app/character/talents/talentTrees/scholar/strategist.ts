import { TalentTree, ActionCostCode } from "../../talentInterface";
import { BonusType } from "../../../bonuses/bonusModule";

export const STRATEGIST_TALENT_TREE: TalentTree = {
    pathName: 'Strategist',
    nodes: [
        {
            id: "mind_and_body",
            name: "Mind and Body",
            description: "When you acquire this talent, your Erudition talent grants you an additional skill, and you can use Erudition to choose physical skills that aren't surges. Additionally, gain one weapon expertise of your choice.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'education' }
            ],
            tier: 1,
            bonuses: [],
            expertiseGrants: [
                { type: 'choice', options: ['weapon'] }
            ],
            otherEffects: ["Erudition grants +1 skill", "Erudition can select physical skills (non-surge)"]
        },
        {
            id: "strategize",
            name: "Strategize",
            description: "After you succeed on a test to Gain Advantage using a skill gained from your Erudition, you can choose an ally you can influence. That ally gains the benefits of your Gain Advantage action instead of you. When you use this talent, you can also spend 2 focus to prevent the target of your Gain Advantage from using reactions against the ally you chose until the end of your next turn.",
            actionCost: ActionCostCode.Special,
            specialActivation: "After succeeding on Gain Advantage with Erudition skill",
            prerequisites: [
                { type: 'skill', target: 'deduction', value: 1 },
                { type: 'talent', target: 'education' }
            ],
            tier: 1,
            bonuses: [],
            resourceTriggers: [
                { resource: 'focus', effect: 'spend', amount: 2, trigger: 'when using this talent', frequency: 'unlimited', condition: 'prevent target reactions against chosen ally' }
            ],
            otherEffects: ["After Gain Advantage with Erudition skill, ally gains benefit instead of you"]
        },
        {
            id: "composed",
            name: "Composed",
            description: "When you acquire this talent, your maximum and current focus increase by a number equal to your tier. When your tier increases by 1, your maximum and current focus do as well.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'strategize' }
            ],
            tier: 2,
            bonuses: [],
            resourceTriggers: [
                { resource: 'focus', effect: 'recover', amount: 'tier', trigger: 'on talent acquisition', frequency: 'once-per-scene', condition: 'max and current focus increase' },
                { resource: 'focus', effect: 'recover', amount: 1, trigger: 'when tier increases', frequency: 'unlimited', condition: 'max and current focus increase' }
            ]
        },
        {
            id: "know_your_moment",
            name: "Know Your Moment",
            description: "After the beginning of each round, each of your defenses increases by 2 until the start of your turn.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'skill', target: 'deduction', value: 2 },
                { type: 'talent', target: 'mind_and_body' }
            ],
            tier: 2,
            bonuses: [
                { type: BonusType.DEFENSE, target: 'physical', value: 2, condition: 'after round beginning until start of your turn' },
                { type: BonusType.DEFENSE, target: 'cognitive', value: 2, condition: 'after round beginning until start of your turn' },
                { type: BonusType.DEFENSE, target: 'spiritual', value: 2, condition: 'after round beginning until start of your turn' }
            ],
            otherEffects: []
        },
        {
            id: "deep_contemplation",
            name: "Deep Contemplation",
            description: "Reassign up to 2 of the skills and expertises gained from your Erudition.",
            actionCost: 2,
            prerequisites: [
                { type: 'skill', target: 'lore', value: 2 },
                { type: 'talent', target: 'composed' }
            ],
            tier: 3,
            bonuses: [],
            otherEffects: ["Reassign up to 2 skills/expertises from Erudition"]
        },
        {
            id: "keen_insight",
            name: "Keen Insight",
            description: "After you succeed on a test to Gain Advantage, you exploit one of your target's crucial traits, strengths, or flaws. Unless the target resists your influence, they gain a disadvantage on their next test during this encounter.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'deep_contemplation' }
            ],
            tier: 3,
            bonuses: [],
            conditionEffects: [
                { type: 'apply', condition: 'disadvantage', trigger: 'after successful Gain Advantage', target: 'target', duration: 'until end of encounter', details: 'on next test unless resisted' }
            ]
        },
        {
            id: "contingency",
            name: "Contingency",
            description: "After an ally you can influence within 20 feet of you rolls a Complication, you can use this reaction and spend 2 focus to remove a Complication from their test.",
            actionCost: ActionCostCode.Reaction,
            prerequisites: [
                { type: 'skill', target: 'lore', value: 3 },
                { type: 'talent', target: 'composed' }
            ],
            tier: 4,
            bonuses: [],
            actionGrants: [
                { type: 'reaction', count: 1, restrictedTo: 'after ally rolls Complication' }
            ],
            resourceTriggers: [
                { resource: 'focus', effect: 'spend', amount: 2, trigger: 'when using this reaction', frequency: 'unlimited' }
            ],
            otherEffects: ["Remove Complication from ally's test"]
        },
        {
            id: "turning_point",
            name: "Turning Point",
            description: "Once per scene, you can spend 2 focus to find a weakness in an opposing group's strategy. Make a Deduction test against the Cognitive defense of the top-ranking enemy leader in this scene; to target this leader, you must be able to sense them. If you took a slow turn, you gain an advantage on this test. On a success, you and your allies you can influence gain an additional action on your next turns.",
            actionCost: 2,
            prerequisites: [
                { type: 'skill', target: 'deduction', value: 3 },
                { type: 'talent', target: 'contingency' }
            ],
            tier: 4,
            bonuses: [],
            resourceTriggers: [
                { resource: 'focus', effect: 'spend', amount: 2, trigger: 'when using this talent', frequency: 'once-per-scene' }
            ],
            actionGrants: [
                { type: 'action', count: 1, restrictedTo: 'you and influenced allies', frequency: 'once-per-scene' }
            ],
            otherEffects: ["Test Deduction vs enemy leader's Cognitive defense", "Advantage if took slow turn"]
        }
    ],
}
