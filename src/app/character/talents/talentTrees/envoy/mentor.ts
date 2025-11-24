import { TalentTree, ActionCostCode } from "../../talentInterface";
import { BonusType } from "../../../bonuses/bonusModule";

export const MENTOR_TALENT_TREE: TalentTree = {
    pathName: 'Mentor',
    nodes: [
        {
            id: "practical_demonstration",
            name: "Practical Demonstration",
            description: "After you succeed on a test to attack or Gain Advantage, you can use your Rousing Presence as a free action.",
            actionCost: ActionCostCode.Free,
            prerequisites: [
                { type: 'skill', target: 'leadership', value: 1 },
                { type: 'talent', target: 'rousing_presence' }
            ],
            tier: 1,
            bonuses: [],
            otherEffects: ["After successful attack or Gain Advantage test, can use Rousing Presence as free action"]
        },
        {
            id: "sound_advice",
            name: "Sound Advice",
            description: "After an ally you can influence fails a skill test, you can spend 1 focus to use your Rousing Presence on them as a free action.",
            actionCost: ActionCostCode.Reaction,
            prerequisites: [
                { type: 'talent', target: 'rousing_presence' }
            ],
            tier: 1,
            bonuses: [],
            otherEffects: ["After ally fails skill test, spend 1 focus to use Rousing Presence as free action"]
        },
        {
            id: "lessons_in_patience",
            name: "Lessons in Patience",
            description: "After you use your Rousing Presence, the target recovers 1 focus. Additionally, when you acquire this talent, gain a utility expertise in Motivational Speech.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'skill', target: 'discipline', value: 2 },
                { type: 'talent', target: 'sound_advice' }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: ["After using Rousing Presence, target recovers 1 focus", "Gain Motivational Speech utility expertise"]
        },
        {
            id: "mighty",
            name: "Mighty",
            description: "When you hit with a weapon or unarmed attack, for each action you used on that attack's action, increase the damage you deal by 1 + your tier.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'practical_demonstration' }
            ],
            tier: 1,
            bonuses: [],
            otherEffects: ["When hitting with weapon/unarmed attack, each action spent increases damage by 1 + tier"]
        },
        {
            id: "instill_confidence",
            name: "Instill Confidence",
            description: "When you use your Rousing Presence, instead of the target becoming Determined, you can make them Focused until the end of the scene.",
            actionCost: ActionCostCode.Special,
            specialActivation: "Requires having a companion. When you use your Rousing Presence, instead of the target becoming Determined, you can make them Focused until the end of the scene.",
            prerequisites: [
                { type: 'talent', target: 'lessons_in_patience' }
            ],
            tier: 3,
            bonuses: [],
        },
        {
            id: "guiding_oration",
            name: "Guiding Oration",
            description: "After you succeed on a test to Gain Advantage, you can choose an ally you can influence within 10 feet of your target. Until the end of their next turn, that ally gains an advantage on their next test against your target.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'skill', target: 'leadership', value: 2 },
                { type: 'talent', target: 'mighty' }
            ],
            tier: 3,
            bonuses: [],
            otherEffects: ["After successful Gain Advantage test, ally within 10 feet gains advantage on next test against target"]
        },
        {
            id: "foresight",
            name: "Foresight",
            description: "At the beginning of combat and at the start of each of your turns, gain an additional reaction.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'skill', target: 'discipline', value: 3 },
                { type: 'talent', target: 'instill_confidence' }
            ],
            tier: 4,
            bonuses: [],
            otherEffects: ["Gain 1 additional reaction at beginning of combat and start of each turn"]
        },
        {
            id: "rallying_shout",
            name: "Rallying Shout",
            description: "When you use your Rousing Presence, you can target an Unconscious ally you can sense. When you do, the target is no longer Unconscious, and if they have 0 health, they roll their recovery die and recover health equal to the result + your ranks in Leadership.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'skill', target: 'leadership', value: 3 },
                { type: 'talent', target: 'guiding_oration' }
            ],
            tier: 3,
            bonuses: [],
            otherEffects: ["Can target Unconscious ally with Rousing Presence", "If at 0 health, ally rolls recovery die and recovers health equal to result + Leadership ranks"]
        }
    ],
}