import { TalentTree } from "../../talentInterface";

export const INVESTIGATOR_TALENT_TREE: TalentTree = {
    pathName: "Investigator",
    nodes: [
        {
            id: "watchfulEye",
            name: "Watchful Eye",
            description: "Use Opportunist on the plot die of a willing ally within 20 feet.",
            actionCost: -1, // Reaction
            prerequisites: [
                { type: 'skill', target: 'Deduction', value: 1 },
            ],
            tier: 1,
            bonuses: [],
            otherEffects: ["Can use Opportunist on the plot die of a willing ally within 20 feet."],
        },
        {
            id:"getEmTalking",
            name: "Get 'Em Talking",
            description: "Spend 1 focus to test Deduction vs. Spiritual to learn the target's motivation. During this scene, you cna raise the stakes on tests to leverage this motivation.",
            actionCost: 2, // 2 actions
            prerequisites: [
                { type: 'skill', target: 'Insight', value: 2}
            ],
            tier: 1,
            bonuses: [],
            otherEffects: ["Spend 1 focus to test Deduction vs. Spiritual to learn the target's motivation. During this scene, you can raise the stakes on tests to leverage this motivation."],
        },
        {
            id: "quickAnalysis",
            name: "Quick Analysis",
            description: "Spend 2 focus to gain 2 action points for cognitive tests with use as skill, Gain Advantage, or an agent talent.",
            actionCost: 0, // Free
            prerequisites: [
                { type: 'talent', target: 'watchfulEye' },
            ],
            tier: 2,
            bonuses: [],
            otherEffects: ["Spend 2 focus to gain 2 action points for cognitive tests with use as skill, Gain Advantage, or an agent talent."],
        },
        {
            id: "baleful",
            name: "Baleful",
            description: "To resist your influence, a character must spend additional focus equal to your tier.",
            actionCost: Infinity, // Passive
            prerequisites: [
                { type: 'talent', target: 'Get \'Em Talking' },
            ],
            tier: 2,
            bonuses: [],
            otherEffects: ["To resist your influence, a character must spend additional focus equal to your tier."],
        },
        {
            id: "gatherEvidence",
            name: "Gather Evidence",
            description: "Gain Legal codes expertise. When you succeed on a cognitive test against a target, you become focused.",
            actionCost: Infinity, // Passive
            prerequisites: [
                { type: 'talent', target: 'quickAnalysis' },
                { type: 'skill', target: 'Insight', value: 2 },
            ],
            tier: 3,
            bonuses: [],
            otherEffects: ["Gain Legal codes expertise. When you succeed on a cognitive test against a target, you become focused."],
        },
        {
            id: "hardy",
            name: "Hardy",
            description: "Gain +1 max health per level(Including previous levels).",
            actionCost: Infinity, // Passive
            prerequisites: [
                { type: 'talent', target: 'baleful', operator: 'OR' },
                {type: 'talent', target: 'sleuthsInstincts', operator: 'OR' },
            ],
            tier: 3,
            bonuses: [],
            otherEffects: ["Gain +1 max health per level(Including previous levels)."],
        },
        {
            id: "sleuth'sInstincts",
            name: "Sleuth's Instincts",
            description: "Gain an advantage on cognitive tests against characters whose motiviation you know. You know when those characters lie to you.",
            actionCost: Infinity, // Passive
            prerequisites: [
                { type: 'talent', target: 'gatherEvidence' },
                { type: 'skill', target: 'Deduction', value: 3 },
            ],
            tier: 4,
            bonuses: [],
            otherEffects: ["Gain an advantage on cognitive tests against characters whose motivation you know. You know when those characters lie to you."
            ],
        },
        {
            id: "closeTheCase",
            name: "Close the Case",
            description: " Spend 3 focus to test Deduction vs. Cognitive, gaining an advantage if you know the target's motivation. On failure, the target gains an advantage against you. On success, they back donwn.",
            actionCost: 3, // 3 actions
            prerequisites: [
                { type: 'talent', target: 'sleuthsInstincts' },
                { type: 'skill', target: 'Deduction', value: 3 },
            ],
            tier: 4,
            bonuses: [],
            otherEffects: [" Spend 3 focus to test Deduction vs. Cognitive, gaining an advantage if you know the target's motivation. On failure, the target gains an advantage against you. On success, they back down."],
        },
    ],
}