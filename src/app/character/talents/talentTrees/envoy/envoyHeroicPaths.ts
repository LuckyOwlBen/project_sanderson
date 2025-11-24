import { TalentPath } from "../../talentInterface";
import { DIPLOMAT_TALENT_TREE } from "./diplomat";
import { FAITHFUL_TALENT_TREE } from "./faithful";
import { MENTOR_TALENT_TREE } from "./mentor";

export const ENVOY_HEROIC_PATH: TalentPath = {
    name: 'Envoy',
    paths: [
        DIPLOMAT_TALENT_TREE,
        FAITHFUL_TALENT_TREE,
        MENTOR_TALENT_TREE,
    ],
    talentNodes: [
        {
            id: 'rousingPresence',
            name: 'Rousing Presence',
            description: 'An ally becomes Determined until end of scene',
            actionCost: 1, // 1 action
            prerequisites: [],
            tier: 0,
            bonuses: [],
            otherEffects: ['An ally becomes Determined until end of scene'],
        }
    ],
}
