import { TalentTree, ActionCostCode } from "../../talentInterface";
import { BonusType } from "../../../bonuses/bonusModule";

export const CHAMPION_TALENT_TREE: TalentTree = {
    pathName: 'Champion',
    nodes: [
        {
            id: "combat_coordination",
            name: "Combat Coordination",
            description: "After you use the Strike action, use Decisive Command as a free action. If your Strike didn't hit, you also don't have to spend the usual focus for Decisive Command.",
            actionCost: ActionCostCode.Free,
            prerequisites: [
                { type: 'skill', target: 'leadership', value: 2 },
                { type: 'talent', target: 'decisive_command' }
            ],
            tier: 1,
            bonuses: [],
            actionGrants: [
                {
                    type: 'free-action',
                    count: 1,
                    restrictedTo: 'Decisive Command',
                    frequency: 'unlimited'
                }
            ],
            resourceTriggers: [
                {
                    resource: 'focus',
                    effect: 'reduce-cost',
                    amount: 1,
                    trigger: 'When using Decisive Command after a missed Strike',
                    condition: 'Strike action did not hit'
                }
            ],
            otherEffects: []
        },
        {
            id: "valiant_intervention",
            name: "Valiant Intervention",
            description: "Spend 1 focus to move up to 10 feet, then make an Athletics test against the Spiritual defense of an enemy you can influence. On a success, they gain a disadvantage on tests against your allies until the end of the target's next turn. A target can resist this influence, but after they do, you gain an advantage on your next test against them until the end of your next turn.",
            actionCost: 1,
            prerequisites: [
                { type: 'skill', target: 'athletics', value: 1 },
                { type: 'talent', target: 'decisive_command' }
            ],
            tier: 1,
            bonuses: [],
            movementEffects: [
                {
                    type: 'special-movement',
                    amount: 10,
                    timing: 'before-attack',
                    movementType: 'walk'
                }
            ],
            attackDefinition: {
                weaponType: 'unarmed',
                targetDefense: 'Spiritual',
                range: 'special',
                resourceCost: { type: 'focus', amount: 1 },
                specialMechanics: [
                    "Move up to 10 feet before attacking",
                    "Uses Athletics test (not attack test)",
                    "Must be able to influence target",
                    "Success: target has disadvantage on tests vs allies until end of their next turn",
                    "If target resists: gain advantage on next test vs them"
                ]
            },
            conditionEffects: [
                {
                    type: 'apply',
                    condition: 'disadvantage on tests against allies',
                    trigger: 'on successful Athletics test',
                    target: 'target',
                    duration: 'until end of target next turn'
                }
            ],
            otherEffects: ["If target resists influence: gain advantage on next test vs them until end of your next turn"]
        },
        {
            id: "hardy",
            name: "Hardy",
            description: "When you acquire this talent, your maximum and current health increase by 1 per level. This applies to all previous and future levels.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'valiant_intervention' }
            ],
            tier: 2,
            bonuses: [
                {
                    type: BonusType.RESOURCE,
                    target: 'health',
                    value: 1
                }
            ],
            otherEffects: []
        },
        {
            id: "imposing_posture",
            name: "Imposing Posture",
            description: "After an enemy resists your influence while within your weapon's reach, they become Disoriented until the end of their next turn.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'skill', target: 'athletics', value: 2 },
                { type: 'talent', target: 'combat_coordination' }
            ],
            tier: 2,
            bonuses: [],
            conditionEffects: [
                {
                    type: 'apply',
                    condition: 'Disoriented',
                    trigger: 'when enemy resists your influence',
                    target: 'target',
                    duration: 'until end of their next turn'
                }
            ],
            otherEffects: []
        },
        {
            id: "resolute_stand",
            name: "Resolute Stand",
            description: "When you use your Valiant Intervention, you can spend focus up to your ranks in Leadership to target that many additional characters. Additionally, after you affect a target with Valiant Intervention, they can't make Reactive Strikes against your allies until the end of that target's next turn.",
            actionCost: ActionCostCode.Special,
            specialActivation: "Enhances Valiant Intervention with multi-target and Reactive Strike prevention",
            prerequisites: [
                { type: 'skill', target: 'athletics', value: 1 },
                { type: 'talent', target: 'hardy' }
            ],
            tier: 3,
            bonuses: [],
            resourceTriggers: [
                {
                    resource: 'focus',
                    effect: 'spend',
                    amount: 'up to Leadership ranks',
                    trigger: 'when using Valiant Intervention',
                    condition: 'to add additional targets'
                }
            ],
            conditionEffects: [
                {
                    type: 'prevent',
                    condition: 'Reactive Strikes against allies',
                    trigger: 'after using Valiant Intervention on target',
                    target: 'target',
                    duration: 'until end of their next turn'
                }
            ],
            otherEffects: []
        },
        {
            id: "mighty",
            name: "Mighty",
            description: "When you hit with a weapon or unarmed attack, for each action you used on that attack's action, increase the damage you deal by 1 + your tier.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'imposing_posture' }
            ],
            tier: 3,
            bonuses: [],
            otherEffects: ['Damage increased by 1 + tier per action spent on attack']
        },
        {
            id: "demonstrative_command",
            name: "Demonstrative Command",
            description: "Before you make an Athletics, Agility, or Leadership test, you can spend 1 focus to roll your command die and add the result to your d20 roll. Additionally, when you acquire this talent, increase the size of your command die by one size (such as from a d4 to a d6).",
            actionCost: ActionCostCode.Special,
            specialActivation: "Before Athletics, Agility, or Leadership test",
            prerequisites: [
                { type: 'skill', target: 'leadership', value: 2 },
                { type: 'talent', target: 'resolute_stand' }
            ],
            tier: 4,
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
                    trigger: 'before Athletics, Agility, or Leadership test',
                    condition: 'to add command die result to roll'
                }
            ],
            otherEffects: []
        },
        {
            id: "resilient_hero",
            name: "Resilient Hero",
            description: "Once per scene, before you are reduced to 0 health, you can use this reaction to instead change your health to equal your Athletics modifier.",
            actionCost: ActionCostCode.Reaction,
            prerequisites: [
                { type: 'skill', target: 'athletics', value: 3 },
                { type: 'talent', target: 'resolute_stand' }
            ],
            tier: 4,
            bonuses: [],
            actionGrants: [
                {
                    type: 'reaction',
                    count: 1,
                    frequency: 'once-per-scene',
                    restrictedTo: 'set health to Athletics modifier'
                }
            ],
            otherEffects: []
        }
    ],
}