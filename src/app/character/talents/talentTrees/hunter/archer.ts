import { TalentTree, ActionCostCode } from "../../talentInterface";
import { BonusType } from "../../../bonuses/bonusModule";

export const ARCHER_TALENT_TREE: TalentTree = {
    pathName: 'Archer',
    nodes: [
        {
            id: "combat_training",
            name: "Combat Training",
            description: "Once per round, when you miss on a weapon attack, you can graze one target without spending focus. Additionally, when you acquire this talent, gain a weapon expertise and an armor expertise of your choice, and gain a cultural expertise in Military Life.",
            actionCost: ActionCostCode.Special,
            specialActivation: "Once per round when you miss on a weapon attack",
            prerequisites: [
                { type: 'talent', target: 'seek_quarry' }
            ],
            tier: 1,
            bonuses: [],
            otherEffects: ["Once per round, can graze on miss without spending focus", "Gain weapon expertise", "Gain armor expertise", "Gain Military Life cultural expertise"]
        },
        {
            id: "steady_aim",
            name: "Steady Aim",
            description: "Until the end of your turn, both the short and long ranges of your ranged weapons increase by half, and when you hit with a ranged weapon attack, you deal extra damage equal to your ranks in Perception.",
            actionCost: 1,
            prerequisites: [
                { type: 'skill', target: 'agility', value: 1 },
                { type: 'talent', target: 'combat_training' }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: ["Ranged weapon ranges increase by 50%", "Deal extra damage equal to Perception ranks on ranged weapon hits"]
        },
        {
            id: "tagging_shot",
            name: "Tagging Shot",
            description: "Move up to 5 feet and make a ranged weapon attack against the Physical defense of a target. On a hit or a graze, you also make the target your quarry for your Seek Quarry talent.",
            actionCost: 3,
            prerequisites: [
                { type: 'skill', target: 'perception', value: 2 },
                { type: 'talent', target: 'seek_quarry' }
            ],
            tier: 1,
            bonuses: [],
            otherEffects: ["Move up to 5 feet and make ranged attack", "On hit or graze, target becomes your quarry"]
        },
        {
            id: "backstep",
            name: "Backstep",
            description: "After you make a ranged attack, spend 2 focus to Disengage as a free action. If you then end your turn in cover or an area where your enemy's senses are obscured, you gain the benefit of the Brace action.",
            actionCost: ActionCostCode.Free,
            prerequisites: [
                { type: 'skill', target: 'agility', value: 2 },
                { type: 'talent', target: 'steady_aim' }
            ],
            tier: 3,
            bonuses: [],
            otherEffects: ["After ranged attack, spend 2 focus to Disengage as free action", "If ending turn in cover/obscured area, gain Brace action benefit"]
        },
        {
            id: "hardy",
            name: "Hardy",
            description: "When you acquire this talent, your maximum and current health increase by 1 per level. This applies to all previous and future levels.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'steady_aim' }
            ],
            tier: 4,
            bonuses: [],
            otherEffects: ["Increase max and current health by 1 per level (retroactive and future)"]
        },
        {
            id: "sharp_eye",
            name: "Sharp Eye",
            description: "After you observe your quarry for an action, or after you observe another character for at least 1 minute, make a Perception test against their Cognitive defense. On a success, you learn one of the following: the target's lowest attribute score, the target's lowest defense, or whether the target has lost more than half of their maximum health, focus, or Investiture (choose one).",
            actionCost: ActionCostCode.Special,
            specialActivation: "After observing quarry for 1 action, or other character for 1 minute",
            prerequisites: [
                { type: 'talent', target: 'tagging_shot' }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: ["Test Perception vs Cognitive defense to learn: lowest attribute, lowest defense, or if lost >50% of health/focus/Investiture"]
        },
        {
            id: "exploit_weakness",
            name: "Exploit Weakness",
            description: "Use the Gain Advantage action as a free action, targeting only your quarry.",
            actionCost: ActionCostCode.Free,
            prerequisites: [
                { type: 'skill', target: 'perception', value: 3 },
                { type: 'talent', target: 'sharp_eye' }
            ],
            tier: 3,
            bonuses: [],
            otherEffects: ["Use Gain Advantage as free action against quarry only"]
        },
        {
            id: "unrelenting_salvo",
            name: "Unrelenting Salvo",
            description: "You can use the same ranged weapon to Strike against your quarry more than once a turn, instead of being limited to one Strike per hand.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'skill', target: 'agility', value: 3 },
                { type: 'talent', target: 'hardy' }
            ],
            tier: 4,
            bonuses: [],
            otherEffects: ["Can Strike quarry multiple times per turn with same ranged weapon"]
        }
    ],
}