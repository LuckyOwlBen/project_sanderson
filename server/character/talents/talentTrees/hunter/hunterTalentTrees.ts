import { ActionCostCode, TalentPath } from "../../talentInterface";
import { ARCHER_TALENT_TREE } from "./archer";
import { ASSASSIN_TALENT_TREE } from "./assassin";
import { TRACKER_TALENT_TREE } from "./tracker";

export const HUNTER_TALENT_TREES: TalentPath = {
    name: 'Hunter',
    paths: [
        ARCHER_TALENT_TREE,
        ASSASSIN_TALENT_TREE,
        TRACKER_TALENT_TREE,
    ],
    talentNodes: [{ 
        id: "seek_quarry",
        name: "Seek Quarry",
        description: "Choose a character to be your quarry, gaining an advantage on tests to find, attack and study them.",
        actionCost: ActionCostCode.Special,
        specialActivation: "Choose a character as your quarry. Gain advantage on tests to find, attack, and study them.",
        prerequisites: [],
        tier: 0,
        bonuses: [],
        grantsAdvantage: ["tests_to_find_quarry", "tests_to_attack_quarry", "tests_to_study_quarry"]
    }
],
}
