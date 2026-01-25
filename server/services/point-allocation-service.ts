/**
 * Point Allocation Service
 * 
 * Business logic for managing point allocations across character progression.
 * Calculates available points, validates allocations, tracks spent points.
 * 
 * This is the authoritative backend service for point allocation accuracy.
 * All frontend point allocation decisions should be validated here.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ATTRIBUTE_POINTS_PER_LEVEL,
  SKILL_POINTS_PER_LEVEL,
  TALENT_POINTS_PER_LEVEL,
  getTotalAttributePointsUpToLevel,
  getTotalSkillPointsUpToLevel,
  getTotalTalentPointsUpToLevel,
  getAttributePointsForLevel,
  getSkillPointsForLevel,
  getTalentPointsForLevel
} from './calculation-constants';

/**
 * Represents character attributes with their point values
 */
export interface Attributes {
  strength?: number;
  quickness?: number;
  intellect?: number;
  awareness?: number;
  will?: number;
  presence?: number;
}

/**
 * Represents skill allocations {skillName: rank}
 */
export interface Skills {
  [skillName: string]: number;
}

/**
 * Represents talent allocations {talentId: true}
 */
export interface Talents {
  [talentId: string]: boolean;
}

/**
 * Response when fetching allocation state for a level
 */
export interface AllocationSlice {
  currentLevel: number;
  isCreation: boolean;
  currentAllocations: Attributes | Skills | Talents;
  pointsAvailable: number;
  pointsSpent: number;
  pointsTotal: number;
  canProceed: boolean;
  validation: {
    valid: boolean;
    message: string;
  };
}

/**
 * Validation result for allocations
 */
export interface ValidationResult {
  valid: boolean;
  message: string;
  pointsRemaining?: number;
}

/**
 * Point allocation service class
 */
export class PointAllocationService {
  /**
   * Calculate total points available for attributes up to a level
   */
  getTotalAttributePointsAvailable(level: number): number {
    return getTotalAttributePointsUpToLevel(level);
  }

  /**
   * Calculate total points available for skills up to a level
   */
  getTotalSkillPointsAvailable(level: number): number {
    return getTotalSkillPointsUpToLevel(level);
  }

  /**
   * Calculate total points available for talents up to a level
   */
  getTotalTalentPointsAvailable(level: number): number {
    return getTotalTalentPointsUpToLevel(level);
  }

  /**
   * Validate attribute allocation for a level
   * 
   * Rules:
   * - All 6 attributes must be defined
   * - Minimum value: 1
   * - Maximum value: varies by level
   * - Total spent must equal total available for the level
   */
  validateAttributeAllocation(
    level: number,
    currentAllocations: Attributes,
    previousAllocations: Attributes = {}
  ): ValidationResult {
    const attributeNames = ['strength', 'quickness', 'intellect', 'awareness', 'will', 'presence'] as const;
    const totalAvailable = this.getTotalAttributePointsAvailable(level);

    // Check all attributes are defined
    for (const attr of attributeNames) {
      if (currentAllocations[attr] === undefined || currentAllocations[attr] === null) {
        return {
          valid: false,
          message: `Missing attribute: ${attr}`
        };
      }

      if (typeof currentAllocations[attr] !== 'number') {
        return {
          valid: false,
          message: `Invalid value for ${attr}: must be a number`
        };
      }

      if (currentAllocations[attr] < 1) {
        return {
          valid: false,
          message: `${attr} must be at least 1`
        };
      }
    }

    // Calculate total spent
    const totalSpent = attributeNames.reduce(
      (sum, attr) => sum + (currentAllocations[attr] || 0),
      0
    );

    // Calculate previous total
    const previousTotal = attributeNames.reduce(
      (sum, attr) => sum + (previousAllocations[attr] || 0),
      0
    );

    const expectedTotal = previousTotal + (level === 1 ? totalAvailable : getAttributePointsForLevel(level));

    if (totalSpent !== expectedTotal) {
      return {
        valid: false,
        message: `Total points incorrect. Expected ${expectedTotal}, got ${totalSpent}`,
        pointsRemaining: expectedTotal - totalSpent
      };
    }

    return {
      valid: true,
      message: 'Attributes valid'
    };
  }

