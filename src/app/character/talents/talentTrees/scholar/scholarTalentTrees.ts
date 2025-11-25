import { ActionCostCode, TalentPath } from "../../talentInterface";
import { ARTIFABRIAN_TALENT_TREE } from "./artifabrian";
import { STRATEGIST_TALENT_TREE } from "./strategist";
import { SURGEON_TALENT_TREE } from "./surgeon";

export const SCHOLAR_TALENT_TREE: TalentPath = {
    name: "Scholar",
    paths: [
        ARTIFABRIAN_TALENT_TREE,
        STRATEGIST_TALENT_TREE,
        SURGEON_TALENT_TREE
    ],
    talentNodes: [
        {
            id: 'education',
            name: 'Education',
            description: 'Temporarily gain a cultural or utility expertise and a rank in two non-surge cognative skills. Reassign these after a long rest with library access.',
            actionCost: ActionCostCode.Special,
            specialActivation: 'After a long rest with library access, reassign expertise and skill ranks',
            prerequisites: [],
            tier: 0,
            bonuses: [],
            otherEffects: ['Gain temporary cultural/utility expertise', 'Gain temporary rank in two non-surge cognative skills']
        }
    ]
}