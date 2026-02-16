/**
 * Skill Calculations Service
 * 
 * Handles all skill total calculations and validations.
 * Skill Total = Skill Rank + (Associated Attribute Value / 2)
 * 
 * This service is the single source of truth for skill calculations.
 * Prevents frontend from duplicating calculation logic.
 */

/**
 * Attributes interface
 */
export interface Attributes {
  strength?: number;
  quickness?: number;
  intellect?: number;
  awareness?: number;
  willpower?: number;
  presence?: number;
}

/**
 * Skill ranks map {skillName: rank}
 */
export interface SkillRanks {
  [skillName: string]: number;
}

/**
 * Skill total result
 */
export interface SkillTotal {
  skillName: string;
  rank: number;
  attributeModifier: number;
  total: number;
  associatedAttribute: string;
}

/**
 * All skill totals for a character
 */
export interface AllSkillTotals {
  [skillName: string]: SkillTotal;
}

/**
 * Skill association mapping
 * Maps skill names to their associated attributes
 */
export const SKILL_ASSOCIATIONS: Record<string, keyof Attributes> = {
  // Physical Skills
  'AGILITY': 'quickness',
  'ATHLETICS': 'strength',
  'HEAVY_WEAPONRY': 'strength',
  'LIGHT_WEAPONRY': 'quickness',
  'STEALTH': 'quickness',
  'THIEVERY': 'quickness',

  // Mental/Cognitive Skills
  'CRAFTING': 'intellect',
  'DEDUCTION': 'intellect',
  'DISCIPLINE': 'willpower',
  'INTIMIDATION': 'willpower',
  'LORE': 'intellect',
  'MEDICINE': 'intellect',

  // Social Skills
  'DECEPTION': 'presence',
  'INSIGHT': 'awareness',
  'LEADERSHIP': 'presence',
  'PERCEPTION': 'awareness',
  'PERSUASION': 'presence',
  'SURVIVAL': 'awareness',

  // Surge Skills (all associated with willpower)
  'ADHESION': 'willpower',
  'GRAVITATION': 'willpower',
  'DIVISION': 'willpower',
  'ABRASION': 'willpower',
  'PROGRESSION': 'willpower',
  'ILLUMINATION': 'willpower',
  'TRANSFORMATION': 'willpower',
  'TRANSPORTATION': 'willpower',
  'COHESION': 'willpower',
  'TENSION': 'willpower'
};

/**
 * List of surge skills for easy filtering
 */
export const SURGE_SKILLS = [
  'ADHESION',
  'GRAVITATION',
  'DIVISION',
  'ABRASION',
  'PROGRESSION',
  'ILLUMINATION',
  'TRANSFORMATION',
  'TRANSPORTATION',
  'COHESION',
  'TENSION'
];

/**
 * Skill Calculations Service
 */
export class SkillCalculationsService {
  /**
   * Get the associated attribute for a skill
   * 
   * @param skillName - Name of the skill
   * @returns Associated attribute name
   */
  getSkillAssociation(skillName: string): string {
    const association = SKILL_ASSOCIATIONS[skillName];
    if (!association) {
      throw new Error(`Unknown skill: ${skillName}`);
    }
    return association;
  }

  /**
   * Check if a skill is a surge skill
   * 
   * @param skillName - Name of the skill
   * @returns True if surge skill
   */
  isSurgeSkill(skillName: string): boolean {
    return SURGE_SKILLS.includes(skillName);
  }

  /**
   * Calculate attribute modifier (attribute value / 2, rounded down)
   * 
   * @param attributeValue - The attribute value
   * @returns Modifier (value / 2, rounded down)
   */
  calculateAttributeModifier(attributeValue: number = 0): number {
    if (attributeValue < 0) {
      throw new Error('Attribute value cannot be negative');
    }
    return Math.floor(attributeValue / 2);
  }

  /**
   * Calculate total for a single skill
   * Total = Rank + (Associated Attribute / 2)
   * 
   * @param skillName - Name of the skill
   * @param rank - Skill rank (0-5)
   * @param attributes - Character's attributes
   * @returns Skill total with breakdown
   */
  calculateSkillTotal(
    skillName: string,
    rank: number = 0,
    attributes: Attributes = {}
  ): SkillTotal {
    // Validate skill exists
    const associatedAttribute = this.getSkillAssociation(skillName);
    
    // Get attribute value
    const attributeValue = attributes[associatedAttribute as keyof Attributes] || 0;

    // Calculate modifier
    const attributeModifier = this.calculateAttributeModifier(attributeValue);

    // Calculate total
    const total = rank + attributeModifier;

    return {
      skillName,
      rank,
      attributeModifier,
      total,
      associatedAttribute
    };
  }

  /**
   * Calculate totals for all skills
   * 
   * @param skillRanks - Map of {skillName: rank}
   * @param attributes - Character's attributes
   * @returns Map of all skill totals
   */
  calculateAllSkillTotals(
    skillRanks: SkillRanks = {},
    attributes: Attributes = {}
  ): AllSkillTotals {
    const results: AllSkillTotals = {};

    // Calculate total for each known skill
    for (const skillName of Object.keys(SKILL_ASSOCIATIONS)) {
      const rank = skillRanks[skillName] || 0;
      results[skillName] = this.calculateSkillTotal(skillName, rank, attributes);
    }

    return results;
  }

