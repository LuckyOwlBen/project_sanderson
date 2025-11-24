import { TalentTree, ActionCostCode } from "../../talentInterface";
import { BonusType } from "../../../bonuses/bonusModule";

export const POLITICO_TALENT_TREE: TalentTree = {
    pathName: 'Politico',
    nodes: [
        {
            id: "cutthroat_tactics",
            name: "Cutthroat Tactics",
            description: "Before an ally rolls your command die on a test, they can choose to instead raise the stakes on that test. If they do so and roll a Complication, you recover 1 focus.",
            actionCost: ActionCostCode.Special,
            specialActivation: "Ally chooses to raise stakes before rolling command die",
            prerequisites: [
                { type: 'skill', target: 'deception', value: 1 },
                { type: 'talent', target: 'decisive_command' }
            ],
            tier: 1,
            bonuses: [],
            otherEffects: ["Ally can raise stakes on command die test", "If Complication rolled, you recover 1 focus"]
        },
        {
            id: "tactical_ploy",
            name: "Tactical Ploy",
            description: "Make a Deception test against the Cognitive defense of an enemy you can influence. On a success, your target loses one reaction and gains a disadvantage on their next cognitive or spiritual test. A target can resist this influence, but after they do, you gain an advantage on your next test targeting them before the end of your next turn.",
            actionCost: 1,
            prerequisites: [
                { type: 'talent', target: 'decisive_command' }
            ],
            tier: 1,
            bonuses: [],
            otherEffects: ["Test Deception vs Cognitive", "Success: target loses 1 reaction and has disadvantage on next Cognitive/Spiritual test", "If resisted: gain advantage on next test vs them"]
        },
        {
            id: "rumormonger",
            name: "Rumormonger",
            description: "When you make a test to spread misinformation or gather rumors, you can spend 2 focus to add an Opportunity to the result. Additionally, when you acquire this talent, gain a utility expertise in Scandal.",
            actionCost: ActionCostCode.Special,
            specialActivation: "When making test to spread misinformation or gather rumors",
            prerequisites: [
                { type: 'talent', target: 'cutthroat_tactics' }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: ["Spend 2 focus to add Opportunity to misinformation/rumor tests", "Gain Scandal utility expertise", "Requires having a patron"]
        },
        {
            id: "well_dressed",
            name: "Well Dressed",
            description: "While visibly wearing Presentable armor or fashionable clothing, you gain an advantage on the first Deception, Leadership, or Persuasion test you make during each scene. Additionally, when you acquire this talent, gain a cultural expertise in Fashion.",
            actionCost: ActionCostCode.Special,
            specialActivation: "Advantage on first social test per scene while well-dressed",
            prerequisites: [
                { type: 'talent', target: 'rumormonger' }
            ],
            tier: 2,
            bonuses: [],
            grantsAdvantage: ["first_deception_per_scene", "first_leadership_per_scene", "first_persuasion_per_scene"],
            otherEffects: ["While wearing Presentable armor/fashionable clothing: advantage on first Deception/Leadership/Persuasion test per scene", "Gain Fashion cultural expertise"]
        },
        {
            id: "baleful",
            name: "Baleful",
            description: "To resist your influence, a character must spend additional focus equal to your tier.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'rumormonger' }
            ],
            tier: 3,
            bonuses: [],
            otherEffects: ["Characters resisting your influence must spend additional focus equal to your tier"]
        },
        {
            id: "set_at_odds",
            name: "Set at Odds",
            description: "Choose two or more characters you can influence and spend that many focus to seed division among them. Describe a potential source of conflict, then make a Leadership test (DC equals highest Spiritual defense among those targets). On a success, you influence each target to become hostile toward the other targets, which sparks an argument, combat, or other conflict until they find a way to resolve it. A target can resist this influence, but after they do, they lose additional focus equal to your ranks in Leadership. If only some of the targets resist influence, the others remain hostile, but their conflict might become easier to resolve.",
            actionCost: 2,
            prerequisites: [
                { type: 'skill', target: 'leadership', value: 3 },
                { type: 'talent', target: 'baleful' }
            ],
            tier: 3,
            bonuses: [],
            otherEffects: ["Choose 2+ targets, spend that many focus", "Test Leadership vs highest Spiritual defense", "Success: targets become hostile to each other", "Resisting costs additional focus equal to Leadership ranks"]
        },
        {
            id: "shrewd_command",
            name: "Shrewd Command",
            description: "Before you make a Deception, Insight, or Leadership test, you can spend 1 focus to roll your command die and add the result to your d20 roll. Additionally, when you acquire this talent, increase the size of your command die by one size (such as from a d4 to a d6).",
            actionCost: ActionCostCode.Special,
            specialActivation: "Before Deception, Insight, or Leadership test",
            prerequisites: [
                { type: 'skill', target: 'leadership', value: 2 },
                { type: 'talent', target: 'rumormonger' }
            ],
            tier: 4,
            bonuses: [],
            otherEffects: ["Spend 1 focus to add command die to Deception/Insight/Leadership test", "Increase command die size by one (d4→d6, d6→d8, etc.)"]
        },
        {
            id: "grand_deception",
            name: "Grand Deception",
            description: "Spend 3 focus to make a DC 15 Deception test. On a success, choose a detail you established since the start of the last scene and reveal that it was actually a ruse. This ruse must be plausible. The GM is the final arbiter of what sort of ruse you can reveal.",
            actionCost: 3,
            prerequisites: [
                { type: 'skill', target: 'deception', value: 3 },
                { type: 'talent', target: 'shrewd_command' }
            ],
            tier: 4,
            bonuses: [],
            otherEffects: ["Spend 3 focus, test Deception DC 15", "Success: reveal established detail was a ruse (must be plausible)", "GM determines validity of ruse"]
        }
    ],
}