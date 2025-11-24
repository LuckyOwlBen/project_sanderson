import { TalentPath } from "../../talentInterface";
import { CHAMPION_TALENT_TREE } from "./champion";
import { OFFICER_TALENT_TREE } from "./officer";
import { POLITICO_TALENT_TREE } from "./politico";

export const LEADER_TALENT_TREE: TalentPath = {
    name: 'Leader',
    paths: [
        CHAMPION_TALENT_TREE,
        OFFICER_TALENT_TREE,
        POLITICO_TALENT_TREE,
    ],
    talentNodes: [
        {
            id: "decisive_command",
            name: "Decisive Command",
            description: "spend 1 focus to give an ally within 20 feet a d4 command die. They can add it to one die roll on their next test.",
            actionCost: 1,
            prerequisites: [],
            tier: 0,
            bonuses: [],
            otherEffects: ["Spend 1 focus to give ally within 20 feet a d4 command die for next test"]
        }
    ]
}