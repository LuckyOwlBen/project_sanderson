import { TalentTree, ActionCostCode } from "../../talentInterface";
import { BonusType } from "../../../bonuses/bonusModule";

export const POLITICO_TALENT_TREE: TalentTree = {
    pathName: 'Politico',
    nodes: [
        {
            id: "cutthroat_tactics",
            name: "Cutthroat Tactics",
            description: "Before an ally rolls your command die on a test, they can choose to instead raise the stakes on that test. If they do so and roll a Complication, you recover 1 focus.",
            actionCost: ActionCostCode.Special,
            specialActivation: "Ally chooses to raise stakes before rolling command die",
            prerequisites: [
                { type: 'skill', target: 'deception', value: 1 },
                { type: 'talent', target: 'decisive_command' }
            ],
            tier: 1,
            bonuses: [],
            resourceTriggers: [
                {
                    resource: 'focus',
                    effect: 'recover',
                    amount: 1,
                    trigger: 'when ally rolls Complication on raised stakes test',
                    condition: 'if ally chose to raise stakes on command die test'
                }
            ],
            otherEffects: []
        },
        {
            id: "tactical_ploy",
            name: "Tactical Ploy",
            description: "Make a Deception test against the Cognitive defense of an enemy you can influence. On a success, your target loses one reaction and gains a disadvantage on their next cognitive or spiritual test. A target can resist this influence, but after they do, you gain an advantage on your next test targeting them before the end of your next turn.",
            actionCost: 1,
            prerequisites: [
                { type: 'talent', target: 'decisive_command' }
            ],
            tier: 1,
            bonuses: [],
            attackDefinition: {
                weaponType: 'unarmed',
                targetDefense: 'Cognitive',
                range: 'special',
                specialMechanics: [
                    "Uses Deception test",
                    "Success: target loses 1 reaction and has disadvantage on next Cognitive/Spiritual test",
                    "If target resists: gain advantage on next test vs them until end of your next turn"
                ]
            },
            otherEffects: []
        },
        {
            id: "rumormonger",
            name: "Rumormonger",
            description: "When you make a test to spread misinformation or gather rumors, you can spend 2 focus to add an Opportunity to the result. Additionally, when you acquire this talent, gain a utility expertise in Scandal.",
            actionCost: ActionCostCode.Special,
            specialActivation: "When making test to spread misinformation or gather rumors",
            prerequisites: [
                { type: 'talent', target: 'cutthroat_tactics' }
            ],
            tier: 2,
            bonuses: [],
            resourceTriggers: [
                {
                    resource: 'focus',
                    effect: 'spend',
                    amount: 2,
                    trigger: 'when making test to spread misinformation or gather rumors',
                    condition: 'to add Opportunity to result'
                }
            ],
            expertiseGrants: [
                {
                    type: 'fixed',
                    expertises: ['Scandal']
                }
            ],
            otherEffects: ["Requires having a patron"]
        },
        {
            id: "well_dressed",
            name: "Well Dressed",
            description: "While visibly wearing Presentable armor or fashionable clothing, you gain an advantage on the first Deception, Leadership, or Persuasion test you make during each scene. Additionally, when you acquire this talent, gain a cultural expertise in Fashion.",
            actionCost: ActionCostCode.Special,
            specialActivation: "Advantage on first social test per scene while well-dressed",
            prerequisites: [
                { type: 'talent', target: 'rumormonger' }
            ],
            tier: 2,
            bonuses: [
                {
                    type: BonusType.SKILL,
                    target: 'Deception',
                    value: 1
                },
                {
                    type: BonusType.SKILL,
                    target: 'Leadership',
                    value: 1
                },
                {
                    type: BonusType.SKILL,
                    target: 'Persuasion',
                    value: 1
                }
            ],
            expertiseGrants: [
                {
                    type: 'fixed',
                    expertises: ['Fashion']
                }
            ],
            otherEffects: []
        },
        {
            id: "baleful",
            name: "Baleful",
            description: "To resist your influence, a character must spend additional focus equal to your tier.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'rumormonger' }
            ],
            tier: 3,
            bonuses: [],
            resourceTriggers: [
                {
                    resource: 'focus',
                    effect: 'spend',
                    amount: 'tier',
                    trigger: 'when character resists your influence',
                    frequency: 'unlimited'
                }
            ],
            otherEffects: []
        },
        {
            id: "set_at_odds",
            name: "Set at Odds",
            description: "Choose two or more characters you can influence and spend that many focus to seed division among them. Describe a potential source of conflict, then make a Leadership test (DC equals highest Spiritual defense among those targets). On a success, you influence each target to become hostile toward the other targets, which sparks an argument, combat, or other conflict until they find a way to resolve it. A target can resist this influence, but after they do, they lose additional focus equal to your ranks in Leadership. If only some of the targets resist influence, the others remain hostile, but their conflict might become easier to resolve.",
            actionCost: 2,
            prerequisites: [
                { type: 'skill', target: 'leadership', value: 3 },
                { type: 'talent', target: 'baleful' }
            ],
            tier: 3,
            bonuses: [],
            resourceTriggers: [
                {
                    resource: 'focus',
                    effect: 'spend',
                    amount: 'number of chosen targets',
                    trigger: 'when using Set at Odds',
                    condition: 'to seed division'
                },
                {
                    resource: 'focus',
                    effect: 'spend',
                    amount: 'Leadership ranks',
                    trigger: 'when target resists influence',
                    condition: 'additional cost for resisting'
                }
            ],
            conditionEffects: [
                {
                    type: 'apply',
                    condition: 'Hostile',
                    trigger: 'on successful Leadership test against highest Spiritual defense',
                    target: 'all-enemies',
                    duration: 'until they find way to resolve conflict'
                }
            ],
            otherEffects: []
        },
        {
            id: "shrewd_command",
            name: "Shrewd Command",
            description: "Before you make a Deception, Insight, or Leadership test, you can spend 1 focus to roll your command die and add the result to your d20 roll. Additionally, when you acquire this talent, increase the size of your command die by one size (such as from a d4 to a d6).",
            actionCost: ActionCostCode.Special,
            specialActivation: "Before Deception, Insight, or Leadership test",
            prerequisites: [
                { type: 'skill', target: 'leadership', value: 2 },
                { type: 'talent', target: 'rumormonger' }
            ],
            tier: 4,
            bonuses: [
                {
                    type: BonusType.DEFENSE,
                    target: 'command-die',
                    value: 1,
                    condition: 'increase by one die size (d4→d6, d6→d8, etc.)'
                }
            ],
            resourceTriggers: [
                {
                    resource: 'focus',
                    effect: 'spend',
                    amount: 1,
                    trigger: 'before Deception, Insight, or Leadership test',
                    condition: 'to add command die result to roll'
                }
            ],
            otherEffects: []
        },
        {
            id: "grand_deception",
            name: "Grand Deception",
            description: "Spend 3 focus to make a DC 15 Deception test. On a success, choose a detail you established since the start of the last scene and reveal that it was actually a ruse. This ruse must be plausible. The GM is the final arbiter of what sort of ruse you can reveal.",
            actionCost: 3,
            prerequisites: [
                { type: 'skill', target: 'deception', value: 3 },
                { type: 'talent', target: 'shrewd_command' }
            ],
            tier: 4,
            bonuses: [],
            resourceTriggers: [
                {
                    resource: 'focus',
                    effect: 'spend',
                    amount: 3,
                    trigger: 'when using Grand Deception',
                    condition: 'to make DC 15 Deception test'
                }
            ],
            otherEffects: ["Must be plausible", "GM determines final validity of ruse"]
        }
    ],
}