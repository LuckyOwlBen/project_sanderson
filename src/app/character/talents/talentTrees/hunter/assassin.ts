import { TalentTree, ActionCostCode } from "../../talentInterface";
import { BonusType } from "../../../bonuses/bonusModule";

export const ASSASSIN_TALENT_TREE: TalentTree = {
    pathName: 'Assassin',
    nodes: [
        {
            id: "killing_edge",
            name: "Killing Edge",
            description: "When you acquire this talent, gain weapon expertises in Knives and Slings. Additionally, while you wield a knife or sling, it also has the Deadly and Quickdraw expert traits for you.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'skill', target: 'perception', value: 2 },
                { type: 'talent', target: 'seek_quarry' }
            ],
            tier: 1,
            bonuses: [],
            otherEffects: ["Gain Knives weapon expertise", "Gain Slings weapon expertise", "Knives and slings gain Deadly and Quickdraw traits"]
        },
        {
            id: "startling_blow",
            name: "Startling Blow",
            description: "Make an unarmed or improvised weapon attack against the Cognitive defense of a target of your size or smaller. On a hit or graze, the target also becomes Surprised until the end of your next turn.",
            actionCost: 1,
            prerequisites: [
                { type: 'skill', target: 'stealth', value: 1 },
                { type: 'talent', target: 'seek_quarry' }
            ],
            tier: 1,
            bonuses: [],
            otherEffects: ["Attack unarmed/improvised weapon vs Cognitive defense", "On hit or graze, target becomes Surprised until end of next turn", "Only works on targets of same size or smaller"]
        },
        {
            id: "shadowing",
            name: "Shadowing",
            description: "You gain an advantage on tests to avoid being sensed by your quarry, and your quarry gains a disadvantage on tests to sense you. Additionally, when you succeed on a test against an enemy's Spiritual defense while you're in cover or an area where your target's senses are obscured, you can spend 3 focus to designate that target as your quarry for your Seek Quarry talent.",
            actionCost: ActionCostCode.Special,
            specialActivation: "Special activation for marking quarry when succeeding on test vs Spiritual defense while in cover",
            prerequisites: [
                { type: 'skill', target: 'stealth', value: 2 },
                { type: 'talent', target: 'killing_edge' }
            ],
            tier: 2,
            bonuses: [],
            grantsAdvantage: ["avoid_being_sensed_by_quarry"],
            otherEffects: ["Quarry has disadvantage on tests to sense you", "While in cover/obscured, can spend 3 focus after succeeding vs Spiritual to mark target as quarry"]
        },
        {
            id: "cold_eyes",
            name: "Cold Eyes",
            description: "After you kill or incapacitate an enemy who is your quarry, you recover 1 focus and can designate another enemy you can sense as your quarry for your Seek Quarry talent.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'shadowing' }
            ],
            tier: 3,
            bonuses: [],
            otherEffects: ["After killing/incapacitating quarry, recover 1 focus and designate new quarry"]
        },
        {
            id: "fatal_thrust",
            name: "Fatal Thrust",
            description: "Using a light weapon, make a melee attack against the Cognitive defense of a target who is Surprised, doesn't sense you, or doesn't view you as a threat. If this weapon has the Discreet trait, you gain two advantages on the test. When you roll damage for this attack, add an extra 4d4 damage, then count the number of your damage dice that rolled their maximum value. For each die that rolled its maximum, your target must subtract 2 from any injury roll they make for that attack. Scales with tier: tier 3 (6d4), tier 4 (8d4), tier 5 (10d4).",
            actionCost: 2,
            prerequisites: [
                { type: 'skill', target: 'perception', value: 3 },
                { type: 'talent', target: 'startling_blow' }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: ["Attack vs Cognitive defense with light weapon against Surprised/unaware target", "Discreet weapon grants two advantages", "Add 4d4 damage (6d4 at tier 3, 8d4 at tier 4, 10d4 at tier 5)", "Each max die roll subtracts 2 from target's injury roll"]
        },
        {
            id: "mighty",
            name: "Mighty",
            description: "When you hit with a weapon or unarmed attack, for each action you used on that attack's action, increase the damage you deal by 1 + your tier.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'cold_eyes' }
            ],
            tier: 3,
            bonuses: [],
            otherEffects: ["When hitting with weapon/unarmed attack, each action spent increases damage by 1 + tier"]
        },
        {
            id: "sidestep",
            name: "Sidestep",
            description: "Gain an additional reaction at the start of combat and at the start of each of your turns, which you can use only to Dodge. You can't benefit from this talent while wearing armor with a deflect value of 2 or higher.",
            actionCost: ActionCostCode.Special,
            specialActivation: "Gain additional reaction for Dodge at start of combat and each turn",
            prerequisites: [
                { type: 'skill', target: 'stealth', value: 3 },
                { type: 'talent', target: 'shadowing' }
            ],
            tier: 4,
            bonuses: [],
            otherEffects: ["Gain 1 reaction for Dodge only at combat start and each turn start", "Cannot use while wearing armor with deflect 2+"]
        },
        {
            id: "swift_strikes",
            name: "Swift Strikes",
            description: "Spend 1 focus to make a second Strike action with a hand you already used for a Strike this turn.",
            actionCost: 1,
            prerequisites: [
                { type: 'talent', target: 'cold_eyes' }
            ],
            tier: 4,
            bonuses: [],
            otherEffects: ["Spend 1 focus to Strike again with same hand"]
        }
    ],
}