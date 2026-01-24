import { TalentPath } from "../../talentInterface";
import { INVESTIGATOR_TALENT_TREE } from "./Investigator";
import { SPY_TALENT_TREE } from "./spy";
import { THIEF_TALENT_TREE } from "./thief";

export const AGENT_HEROIC_PATH: TalentPath = { 
    name: 'Agent',
    paths: [
        INVESTIGATOR_TALENT_TREE,
        SPY_TALENT_TREE,
        THIEF_TALENT_TREE,
    ],
    talentNodes: [
        {
            id: "opportunist",
            name: "Opportunist",
            description: "Once per round, you can reroll your plot die.",
            actionCost: -2, // Special
            specialActivation: "Reroll your plot die once per round.",
            prerequisites: [],
            tier: 0,
            bonuses: [],
        },
    ],
}
