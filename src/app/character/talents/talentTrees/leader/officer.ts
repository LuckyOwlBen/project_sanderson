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
            bonuses: [],
            otherEffects: ["Increase max and current focus by tier", "Increase focus by 1 when tier increases"]
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
            otherEffects: ["Target ally within 20 feet can use Disengage or Gain Advantage as reaction before end of your turn"]
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
            bonuses: [],
            otherEffects: ["While wearing Presentable armor or appropriate clothing: +2 Physical and Spiritual defenses"]
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
            otherEffects: ["Spend 2 focus to add Opportunity to requisition/allocation tests", "Gain Military Logistics utility expertise"]
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
            bonuses: [],
            otherEffects: ["Spend 1 focus to add command die to Intimidation/Leadership/Persuasion test", "Increase command die size by one (d4→d6, d6→d8, etc.)"]
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
            otherEffects: ["After using Decisive Command on ally: +10 movement and ignore Exhausted/Slowed/Surprised until end of next turn"]
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
            otherEffects: ["Double range of Leader talents affecting allies", "Double number of allies affected by Leader talents"],
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
            otherEffects: ["Spend 2 focus, test Leadership vs Cognitive", "Success: choose Leadership rank allies; Failure: choose 1 ally", "Chosen allies gain 1 action next turn for Strike only (doesn't count against Strike limit)"]
        }
    ],
}