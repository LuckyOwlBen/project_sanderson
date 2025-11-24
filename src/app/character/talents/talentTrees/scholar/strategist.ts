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
                { type: 'talent', target: 'erudition' }
            ],
            tier: 1,
            bonuses: [],
            otherEffects: ["Erudition grants +1 skill", "Erudition can select physical skills (non-surge)", "Gain weapon expertise of choice"]
        },
        {
            id: "strategize",
            name: "Strategize",
            description: "After you succeed on a test to Gain Advantage using a skill gained from your Erudition, you can choose an ally you can influence. That ally gains the benefits of your Gain Advantage action instead of you. When you use this talent, you can also spend 2 focus to prevent the target of your Gain Advantage from using reactions against the ally you chose until the end of your next turn.",
            actionCost: ActionCostCode.Special,
            specialActivation: "After succeeding on Gain Advantage with Erudition skill",
            prerequisites: [
                { type: 'skill', target: 'deduction', value: 1 },
                { type: 'talent', target: 'erudition' }
            ],
            tier: 1,
            bonuses: [],
            otherEffects: ["After Gain Advantage with Erudition skill, ally gains benefit instead of you", "Can spend 2 focus to prevent target's reactions against chosen ally until end of next turn"]
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
            otherEffects: ["Increase max and current focus by tier", "Increase focus by 1 when tier increases"]
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
            bonuses: [],
            otherEffects: ["After beginning of each round: +2 to all defenses until start of your turn"]
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
            otherEffects: ["After successful Gain Advantage, target has disadvantage on next test (unless resisted)"]
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
            otherEffects: ["Reaction when ally within 20 feet rolls Complication", "Spend 2 focus to remove Complication from their test"]
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
            otherEffects: ["Once per scene, spend 2 focus", "Test Deduction vs enemy leader's Cognitive defense", "Advantage if took slow turn", "Success: you and allies gain +1 action next turn"]
        }
    ],
}