  /**
   * Validate skill allocation for a level
   * 
   * Rules:
   * - Each skill can be ranked 0-5 (or max for level)
   * - Total points spent must equal total available
   * - Ranks cannot decrease
   */
  validateSkillAllocation(
    level: number,
    currentAllocations: Skills,
    previousAllocations: Skills = {}
  ): ValidationResult {
    const totalAvailable = this.getTotalSkillPointsAvailable(level);
    const levelPoints = getSkillPointsForLevel(level);

    if (!currentAllocations || typeof currentAllocations !== 'object') {
      return {
        valid: false,
        message: 'Skills must be an object'
      };
    }

    // Check no skill ranks decreased
    for (const [skillName, rank] of Object.entries(currentAllocations)) {
      if (typeof rank !== 'number' || rank < 0 || rank > 5) {
        return {
          valid: false,
          message: `Invalid rank for ${skillName}: must be 0-5`
        };
      }

      const previousRank = previousAllocations[skillName] ?? 0;
      if (rank < previousRank) {
        return {
          valid: false,
          message: `Cannot decrease ${skillName} rank from ${previousRank} to ${rank}`
        };
      }
    }

    // Calculate points spent this level
    let pointsSpentThisLevel = 0;
    for (const [skillName, currentRank] of Object.entries(currentAllocations)) {
      const previousRank = previousAllocations[skillName] ?? 0;
      const rankIncrease = currentRank - previousRank;
      pointsSpentThisLevel += rankIncrease;
    }

    if (pointsSpentThisLevel !== levelPoints) {
      return {
        valid: false,
        message: `Points spent this level incorrect. Expected ${levelPoints}, spent ${pointsSpentThisLevel}`,
        pointsRemaining: levelPoints - pointsSpentThisLevel
      };
    }

    return {
      valid: true,
      message: 'Skills valid'
    };
  }

  /**
   * Validate talent allocation for a level
   * 
   * Rules:
   * - Each talent can only be selected once (true/false map)
   * - Talents cannot be unselected
   * - Must spend exactly the available points for this level
   * - Respects tier 0 auto-unlock
   */
  validateTalentAllocation(
    level: number,
    currentTalents: Talents,
    previousTalents: Talents = {},
    tier0TalentId?: string | null
  ): ValidationResult {
    const pointsAvailable = getTalentPointsForLevel(level);

    if (!currentTalents || typeof currentTalents !== 'object') {
      return {
        valid: false,
        message: 'Talents must be an object'
      };
    }

    // Count new talents selected this level
    let newTalentsThisLevel = 0;
    for (const [talentId, selected] of Object.entries(currentTalents)) {
      if (selected === true) {
        const wasSelected = previousTalents[talentId] === true;
        if (!wasSelected) {
          newTalentsThisLevel++;
        }
      } else if (selected === false) {
        // Check talent wasn't already selected (cannot unselect)
        const wasSelected = previousTalents[talentId] === true;
        if (wasSelected) {
          return {
            valid: false,
            message: `Cannot unselect talent: ${talentId}`
          };
        }
      }
    }

    // At level 1, tier 0 talent is auto-selected (counts as 1 point spent)
    let expectedNewTalents = pointsAvailable;
    if (level === 1 && tier0TalentId) {
      expectedNewTalents = pointsAvailable - 1;
    }

    if (newTalentsThisLevel !== expectedNewTalents) {
      return {
        valid: false,
        message: `Talents selected incorrect. Expected ${expectedNewTalents}, got ${newTalentsThisLevel}`,
        pointsRemaining: expectedNewTalents - newTalentsThisLevel
      };
    }

    return {
      valid: true,
      message: 'Talents valid'
    };
  }

