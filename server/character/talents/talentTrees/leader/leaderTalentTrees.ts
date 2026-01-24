import { TalentPath, ActionCostCode } from "../../talentInterface";
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
            resourceTriggers: [
                {
                    resource: 'focus',
                    effect: 'spend',
                    amount: 1,
                    trigger: 'when using Decisive Command',
                    condition: 'to give ally command die'
                }
            ],
            actionGrants: [
                {
                    type: 'action',
                    count: 1,
                    timing: 'always',
                    restrictedTo: 'add d4 command die to one die roll'
                }
            ],
            otherEffects: ["Target ally must be within 20 feet"]
        }
    ]
}