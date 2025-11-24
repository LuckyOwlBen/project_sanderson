import { TalentPath } from "../../talentInterface";
import { DUELIST_TALENT_TREE } from "./duelist";
import { SHARDBEARER_TALENT_TREE } from "./shardbearer";
import { SOLDIER_TALENT_TREE } from "./soldier";

export const WARRIOR_TALENT_TREE: TalentPath = {
    name: "Warrior",
    paths: [
        SOLDIER_TALENT_TREE,
        DUELIST_TALENT_TREE,
        SHARDBEARER_TALENT_TREE
    ],
    talentNodes: [
        {
            id: 'vigilant_stance',
            name: 'Vigilant Stance',
            description: 'Enter Vigilant Stance: Reduce the focus cost of Dodge and Reactive Strike by 1, and you can enter other stances as a reaction.',
            actionCost: 1,
            prerequisites: [],
            tier: 0,
            bonuses: [],
            otherEffects: ['Reduce focus cost of Dodge and Reactive Strike by 1; can enter other stances as a reaction.']
        }
    ]
}
