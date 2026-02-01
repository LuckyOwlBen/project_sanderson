import { TalentTree, ActionCostCode } from "../../talentInterface";
import { BonusType } from "../../../bonuses/bonusModule";

export const OFFICER_TALENT_TREE: TalentTree = {
    pathName: 'Officer',
    nodes: [
        {
            id: "composed",
            name: "Composed",
            description: "When you acquire this talent, your maximum and current focus increase by a number equal to your tier. When your tier increases by 1, your maximum and current focus do as well.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'decisive_command' }
            ],
            tier: 1,
            bonuses: [
                {
                    type: BonusType.RESOURCE,
                    target: 'focus',
                    value: 1
                }
            ],
            otherEffects: []
        },
        {
            id: "through_the_fray",
            name: "Through the Fray",
            description: "Choose an ally you can influence within 20 feet of you. Before the end of your turn, they can use the Disengage or Gain Advantage action as a reaction.",
            actionCost: 1,
            prerequisites: [
                { type: 'skill', target: 'persuasion', value: 1 },
                { type: 'talent', target: 'decisive_command' }
            ],
            tier: 1,
            bonuses: [],
            actionGrants: [
                {
                    type: 'reaction',
                    count: 1,
                    timing: 'always',
                    restrictedTo: 'Disengage or Gain Advantage action'
                }
            ],
            otherEffects: ["Target ally must be within 20 feet and under your influence"]
        },
        {
            id: "customary_garb",
            name: "Customary Garb",
            description: "While you're visibly wearing Presentable armor or clothing appropriate for your station, your Physical and Spiritual defenses increase by 2.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'through_the_fray' }
            ],
            tier: 2,
            bonuses: [
                {
                    type: BonusType.DEFENSE,
                    value: 2,
                    target: 'Physical',
                    condition: 'While wearing Presentable armor or appropriate clothing'
                },
                {
                    type: BonusType.DEFENSE,
                    value: 2,
                    target: 'Spiritual',
                    condition: 'While wearing Presentable armor or appropriate clothing'
                }
            ],
            otherEffects: []
        },
        {
            id: "well_supplied",
            name: "Well Supplied",
            description: "When you make a test to requisition or allocate resources, you can spend 2 focus to add an Opportunity to the result. Additionally, when you acquire this talent, gain a utility expertise in Military Logistics.",
            actionCost: ActionCostCode.Special,
            specialActivation: "When making test to requisition or allocate resources",
            prerequisites: [
                { type: 'skill', target: 'persuasion', value: 2 },
                { type: 'talent', target: 'composed' }
            ],
            tier: 2,
            bonuses: [],
            resourceTriggers: [
                {
                    resource: 'focus',
                    effect: 'spend',
                    amount: 2,
                    trigger: 'when making test to requisition or allocate resources',
                    condition: 'to add Opportunity to result'
                }
            ],
            expertiseGrants: [
                {
                    type: 'fixed',
                    expertises: ['Military Logistics']
                }
            ],
            otherEffects: []
        },
        {
            id: "confident_command",
            name: "Confident Command",
            description: "Before you make an Intimidation, Leadership, or Persuasion test, you can spend 1 focus to roll your command die and add the result to your d20 roll. Additionally, when you acquire this talent, increase the size of your command die by one size (such as from a d4 to a d6).",
            actionCost: ActionCostCode.Special,
            specialActivation: "Before Intimidation, Leadership, or Persuasion test",
            prerequisites: [
                { type: 'skill', target: 'leadership', value: 2 },
                { type: 'talent', target: 'customary_garb' }
            ],
            tier: 3,
            bonuses: [
                {
                    type: BonusType.DEFENSE,
                    target: 'command-die',
                    value: 1
                }
            ],
            resourceTriggers: [
                {
                    resource: 'focus',
                    effect: 'spend',
                    amount: 1,
                    trigger: 'before Intimidation, Leadership, or Persuasion test',
                    condition: 'to add command die result to roll'
                }
            ],
            otherEffects: []
        },
        {
            id: "relentless_march",
            name: "Relentless March",
            description: "After you use your Decisive Command on an ally, until the end of their next turn, their movement rate increases by 10 feet and they ignore the effects of the Exhausted, Slowed, and Surprised conditions.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'skill', target: 'persuasion', value: 3 },
                { type: 'talent', target: 'confident_command' }
            ],
            tier: 3,
            bonuses: [],
            movementEffects: [
                {
                    type: 'increase-rate',
                    amount: 10,
                    timing: 'always',
                    movementType: 'walk'
                }
            ],
            conditionEffects: [
                {
                    type: 'prevent',
                    condition: 'Exhausted',
                    trigger: 'after using Decisive Command on ally',
                    target: 'all-allies',
                    duration: 'until end of their next turn'
                },
                {
                    type: 'prevent',
                    condition: 'Slowed',
                    trigger: 'after using Decisive Command on ally',
                    target: 'all-allies',
                    duration: 'until end of their next turn'
                },
                {
                    type: 'prevent',
                    condition: 'Surprised',
                    trigger: 'after using Decisive Command on ally',
                    target: 'all-allies',
                    duration: 'until end of their next turn'
                }
            ],
            otherEffects: []
        },
        {
            id: "authority",
            name: "Authority",
            description: "Your Leader talents that affect allies now have double the range (if they had one) and can affect up to twice as many allies as usual.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'confident_command' }
            ],
            tier: 4,
            bonuses: [],
            otherEffects: ["Requires title granting command over at least 5 people"],
            specialActivation: "Requires title granting command over at least 5 people"
        },
        {
            id: "synchronized_assault",
            name: "Synchronized Assault",
            description: "Spend 2 focus to make a Leadership test against the Cognitive defense of an enemy you can sense. On a success, choose a number of allies up to your ranks in Leadership. On a failure, choose one ally you can influence. On the next turn of each of your chosen allies, they gain 1 action that can be spent only to Strike against that enemy. This Strike doesn't count against their allowed number of Strike actions for the hands holding that weapon.",
            actionCost: 3,
            prerequisites: [
                { type: 'skill', target: 'leadership', value: 3 },
                { type: 'talent', target: 'authority' }
            ],
            tier: 4,
            bonuses: [],
            resourceTriggers: [
                {
                    resource: 'focus',
                    effect: 'spend',
                    amount: 2,
                    trigger: 'when using Synchronized Assault',
                    condition: 'to make Leadership test'
                }
            ],
            actionGrants: [
                {
                    type: 'action',
                    count: 1,
                    timing: 'start-of-turn',
                    restrictedTo: 'Strike against target enemy only (does not count against Strike action limit)'
                }
            ],
            otherEffects: ["Test Leadership vs Cognitive defense", "Success: choose up to Leadership rank allies", "Failure: choose 1 ally"]
        }
    ],
}