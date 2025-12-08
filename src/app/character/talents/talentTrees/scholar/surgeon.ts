import { TalentTree, ActionCostCode } from "../../talentInterface";
import { BonusType } from "../../../bonuses/bonusModule";

export const SURGEON_TALENT_TREE: TalentTree = {
    pathName: 'Surgeon',
    nodes: [
        {
            id: "emotional_intelligence",
            name: "Emotional Intelligence",
            description: "When you acquire this talent, your Erudition talent grants you an additional skill, and you can use Erudition to choose spiritual skills that aren't surges. Additionally, you gain a utility expertise in Diagnosis.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'education' }
            ],
            tier: 1,
            bonuses: [],
            otherEffects: ["Erudition grants +1 skill", "Erudition can select spiritual skills (non-surge)", "Gain Diagnosis utility expertise"]
        },
        {
            id: "field_medicine",
            name: "Field Medicine",
            description: "Spend 1 focus to make a DC 15 Medicine test to treat a conscious willing character within your reach, and roll the target's recovery die as part of this test. You gain a disadvantage if you're treating yourself. On a success, your target recovers health equal to the result of their recovery die + your ranks in Medicine. On a failure, your target only recovers health equal to the result of their recovery die.",
            actionCost: 1,
            prerequisites: [
                { type: 'skill', target: 'medicine', value: 1 },
                { type: 'talent', target: 'education' }
            ],
            tier: 1,
            bonuses: [],
            otherEffects: ["Spend 1 focus, test Medicine DC 15", "Roll target's recovery die", "Disadvantage when treating self", "Success: recover recovery die + Medicine ranks", "Failure: recover recovery die only"]
        },
        {
            id: "anatomical_insight",
            name: "Anatomical Insight",
            description: "When you hit a target of your size or smaller with an unarmed attack, you can spend 1 focus to apply the Exhausted condition to your target. The penalty applied by this condition equals half your ranks in Medicine, rounded up.",
            actionCost: ActionCostCode.Special,
            specialActivation: "When hitting with unarmed attack against same-size or smaller target",
            prerequisites: [
                { type: 'talent', target: 'field_medicine' }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: ["When hitting with unarmed attack on size-equal/smaller target, spend 1 focus to apply Exhausted", "Exhausted penalty = half Medicine ranks (rounded up)"]
        },
        {
            id: "collected",
            name: "Collected",
            description: "When you acquire this talent, increase your Cognitive and Spiritual defenses by 2.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'emotional_intelligence' }
            ],
            tier: 2,
            bonuses: [
                { type: BonusType.DEFENSE, target: 'cognitive', value: 2 },
                { type: BonusType.DEFENSE, target: 'spiritual', value: 2 }
            ]
        },
        {
            id: "swift_healer",
            name: "Swift Healer",
            description: "You can use your Field Medicine as a free action. Additionally, when you acquire this talent, you become more skilled in healing. When you use an ability that restores health to another character, they recover additional health equal to your ranks in Medicine.",
            actionCost: ActionCostCode.Free,
            prerequisites: [
                { type: 'skill', target: 'medicine', value: 2 },
                { type: 'talent', target: 'field_medicine' }
            ],
            tier: 3,
            bonuses: [],
            otherEffects: ["Use Field Medicine as free action", "When restoring health to others, they recover additional health equal to Medicine ranks"]
        },
        {
            id: "applied_medicine",
            name: "Applied Medicine",
            description: "When you cause a character to recover health, they recover additional health equal to your ranks in Lore.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'skill', target: 'lore', value: 2 },
                { type: 'talent', target: 'collected' }
            ],
            tier: 3,
            bonuses: [],
            otherEffects: ["When causing health recovery, add Lore ranks to amount recovered"]
        },
        {
            id: "ongoing_care",
            name: "Ongoing Care",
            description: "You can forgo the usual benefits of a short or long rest to instead spend that time treating an ally within your reach. After that rest, make a DC 10 Medicine test, increasing the difficulty by 5 for each injury the target has beyond the first. On a success, you remove a single condition or similar effect caused by one of the target's injuries (but the injury itself remains until healed). A target can't benefit from this talent more than once every 24 hours. Additionally, when you acquire this talent, gain a utility expertise in Mental Health Care.",
            actionCost: ActionCostCode.Special,
            specialActivation: "Forgo rest benefits to treat ally during rest",
            prerequisites: [
                { type: 'skill', target: 'lore', value: 3 },
                { type: 'talent', target: 'swift_healer' }
            ],
            tier: 4,
            bonuses: [],
            otherEffects: ["Forgo short/long rest to treat ally", "Test Medicine DC 10 (+5 per injury beyond first)", "Success: remove 1 condition from injury", "Target can benefit once per 24 hours", "Gain Mental Health Care utility expertise"]
        },
        {
            id: "resuscitation",
            name: "Resuscitation",
            description: "You can use your Field Medicine talent to attempt to resuscitate a fallen character. When you do, spend 3 focus (instead of 1) to target a character within your reach who is Unconscious or who died within a number of rounds equal to your ranks in Medicine. That talent's test DC increases by 5 for each injury the target has beyond the first. On a failure, the target doesn't regain health. On a success, the target recovers health as usual for that talent, and if they were dead, they return to life. If they were Unconscious, they can choose to remove that condition if they wish.",
            actionCost: ActionCostCode.Special,
            specialActivation: "Use Field Medicine on Unconscious or recently dead target",
            prerequisites: [
                { type: 'skill', target: 'medicine', value: 3 },
                { type: 'talent', target: 'swift_healer' }
            ],
            tier: 4,
            bonuses: [],
            otherEffects: ["Use Field Medicine to resuscitate", "Spend 3 focus instead of 1", "Target Unconscious or died within Medicine rank rounds", "DC +5 per injury beyond first", "Success: recover health, return to life if dead, optionally remove Unconscious"]
        }
    ],
}
