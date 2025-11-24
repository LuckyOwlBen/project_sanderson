import { TalentTree, ActionCostCode } from "../../talentInterface";
import { BonusType } from "../../../bonuses/bonusModule";

export const DUELIST_TALENT_TREE: TalentTree = {
    pathName: 'Duelist',
    nodes: [
        {
            id: "flamestance",
            name: "Flamestance",
            description: "When you acquire this talent, you learn a new stance, which you can enter as an action: Flamestance. While in this stance, you gain an advantage on Intimidation tests. Additionally, while there is exactly one enemy within your reach and none of your allies are within the reach of that enemy or you, you can use a reaction to gain an action, which you can spend only to Gain Advantage or use an action that includes an attack test targeting that enemy.",
            actionCost: 1,
            prerequisites: [
                { type: 'skill', target: 'intimidation', value: 1 },
                { type: 'talent', target: 'vigilant_stance' }
            ],
            tier: 1,
            bonuses: [],
            grantsAdvantage: ["intimidation_in_flamestance"],
            otherEffects: ["Learn Flamestance (enter as 1 action)", "In stance: advantage on Intimidation", "When alone with 1 enemy: reaction to gain action (use for Gain Advantage or attack vs that enemy)"]
        },
        {
            id: "practiced_kata",
            name: "Practiced Kata",
            description: "When you acquire this talent, you can use fighting stances in conversation and endeavor scenes, in addition to combat. Activating or changing a stance during a conversation or endeavor costs 1 focus and counts as your contribution for the round. Additionally, if you aren't Surprised when a combat, conversation, or endeavor scene begins, you can enter Vigilant Stance at the beginning of that scene (no action required).",
            actionCost: ActionCostCode.Special,
            specialActivation: "Can use stances in non-combat scenes and enter Vigilant Stance at scene start",
            prerequisites: [
                { type: 'talent', target: 'vigilant_stance' }
            ],
            tier: 1,
            bonuses: [],
            otherEffects: ["Use fighting stances in conversation and endeavor scenes", "Activating stance in non-combat costs 1 focus", "Enter Vigilant Stance at scene start if not Surprised"]
        },
        {
            id: "ironstance",
            name: "Ironstance",
            description: "When you acquire this talent, you learn a new stance, which you can enter as an action: Ironstance. While in this stance, you gain an advantage on Insight tests. Additionally, when a character within your reach misses you or grazes you with an attack, you can use Reactive Strike against them as if they had voluntarily left your reach.",
            actionCost: 1,
            prerequisites: [
                { type: 'skill', target: 'athletics', value: 2 },
                { type: 'talent', target: 'practiced_kata' }
            ],
            tier: 2,
            bonuses: [],
            grantsAdvantage: ["insight_in_ironstance"],
            otherEffects: ["Learn Ironstance (enter as 1 action)", "In stance: advantage on Insight", "When missed/grazed by attacker in reach: can Reactive Strike"]
        },
        {
            id: "signature_weapon",
            name: "Signature Weapon",
            description: "When you acquire this talent, gain one weapon expertise. Then choose one weapon type in which you have an expertise and denote it in parentheses after this talent's name on your character sheet. Your Opportunity range for tests using this weapon type expands by 1. When you reach tier 3, this Opportunity range instead expands by 2.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'flamestance' }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: ["Gain weapon expertise", "Choose signature weapon type", "Opportunity range +1 with signature weapon (+2 at tier 3)"]
        },
        {
            id: "feinting_strike",
            name: "Feinting Strike",
            description: "Spend 2 focus to make a melee weapon attack against a target's Cognitive defense. On a hit, your target also loses one reaction and loses focus equal to your ranks in Intimidation. On a graze, they lose half as much focus (rounded up) and don't lose 1 reaction. You can spend an opportunity from this test to gain 2 actions, which you can use only to Strike or activate a stance.",
            actionCost: 1,
            prerequisites: [
                { type: 'skill', target: 'intimidation', value: 2 },
                { type: 'talent', target: 'flamestance' }
            ],
            tier: 3,
            bonuses: [],
            otherEffects: ["Spend 2 focus, attack vs Cognitive", "Hit: target loses 1 reaction and Intimidation rank focus", "Graze: loses half focus (rounded up), keeps reaction", "Spend opportunity: gain 2 actions (Strike or activate stance only)"]
        },
        {
            id: "surefooted",
            name: "Surefooted",
            description: "When you acquire this talent, increase your movement rate by 10. Additionally, before you take damage from dangerous terrain or falling, reduce that damage by 2 × your tier.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'ironstance' }
            ],
            tier: 3,
            bonuses: [
                { type: BonusType.DERIVED, target: 'movement', value: 10 }
            ],
            otherEffects: ["Reduce terrain/falling damage by 2×tier"]
        },
        {
            id: "vinestance",
            name: "Vinestance",
            description: "When you acquire this talent, you learn a new stance, which you can enter as an action: Vinestance. Your Physical and Cognitive defenses increase by 1. Additionally, after you're hit or grazed by a melee attack, you can use a reaction to make an Athletics test against your attacker's Cognitive defense. On a success, your target loses 1d4 focus, and you can push them horizontally up to 5 feet × your ranks in Athletics.",
            actionCost: 1,
            prerequisites: [
                { type: 'skill', target: 'athletics', value: 3 },
                { type: 'talent', target: 'feinting_strike' }
            ],
            tier: 4,
            bonuses: [
                { type: BonusType.DEFENSE, target: 'physical', value: 1, condition: "while in vinestance" },
                { type: BonusType.DEFENSE, target: 'cognitive', value: 1, condition: "while in vinestance" }
            ],
            otherEffects: ["Learn Vinestance (enter as 1 action)", "In stance: +1 Physical and Cognitive defense", "After hit/graze by melee: reaction to test Athletics vs Cognitive", "Success: target loses 1d4 focus, push 5×Athletics feet"]
        },
        {
            id: "wits_end",
            name: "Wit's End",
            description: "Spend 1 focus to move up to half your movement rate, then make a melee weapon attack against the Cognitive defense of a target who has 0 focus. This attack ignores your target's deflect value and deals an extra 4d6 damage on a hit. It can't graze, only miss or hit. This talent becomes more powerful as your tier increases: at tier 3, you roll an extra 6d6 damage (instead of 4d6); at tier 4, you instead roll an extra 8d6 damage; and at tier 5, you instead roll an extra 10d6 damage.",
            actionCost: 2,
            prerequisites: [
                { type: 'skill', target: 'intimidation', value: 3 },
                { type: 'talent', target: 'feinting_strike' }
            ],
            tier: 4,
            bonuses: [],
            otherEffects: ["Spend 1 focus, move half movement rate", "Attack vs Cognitive defense of 0-focus target", "Ignores deflect, deals +4d6 damage (no graze)", "Scales: 6d6 at T3, 8d6 at T4, 10d6 at T5"]
        }
    ],
}
