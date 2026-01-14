import { TalentTree, ActionCostCode } from "../../talentInterface";
import { BonusType } from "../../../bonuses/bonusModule";

export const SOLDIER_TALENT_TREE: TalentTree = {
    pathName: 'Soldier',
    nodes: [
        {
            id: "cautious_advance",
            name: "Cautious Advance",
            description: "Move up to half your movement rate, ignoring difficult terrain, then gain an action that can be spent only on the Brace or Gain Advantage actions.",
            actionCost: 2,
            prerequisites: [
                { type: 'skill', target: 'discipline', value: 1 },
                { type: 'talent', target: 'vigilant_stance' }
            ],
            tier: 1,
            bonuses: [],
            otherEffects: ["Move half movement rate (ignore difficult terrain)", "Gain 1 action for Brace or Gain Advantage only"]
        },
        {
            id: "combat_training",
            name: "Combat Training",
            description: "Once per round, when you miss on a weapon attack, you can graze one target without spending focus. Additionally, when you acquire this talent, gain a weapon expertise and an armor expertise of your choice, and gain a cultural expertise in Military Life.",
            actionCost: ActionCostCode.Special,
            specialActivation: "Once per round when you miss on weapon attack",
            prerequisites: [
                { type: 'talent', target: 'vigilant_stance' }
            ],
            tier: 1,
            bonuses: [],
            expertiseGrants: [
                { type: 'category', choiceCount: 1, category: 'weapon' },
                { type: 'category', choiceCount: 1, category: 'armor' },
                { type: 'fixed', expertises: ['Military Life'] }
            ],
            otherEffects: ["Once per round: can graze on miss without spending focus", "Gain weapon expertise", "Gain armor expertise", "Gain Military Life cultural expertise"]
        },
        {
            id: "defensive_position",
            name: "Defensive Position",
            description: "The Brace action adds two disadvantages to attacks against you, instead of one. Additionally, while you're using a shield to Brace, allies within 5 feet of you can Brace as if they had cover or a shield.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'skill', target: 'athletics', value: 2 },
                { type: 'talent', target: 'cautious_advance' }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: ["Brace adds 2 disadvantages instead of 1", "When Bracing with shield, allies within 5 feet can Brace as if they had cover/shield"]
        },
        {
            id: "devastating_blow",
            name: "Devastating Blow",
            description: "Make a melee weapon attack against the Physical defense of a target. When you roll damage for this attack, add an extra 2d8 damage. This talent becomes more powerful as your tier increases: at tier 3, you roll an extra 3d8 damage (instead of 2d8); at tier 4, you instead roll an extra 4d8 damage; and at tier 5, you instead roll an extra 5d8 damage.",
            actionCost: 2,
            prerequisites: [
                { type: 'skill', target: 'athletics', value: 3 },
                { type: 'talent', target: 'combat_training' }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: ["Melee attack vs Physical with extra damage", "Extra damage: 2d8 (3d8 at T3, 4d8 at T4, 5d8 at T5)"]
        },
        {
            id: "formation_drills",
            name: "Formation Drills",
            description: "While an ally within 10 feet of you benefits from the Brace action, they also benefit from your Defensive Position as if they had that talent themself.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'skill', target: 'discipline', value: 2 },
                { type: 'talent', target: 'defensive_position' }
            ],
            tier: 3,
            bonuses: [],
            otherEffects: ["Allies within 10 feet using Brace also gain your Defensive Position benefits"]
        },
        {
            id: "hardy",
            name: "Hardy",
            description: "When you acquire this talent, your maximum and current health increase by 1 per level. This applies to all previous and future levels.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'combat_training' }
            ],
            tier: 3,
            bonuses: [],
            otherEffects: ["Increase max and current health by 1 per level (retroactive and future)"]
        },
        {
            id: "swift_strikes",
            name: "Swift Strikes",
            description: "Spend 1 focus to make a second Strike action with a hand you already used for a Strike this turn.",
            actionCost: 1,
            prerequisites: [
                { type: 'talent', target: 'hardy' }
            ],
            tier: 4,
            bonuses: [],
            otherEffects: ["Spend 1 focus to Strike again with same hand"]
        },
        {
            id: "wary",
            name: "Wary",
            description: "While you have 1 or more focus, you can't be Surprised. Additionally, when you resist influence or lose focus involuntarily, reduce the amount of focus lost by your ranks in Discipline (to a minimum of 1 focus lost).",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'skill', target: 'discipline', value: 3 },
                { type: 'talent', target: 'defensive_position' }
            ],
            tier: 4,
            bonuses: [],
            otherEffects: ["Cannot be Surprised while at 1+ focus", "When resisting influence or losing focus involuntarily: reduce loss by Discipline ranks (min 1)"]
        }
    ],
}
