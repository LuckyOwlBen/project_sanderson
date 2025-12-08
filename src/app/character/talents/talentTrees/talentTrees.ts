import { TalentTree } from '../talentInterface';
import { SINGER_FORMS_TALENT_TREE } from './singerForms';

export const ALL_TALENT_TREES: Record<string, TalentTree> = {
    //Tree Files Go Here
    singerForms: SINGER_FORMS_TALENT_TREE,
    singer: SINGER_FORMS_TALENT_TREE,  // Map ancestry to talent tree
};

export function getTalentTree(pathName: string): TalentTree | undefined {
    return ALL_TALENT_TREES[pathName.toLowerCase()];
}

export function getAllTalentTrees(): TalentTree[] {
    return Object.values(ALL_TALENT_TREES);
}