  /**
   * Get all surge skill totals
   * 
   * @param skillRanks - Map of {skillName: rank}
   * @param attributes - Character's attributes
   * @returns Map of surge skill totals only
   */
  calculateSurgeSkillTotals(
    skillRanks: SkillRanks = {},
    attributes: Attributes = {}
  ): AllSkillTotals {
    const allTotals = this.calculateAllSkillTotals(skillRanks, attributes);
    const surgeTotals: AllSkillTotals = {};

    for (const skillName of SURGE_SKILLS) {
      if (allTotals[skillName]) {
        surgeTotals[skillName] = allTotals[skillName];
      }
    }

    return surgeTotals;
  }

  /**
   * Get all non-surge skill totals
   * 
   * @param skillRanks - Map of {skillName: rank}
   * @param attributes - Character's attributes
   * @returns Map of non-surge skill totals only
   */
  calculateNonSurgeSkillTotals(
    skillRanks: SkillRanks = {},
    attributes: Attributes = {}
  ): AllSkillTotals {
    const allTotals = this.calculateAllSkillTotals(skillRanks, attributes);
    const nonSurgeTotals: AllSkillTotals = {};

    for (const skillName of Object.keys(SKILL_ASSOCIATIONS)) {
      if (!SURGE_SKILLS.includes(skillName) && allTotals[skillName]) {
        nonSurgeTotals[skillName] = allTotals[skillName];
      }
    }

    return nonSurgeTotals;
  }

  /**
   * Get skills by attribute category
   * 
   * @param skillRanks - Map of {skillName: rank}
   * @param attributes - Character's attributes
   * @param attribute - Which attribute to filter by (e.g., 'strength')
   * @returns Map of skills associated with that attribute
   */
  calculateSkillsByAttribute(
    attribute: keyof Attributes,
    skillRanks: SkillRanks = {},
    attributes: Attributes = {}
  ): AllSkillTotals {
    const allTotals = this.calculateAllSkillTotals(skillRanks, attributes);
    const filtered: AllSkillTotals = {};

    for (const [skillName, skillTotal] of Object.entries(allTotals)) {
      if (skillTotal.associatedAttribute === attribute) {
        filtered[skillName] = skillTotal;
      }
    }

    return filtered;
  }

  /**
   * Validate skill rank
   * 
   * @param rank - Skill rank
   * @param maxRank - Maximum allowed rank (default 5)
   * @returns Validation result
   */
  validateSkillRank(rank: number, maxRank: number = 5): { valid: boolean; error?: string } {
    if (typeof rank !== 'number') {
      return { valid: false, error: 'Rank must be a number' };
    }
    if (rank < 0) {
      return { valid: false, error: 'Rank cannot be negative' };
    }
    if (rank > maxRank) {
      return { valid: false, error: `Rank cannot exceed ${maxRank}` };
    }
    return { valid: true };
  }

  /**
   * Validate all skill ranks
   * 
   * @param skillRanks - Map of {skillName: rank}
   * @param maxRank - Maximum allowed rank
   * @returns Validation result with any errors
   */
  validateAllSkillRanks(
    skillRanks: SkillRanks,
    maxRank: number = 5
  ): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    for (const [skillName, rank] of Object.entries(skillRanks)) {
      const validation = this.validateSkillRank(rank, maxRank);
      if (!validation.valid) {
        errors[skillName] = validation.error || 'Invalid rank';
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Validate attributes object
   * 
   * @param attributes - Attributes to validate
   * @returns Validation result
   */
  validateAttributes(attributes: Attributes): { valid: boolean; error?: string } {
    if (!attributes || typeof attributes !== 'object') {
      return { valid: false, error: 'Attributes must be an object' };
    }

    const attributeNames = ['strength', 'quickness', 'intellect', 'awareness', 'willpower', 'presence'];
    for (const attr of attributeNames) {
      if (attributes[attr as keyof Attributes] !== undefined) {
        const value = attributes[attr as keyof Attributes];
        if (typeof value !== 'number') {
          return { valid: false, error: `${attr} must be a number` };
        }
        if (value < 0) {
          return { valid: false, error: `${attr} cannot be negative` };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Get highest skill rank
   * 
   * @param skillRanks - Map of {skillName: rank}
   * @returns Highest rank value
   */
  getHighestSkillRank(skillRanks: SkillRanks = {}): number {
    return Math.max(0, ...Object.values(skillRanks));
  }

  /**
   * Get highest skill total
   * 
   * @param skillRanks - Map of {skillName: rank}
   * @param attributes - Character's attributes
   * @returns Highest total value
   */
  getHighestSkillTotal(skillRanks: SkillRanks = {}, attributes: Attributes = {}): number {
    const allTotals = this.calculateAllSkillTotals(skillRanks, attributes);
    return Math.max(0, ...Object.values(allTotals).map(s => s.total));
  }

  /**
   * Get average skill rank
   * 
   * @param skillRanks - Map of {skillName: rank}
   * @returns Average rank
   */
  getAverageSkillRank(skillRanks: SkillRanks = {}): number {
    if (Object.keys(skillRanks).length === 0) return 0;
    const sum = Object.values(skillRanks).reduce((a, b) => a + b, 0);
    return sum / Object.keys(skillRanks).length;
  }

  /**
   * Get average skill total
   * 
   * @param skillRanks - Map of {skillName: rank}
   * @param attributes - Character's attributes
   * @returns Average total
   */
  getAverageSkillTotal(skillRanks: SkillRanks = {}, attributes: Attributes = {}): number {
    const allTotals = this.calculateAllSkillTotals(skillRanks, attributes);
    const totals = Object.values(allTotals).map(s => s.total);
    if (totals.length === 0) return 0;
    return totals.reduce((a, b) => a + b, 0) / totals.length;
  }
}

// Export singleton instance
export const skillCalculationsService = new SkillCalculationsService();
