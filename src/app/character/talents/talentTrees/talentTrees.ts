import { TalentTree, TalentPath } from '../talentInterface';
import { SINGER_FORMS_TALENT_TREE } from './singerForms';
import { WARRIOR_TALENT_TREE } from './warrior/warriorTalentTree';
import { SCHOLAR_TALENT_TREE } from './scholar/scholarTalentTrees';
import { HUNTER_TALENT_TREES } from './hunter/hunterTalentTrees';
import { LEADER_TALENT_TREE } from './leader/leaderTalentTrees';
import { ENVOY_HEROIC_PATH } from './envoy/envoyHeroicPaths';
import { AGENT_HEROIC_PATH } from './agent/agentHeroicPath';

export const ALL_TALENT_TREES: Record<string, TalentTree> = {
    //Tree Files Go Here
    singerForms: SINGER_FORMS_TALENT_TREE,
    singer: SINGER_FORMS_TALENT_TREE,  // Map ancestry to talent tree
};

export const ALL_TALENT_PATHS: Record<string, TalentPath> = {
    warrior: WARRIOR_TALENT_TREE,
    scholar: SCHOLAR_TALENT_TREE,
    hunter: HUNTER_TALENT_TREES,
    leader: LEADER_TALENT_TREE,
    envoy: ENVOY_HEROIC_PATH,
    agent: AGENT_HEROIC_PATH,
};

export function getTalentTree(pathName: string): TalentTree | undefined {
    return ALL_TALENT_TREES[pathName.toLowerCase()];
}

export function getTalentPath(pathName: string): TalentPath | undefined {
    return ALL_TALENT_PATHS[pathName.toLowerCase()];
}

export function getAllTalentTrees(): TalentTree[] {
    return Object.values(ALL_TALENT_TREES);
}