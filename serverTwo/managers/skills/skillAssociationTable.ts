import { Attributes } from '../attributes/attributes';
import { SkillType } from './skillTypes';

export class SkillAssociationTable {
    private skillAssociationTable: Record<SkillType, keyof Attributes> = {
        [SkillType.AGILITY]: 'speed',
        [SkillType.ATHLETICS]: 'strength',
        [SkillType.HEAVY_WEAPONRY]: 'strength',
        [SkillType.LIGHT_WEAPONRY]: 'speed', 
        [SkillType.STEALTH]: 'speed',           
        [SkillType.THIEVERY]: 'speed',
        [SkillType.CRAFTING]: 'intellect',
        [SkillType.DEDUCTION]: 'intellect',
        [SkillType.DISCIPLINE]: 'willpower',
        [SkillType.INTIMIDATION]: 'willpower',
        [SkillType.LORE] : 'intellect',
        [SkillType.MEDICINE]: 'intellect',
        [SkillType.DECEPTION]: 'presence',
        [SkillType.INSIGHT]: 'awareness',
        [SkillType.LEADERSHIP]: 'presence',
        [SkillType.PERCEPTION]: 'awareness',
        [SkillType.PERSUASION]: 'presence',
        [SkillType.SURVIVAL]: 'awareness',
        // Surge skills - associated with Willpower (spiritual/internal power)
        [SkillType.ADHESION]: 'willpower',
        [SkillType.GRAVITATION]: 'willpower',
        [SkillType.DIVISION]: 'willpower',
        [SkillType.ABRASION]: 'willpower',
        [SkillType.PROGRESSION]: 'willpower',
        [SkillType.ILLUMINATION]: 'willpower',
        [SkillType.TRANSFORMATION]: 'willpower',
        [SkillType.TRANSPORTATION]: 'willpower',
        [SkillType.COHESION]: 'willpower',
        [SkillType.TENSION]: 'willpower',
    };

    checkSkillAssociation(skill: SkillType): keyof Attributes {
        return this.skillAssociationTable[skill];
    }
}
