import { TalentTree, ActionCostCode } from "../../talentInterface";
import { BonusType } from "../../../bonuses/bonusModule";

export const FAITHFUL_TALENT_TREE: TalentTree = {
    pathName: 'Faithful',
    nodes: [
        {
            id: "galvanize",
            name: "Galvanize",
            description: "Once per scene, choose an ally you can influence. They can roll their recovery die (no action required) and recover focus equal to the result.",
            actionCost: 2, // 2 actions
            prerequisites: [
                { type: 'talent', target: 'rousing_presence' }
            ],
            tier: 1,
            bonuses: [],
            otherEffects: ["Once per scene", "Target ally rolls recovery die and recovers focus equal to result"]
        },
        {
            id: "applied_motivation",
            name: "Applied Motivation",
            description: "When you cause a character to recover focus, they recover additional focus equal to half your ranks in Lore (rounded up).",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'skill', target: 'discipline', value: 2 },
                { type: 'talent', target: 'galvanize' }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: ["When causing focus recovery, add additional focus equal to half Lore ranks (rounded up)"]
        },
        {
            id: "composed",
            name: "Composed",
            description: "When you acquire this talent, your maximum and current focus increase by a number equal to your tier. When your tier increases by 1, your maximum and current focus do as well.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'galvanize' }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: ["Increase max and current focus by tier", "Increase focus by 1 when tier increases"]
        },
        {
            id: "customary_garb",
            name: "Customary Garb",
            description: "While you're visibly wearing Presentable armor or clothing appropriate for your station, your Physical and Spiritual defenses increase by 2.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'rousing_presence' }
            ],
            tier: 1,
            bonuses: [],
            otherEffects: ["While wearing Presentable armor or appropriate clothing: +2 Physical and Spiritual defenses"]
        },
        {
            id: "devoted_presence",
            name: "Devoted Presence",
            description: "When you use your Rousing Presence on one or more allies, you can spend 1 focus per target to remove any number of the following conditions from them: Prone, Slowed, Stunned, and Surprised.",
            actionCost: ActionCostCode.Special,
            specialActivation: "Spend 1 focus per target to remove Prone, Slowed, Stunned, or Surprised conditions when using Rousing Presence.",
            prerequisites: [
                { type: 'skill', target: 'lore', value: 1 },
                { type: 'talent', target: 'customary_garb' }
            ],
            tier: 2,
            bonuses: [],
        },
        {
            id: "inspired_zeal",
            name: "Inspired Zeal",
            description: "After an ally you can sense uses their Determined condition to add an Opportunity to a test, you can choose a number of other allies you can influence up to your ranks in Discipline. Each target recovers 1 focus (no action required).",
            actionCost: ActionCostCode.Special,
            specialActivation: "After ally uses Determined condition for Opportunity, choose up to Discipline rank allies to recover 1 focus each",
            prerequisites: [
                { type: 'skill', target: 'discipline', value: 3 },
                { type: 'talent', target: 'applied_motivation', operator: 'OR' },
                { type: 'talent', target: 'stalwart_presence', operator: 'OR' }
            ],
            tier: 4,
            bonuses: [],
        },
        {
            id: "sage_counsel",
            name: "Sage Counsel",
            description: "After you use the Aid reaction on an ally, spend 1 focus to grant that ally the benefits of your Rousing Presence (no action required).",
            actionCost: ActionCostCode.Special,
            specialActivation: "After using Aid reaction, spend 1 focus to grant ally Rousing Presence benefits",
            prerequisites: [
                { type: 'skill', target: 'lore', value: 3 },
                { type: 'talent', target: 'stalwart_presence' }
            ],
            tier: 4,
            bonuses: [],
        },
        {
            id: "stalwart_presence",
            name: "Stalwart Presence",
            description: "When you use your Rousing Presence, you can spend 1 focus to increase one of the target's defenses (your choice) by 2 until the end of the next round.",
            actionCost: ActionCostCode.Special,
            specialActivation: "When using Rousing Presence, spend 1 focus to increase target's defense by 2 until end of next round",
            prerequisites: [
                { type: 'skill', target: 'discipline', value: 2 },
                { type: 'talent', target: 'devoted_presence' }
            ],
            tier: 3,
            bonuses: [],
        }
    ],
}