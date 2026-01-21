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
            expertiseGrants: [
                { type: 'fixed', expertises: ['Knives', 'Slings'] }
            ],
            traitGrants: [
                { targetItems: ['knife', 'sling'], traits: ['Deadly', 'Quickdraw'], expert: true }
            ]
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
            attackDefinition: {
                weaponType: 'unarmed',
                targetDefense: 'Cognitive',
                range: 'melee',
                specialMechanics: [
                    "Can use unarmed or improvised weapon",
                    "On hit or graze: target becomes Surprised until end of your next turn",
                    "Only works on targets of same size or smaller"
                ]
            },
            conditionEffects: [
                { type: 'apply', condition: 'Surprised', trigger: 'on hit or graze', target: 'target', duration: 'end of your next turn', details: 'only works on targets of same size or smaller' }
            ]
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
            grantsDisadvantage: ["quarry_sensing_you"],
            resourceTriggers: [
                { resource: 'focus', effect: 'spend', amount: 3, trigger: 'when succeeding vs Spiritual defense while in cover', condition: 'to designate target as quarry' }
            ],
            otherEffects: ["While in cover/obscured, can mark target as quarry after test vs Spiritual"]
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
            bonuses: [
                { type: BonusType.RESOURCE, target: 'focus_recovery', value: 1, condition: 'after killing/incapacitating quarry' }
            ],
            resourceTriggers: [
                { resource: 'focus', effect: 'recover', amount: 1, trigger: 'after killing/incapacitating quarry' }
            ],
            otherEffects: ["Can designate new enemy as quarry after killing/incapacitating previous quarry"]
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
            attackDefinition: {
                weaponType: 'light',
                targetDefense: 'Cognitive',
                range: 'melee',
                baseDamage: '4d4',
                damageScaling: [
                    { tier: 3, damage: '6d4' },
                    { tier: 4, damage: '8d4' },
                    { tier: 5, damage: '10d4' }
                ],
                conditionalAdvantages: [
                    { condition: 'weapon has Discreet trait', value: 2 }
                ],
                specialMechanics: [
                    "Target must be Surprised, doesn't sense you, or doesn't view you as a threat",
                    "Each max die roll subtracts 2 from target's injury roll"
                ]
            }
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
            bonuses: [
                { type: BonusType.DERIVED, target: 'damage_per_action', formula: '1 + tier', condition: 'per action spent on attack' }
            ]
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
            actionGrants: [
                { type: 'reaction', count: 1, restrictedTo: 'Dodge only', timing: 'start-of-combat', frequency: 'unlimited' },
                { type: 'reaction', count: 1, restrictedTo: 'Dodge only', timing: 'start-of-turn', frequency: 'unlimited' }
            ],
            otherEffects: ["Cannot use while wearing armor with deflect 2+"]
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
            attackDefinition: {
                weaponType: 'any',
                targetDefense: 'Physical',
                range: 'special',
                resourceCost: { type: 'focus', amount: 1 },
                specialMechanics: [
                    "Make a second Strike with a hand already used for Strike this turn"
                ]
            }
        }
    ],
}