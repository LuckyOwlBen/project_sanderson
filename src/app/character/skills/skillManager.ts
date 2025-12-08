import { Attributes } from "../attributes/attributes";
import { SkillAssociationTable } from "./skillAssociationTable";
import { SkillType } from "./skillTypes";

export type SkillRanks = Record<SkillType, number>; //0-5 ranks

export class SkillManager {

    private skillRanks: SkillRanks;
    private skillAssociationTable = new SkillAssociationTable();
    constructor() {
        this.skillRanks =  this.createDefaultSkills();
    }

    private createDefaultSkills(): SkillRanks {
        const skills = {} as SkillRanks;
        Object.values(SkillType).forEach(skill => {
            skills[skill] = 0;
        });
        return skills;
    }

    getSkillRank(skill: SkillType): number {
        return this.skillRanks[skill];
    }

    setSkillRank(skill: SkillType, rank: number): void {
        this.skillRanks[skill] = Math.max(0, Math.min(5, rank));
    }

     calculateSkillTotal(skill: SkillType, attributes: Attributes): number {
        const skillRank = this.skillRanks[skill];
        const associatedAttribute = this.skillAssociationTable.checkSkillAssociation(skill);
        const attributeValue = attributes.getAttribute(associatedAttribute);
        return skillRank + attributeValue;
    }

    getAllSkillTotals(attributes: Attributes): Record<SkillType, number> {
        const totals = {} as Record<SkillType, number>;
        Object.values(SkillType).forEach(skill => {
            totals[skill] = this.calculateSkillTotal(skill, attributes);
        });
        return totals;
    }

    getAllSkillRanks(): SkillRanks {
        return { ...this.skillRanks };
    }

    checkStringForMatchingSkill(skillString: string): SkillType | null {
        const formattedString = skillString.trim().toLowerCase();
        for (const skill of Object.values(SkillType)) {
            if (skill.toLowerCase() === formattedString) {
                return skill;
            }
        }
        return null;
    }
}