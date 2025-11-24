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
            otherEffects: ["Costs 1 focus", "Test Discipline vs enemy Spiritual defense", "On success: target is Disoriented and has disadvantage on tests against you"]
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
            otherEffects: ["When using Steadfast Challenge before an attack, gain deflect equal to Discipline ranks against that attack"]
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
            otherEffects: ["End combat if all non-minion enemies are pacified"]
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
            tier: 1,
            bonuses: [],
            grantsAdvantage: ["deception_first", "leadership_first", "persuasion_first"],
            otherEffects: ["Gain Fashion expertise"]
        },
        {
            id: "high_society_contacts",
            name: "High Society Contacts",
            description: "Gain High Society expertise. Spend 2 focus to add additional effects to a test to interact in high society.",
            actionCost: 1,
            prerequisites: [
                { type: 'talent', target: 'well_dressed'}
            ],
            tier: 1,
            bonuses: [],
            otherEffects: ["Gain High Society expertise", "Spend 2 focus for additional effects in high society interactions"]
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
            otherEffects: ["Spend focus up to Persuasion ranks to add additional targets to Rousing Presence or Steadfast Challenge"]
        }
    ],
}