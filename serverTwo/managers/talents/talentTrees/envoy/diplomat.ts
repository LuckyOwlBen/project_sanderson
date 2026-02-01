import { TalentTree, ActionCostCode } from "../../talentInterface";
import { BonusType } from "../../../bonuses/bonusModule";

export const DIPLOMAT_TALENT_TREE: TalentTree = {
    pathName: 'Diplomat',
    nodes: [
        {
            id: "steadfast_challenge",
            name: "Steadfast Challenge",
            description: "Spend 1 focus to test Discipline vs. an enemy's Spiritual. On success, they are Disoriented and gain a disadvantage on tests against you.",
            actionCost: 1, // 1 action
            prerequisites: [
                { type: 'skill', target: 'discipline', value: 1 }
            ],
            tier: 1,
            bonuses: [],
            resourceTriggers: [
                { resource: 'focus', effect: 'spend', amount: 1, trigger: 'when using this talent', frequency: 'unlimited' }
            ],
            conditionEffects: [
                { type: 'apply', condition: 'Disoriented', trigger: 'on success vs Spiritual defense', target: 'target', duration: 'end of target\'s next turn' }
            ],
            grantsDisadvantage: ['disoriented_target']
        },
        {
            id: "withering_retort",
            name: "Withering Retort",
            description: "Use your Steadfast Challenge before an attack and increase your deflect against the attack by your ranks in Discipline.",
            actionCost: ActionCostCode.Reaction,
            prerequisites: [
                { type: 'skill', target: 'discipline', value: 2 },
                { type: 'talent', target: 'steadfast_challenge' }
            ],
            tier: 2,
            bonuses: [],
            actionGrants: [
                { type: 'reaction', count: 1, timing: 'always', restrictedTo: 'Use Steadfast Challenge before an attack', frequency: 'unlimited' }
            ]
        },
        {
            id: "calm_appeal",
            name: "Calm Appeal",
            description: "When your Steadfast Challenge makes a target Disoriented, spend 1 focus to pacify them. Resisting your Steadfast Challenge costs additional focus equal to your ranks in Discipline.",
            actionCost: ActionCostCode.Special,
            prerequisites: [
                { type: 'skill', target: 'discipline', value: 2 },
                { type: 'talent', target: 'steadfast_challenge' }
            ],
            specialActivation: "Costs 1 focus to pacify Disoriented target. Resisting costs additional focus equal to Discipline ranks.",
            tier: 2,
            bonuses: [],
        },
        {
            id: "peaceful_solution",
            name: "Peaceful Solution",
            description: "If all non-minion enemies are pacified, you ease tensions and end combat.",
            actionCost: ActionCostCode.Reaction,
            prerequisites: [
                { type: 'skill', target: 'discipline', value: 3 },
                { type: 'talent', target: 'calm_appeal' }
            ],
            tier: 3,
            bonuses: [],
            conditionEffects: [
                { type: 'apply', condition: 'Combat Ended', trigger: 'when all non-minion enemies pacified', target: 'self', duration: 'immediate' }
            ]
        },
        {
            id: "collected",
            name: "Collected",
            description: "Increase your Cognitive and Spiritual defenses by 2.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [],
            tier: 1,
            bonuses: [
                { type: BonusType.DEFENSE, target: 'cognitive', value: 2 },
                { type: BonusType.DEFENSE, target: 'spiritual', value: 2 }
            ]
        },
        {
            id: "well_dressed",
            name: "Well Dressed",
            description: "Gain Fashion expertise. While wearing Presentable armor or fashionable clothing, gain an advantage on your first Deception, Leadership, or Persuasion test.",
            actionCost: ActionCostCode.Special,
            prerequisites: [
                { type: 'talent', target: 'steadfast_challenge' },
            ],
            specialActivation: "While wearing Presentable armor or fashionable clothing, gain an advantage on your first Deception, Leadership, or Persuasion test.",
            tier: 2,
            bonuses: [],
            grantsAdvantage: ["deception_first", "leadership_first", "persuasion_first"],
            expertiseGrants: [
                { type: 'fixed', expertises: ['Fashion'] }
            ]
        },
        {
            id: "high_society_contacts",
            name: "High Society Contacts",
            description: "Gain High Society expertise. Spend 2 focus to add additional effects to a test to interact in high society.",
            actionCost: 1,
            prerequisites: [
                { type: 'talent', target: 'well_dressed'}
            ],
            tier: 2,
            bonuses: [],
            expertiseGrants: [
                { type: 'fixed', expertises: ['High Society'] }
            ],
            resourceTriggers: [
                { resource: 'focus', effect: 'spend', amount: 2, trigger: 'to add additional effects in high society interactions', frequency: 'unlimited' }
            ]
        },
        {
            id: "practiced_oratory",
            name: "Practiced Oratory",
            description: "When you use Rousing Presence or Steadfast Challenge, spend focus up to your ranks in Persuasion to add that many targets.",
            actionCost: ActionCostCode.Special,
            specialActivation: "Spend focus up to Persuasion ranks to add additional targets to Rousing Presence or Steadfast Challenge.",
            prerequisites: [
                { type: 'skill', target: 'persuasion', value: 3 },
                { type: 'talent', target: 'practiced_oratory' }
            ],
            tier: 2,
            bonuses: [],
            resourceTriggers: [
                { resource: 'focus', effect: 'spend', amount: 'persuasion_ranks', trigger: 'when using Rousing Presence or Steadfast Challenge', frequency: 'unlimited', condition: 'to add additional targets (max = Persuasion ranks)' }
            ]
        }
    ],
}