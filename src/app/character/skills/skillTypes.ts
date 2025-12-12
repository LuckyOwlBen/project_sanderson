export enum SkillType {
    AGILITY = 'AGILITY',
    ATHLETICS = 'ATHLETICS',
    HEAVY_WEAPONRY = 'HEAVY_WEAPONRY',
    LIGHT_WEAPONRY = 'LIGHT_WEAPONRY',
    STEALTH = 'STEALTH',
    THIEVERY = 'THIEVERY',
    CRAFTING = 'CRAFTING',
    DEDUCTION = 'DEDUCTION',
    DISCIPLINE = 'DISCIPLINE',
    INTIMIDATION = 'INTIMIDATION',
    LORE = 'LORE',
    MEDICINE = 'MEDICINE',
    DECEPTION = 'DECEPTION',
    INSIGHT = 'INSIGHT',
    LEADERSHIP = 'LEADERSHIP',
    PERCEPTION = 'PERCEPTION',
    PERSUASION = 'PERSUASION',
    SURVIVAL = 'SURVIVAL',
    // Surge Skills
    ADHESION = 'ADHESION',
    GRAVITATION = 'GRAVITATION',
    DIVISION = 'DIVISION',
    ABRASION = 'ABRASION',
    PROGRESSION = 'PROGRESSION',
    ILLUMINATION = 'ILLUMINATION',
    TRANSFORMATION = 'TRANSFORMATION',
    TRANSPORTATION = 'TRANSPORTATION',
    COHESION = 'COHESION',
    TENSION = 'TENSION',
}

// Helper to check if a skill is a surge skill
export function isSurgeSkill(skill: SkillType): boolean {
    return [
        SkillType.ADHESION,
        SkillType.GRAVITATION,
        SkillType.DIVISION,
        SkillType.ABRASION,
        SkillType.PROGRESSION,
        SkillType.ILLUMINATION,
        SkillType.TRANSFORMATION,
        SkillType.TRANSPORTATION,
        SkillType.COHESION,
        SkillType.TENSION,
    ].includes(skill);
}