  /**
   * Get allocation slice for attributes (current state + points available)
   * Called by frontend when entering attribute allocation step
   */
  getAttributeSlice(
    level: number,
    currentAttributes: Attributes = {},
    isCreation: boolean = false
  ): AllocationSlice {
    const pointsTotal = this.getTotalAttributePointsAvailable(level);
    
    // Calculate points spent so far
    const attributeNames = ['strength', 'quickness', 'intellect', 'awareness', 'will', 'presence'] as const;
    let pointsSpent = 0;
    let definedCount = 0;

    for (const attr of attributeNames) {
      if (currentAttributes[attr] !== undefined && currentAttributes[attr] !== null) {
        pointsSpent += currentAttributes[attr];
        definedCount++;
      }
    }

    // Points available this level (not cumulative, just this level)
    const levelPoints = isCreation && level === 1 ? 12 : getAttributePointsForLevel(level);
    const pointsAvailable = levelPoints;
    const pointsRemaining = pointsAvailable - (pointsSpent - (level === 1 ? 0 : this.getTotalAttributePointsAvailable(level - 1)));

    // Can proceed if all attributes are allocated and points match exactly
    const validation = this.validateAttributeAllocation(level, currentAttributes);
    const canProceed = validation.valid;

    return {
      currentLevel: level,
      isCreation,
      currentAllocations: currentAttributes,
      pointsAvailable,
      pointsSpent,
      pointsTotal,
      canProceed,
      validation
    };
  }

  /**
   * Get allocation slice for skills
   */
  getSkillSlice(
    level: number,
    currentSkills: Skills = {},
    previousSkills: Skills = {},
    isCreation: boolean = false
  ): AllocationSlice {
    const pointsTotal = this.getTotalSkillPointsAvailable(level);
    const levelPoints = isCreation && level === 1 ? 4 : getSkillPointsForLevel(level);

    // Calculate points spent this level
    let pointsSpentThisLevel = 0;
    for (const [skillName, currentRank] of Object.entries(currentSkills)) {
      const previousRank = previousSkills[skillName] ?? 0;
      pointsSpentThisLevel += currentRank - previousRank;
    }

    const pointsRemaining = levelPoints - pointsSpentThisLevel;

    const validation = this.validateSkillAllocation(level, currentSkills, previousSkills);
    const canProceed = validation.valid;

    return {
      currentLevel: level,
      isCreation,
      currentAllocations: currentSkills,
      pointsAvailable: levelPoints,
      pointsSpent: pointsSpentThisLevel,
      pointsTotal,
      canProceed,
      validation
    };
  }

  /**
   * Get allocation slice for talents
   */
  getTalentSlice(
    level: number,
    currentTalents: Talents = {},
    previousTalents: Talents = {},
    tier0TalentId?: string | null,
    isCreation: boolean = false
  ): AllocationSlice {
    const pointsTotal = this.getTotalTalentPointsAvailable(level);
    const levelPoints = getTalentPointsForLevel(level);

    // Count talents selected this level
    let talentsSelectedThisLevel = 0;
    for (const [talentId, selected] of Object.entries(currentTalents)) {
      if (selected === true && previousTalents[talentId] !== true) {
        talentsSelectedThisLevel++;
      }
    }

    // At level 1, tier 0 talent is auto-selected
    let expectedNewTalents = levelPoints;
    if (level === 1 && tier0TalentId) {
      expectedNewTalents = levelPoints - 1;
    }

    const pointsRemaining = expectedNewTalents - talentsSelectedThisLevel;

    const validation = this.validateTalentAllocation(level, currentTalents, previousTalents, tier0TalentId);
    const canProceed = validation.valid;

    return {
      currentLevel: level,
      isCreation,
      currentAllocations: currentTalents,
      pointsAvailable: levelPoints,
      pointsSpent: talentsSelectedThisLevel,
      pointsTotal,
      canProceed,
      validation
    };
  }
}

// Export singleton instance
export const pointAllocationService = new PointAllocationService();
