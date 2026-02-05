/**
 * Level Up Manager Service
 * 
 * Handles character level-up progression:
 * - Increments character level
 * - Awards points from level tables to available points (pointsRemaining)
 * - Sets finalized: false on affected state records to unlock allocation UI
 * 
 * Range methods allow bulk multi-level processing for catch-ups
 */

import { characterRepository } from '../repositories/character-repository';
import {
  getAttributesRecord,
  updateAttributesRecord,
  getSkillsStateRecord,
  updateSkillsStateRecord,
  getTalentsStateRecord,
  updateTalentsStateRecord,
  getExpertiseStateRecord,
  updateExpertiseStateRecord
} from '../database';

export class LevelUpManager {
  // ATTRIBUTE POINTS: 12 at level 1, then +1 at levels 3,6,9,12,15,18 (up to level 21)
  private ATTRIBUTE_POINTS_PER_LEVEL = [12, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0];
  
  // SKILL POINTS: 4 at level 1, then 2 per level after (up to level 21)
  private SKILL_POINTS_PER_LEVEL = [4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2];
  
  // HEALTH GAINED: 10 + STR at level 1, then +5 to level 5, +4 to level 10, +3 to level 15, +2 to level 20, +1 at 21
  private HEALTH_PER_LEVEL = [10, 5, 5, 5, 5, 4, 4, 4, 4, 4, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 1];
  
  // ADD STRENGTH to health gained at these levels
  private HEALTH_STRENGTH_BONUS_LEVELS = [1, 6, 11, 16, 21];
  
  // MAX SKILL RANKS: +2 to level 5, +3 to level 10, +4 to level 15, +5 to level 21
  private MAX_SKILL_RANKS_PER_LEVEL = [2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5];
  
  // SKILL RANKS: 5 at level 1, then 2 per level to level 20, 0 at 21
  private SKILL_RANKS_PER_LEVEL = [5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0];
  
  // TALENT POINTS: 2 at levels 1,6,11,16 and 1 talent at all other levels
  private TALENT_POINTS_PER_LEVEL = [2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1];

  /**
   * Get attribute points awarded for a single level
   */
  private getAttributePointsForLevel(level: number): number {
    return this.ATTRIBUTE_POINTS_PER_LEVEL[level - 1] || 0;
  }

  /**
   * Get attribute points cumulatively awarded from minLevel to maxLevel (inclusive)
   */
  getAttributePointsRange(minLevel: number, maxLevel: number): number {
    let total = 0;
    for (let i = minLevel; i <= maxLevel; i++) {
      total += this.getAttributePointsForLevel(i);
    }
    return total;
  }

  /**
   * Get skill points awarded for a single level
   */
  private getSkillPointsForLevel(level: number): number {
    return this.SKILL_POINTS_PER_LEVEL[level - 1] || 0;
  }

  /**
   * Get skill points cumulatively awarded from minLevel to maxLevel (inclusive)
   */
  getSkillPointsRange(minLevel: number, maxLevel: number): number {
    let total = 0;
    for (let i = minLevel; i <= maxLevel; i++) {
      total += this.getSkillPointsForLevel(i);
    }
    return total;
  }

  /**
   * Get health gained for a single level (base, without attribute bonus)
   */
  private getHealthForLevel(level: number): number {
    return this.HEALTH_PER_LEVEL[level - 1] || 0;
  }

  /**
   * Get health points cumulatively from minLevel to maxLevel (inclusive)
   * Note: This is base health only. Strength bonus applied separately in combat calcs.
   */
  getHealthPointsRange(minLevel: number, maxLevel: number): number {
    let total = 0;
    for (let i = minLevel; i <= maxLevel; i++) {
      total += this.getHealthForLevel(i);
    }
    return total;
  }

  /**
   * Get max skill rank for a single level
   */
  private getMaxSkillRanksForLevel(level: number): number {
    return this.MAX_SKILL_RANKS_PER_LEVEL[level - 1] || 0;
  }

  /**
   * Get max skill ranks cumulatively from minLevel to maxLevel (inclusive)
   */
  getMaxSkillRanksRange(minLevel: number, maxLevel: number): number {
    let total = 0;
    for (let i = minLevel; i <= maxLevel; i++) {
      total += this.getMaxSkillRanksForLevel(i);
    }
    return total;
  }

  /**
   * Get skill rank points for a single level
   */
  private getSkillRanksForLevel(level: number): number {
    return this.SKILL_RANKS_PER_LEVEL[level - 1] || 0;
  }

  /**
   * Get skill rank points cumulatively from minLevel to maxLevel (inclusive)
   */
  getSkillRanksRange(minLevel: number, maxLevel: number): number {
    let total = 0;
    for (let i = minLevel; i <= maxLevel; i++) {
      total += this.getSkillRanksForLevel(i);
    }
    return total;
  }

  /**
   * Get talent points awarded for a single level
   */
  private getTalentPointsForLevel(level: number): number {
    return this.TALENT_POINTS_PER_LEVEL[level - 1] || 0;
  }

  /**
   * Get talent points cumulatively awarded from minLevel to maxLevel (inclusive)
   */
  getTalentPointsRange(minLevel: number, maxLevel: number): number {
    let total = 0;
    for (let i = minLevel; i <= maxLevel; i++) {
      total += this.getTalentPointsForLevel(i);
    }
    return total;
  }

  /**
   * Process a single level-up for a character
   * - Increments level by 1
   * - Awards points to pointsRemaining (available points)
   * - Sets finalized: false on affected state records
   * 
   * @param characterId - The character to level up
   * @throws Error if character not found or level >= 21
   */
  async processLevelUp(characterId: string): Promise<{
    success: boolean;
    newLevel?: number;
    attributePointsAwarded?: number;
    skillPointsAwarded?: number;
    talentPointsAwarded?: number;
    error?: string;
  }> {
    try {
      // Load character
      const character = await characterRepository.load(characterId);
      if (!character) {
        return { success: false, error: `Character ${characterId} not found` };
      }

      // Validate level is not maxed
      const newLevel = character.level + 1;
      if (newLevel > 21) {
        return { success: false, error: `Character already at max level 21` };
      }

      // Get points for the new level (range method with min=max=newLevel)
      const attributePoints = this.getAttributePointsRange(newLevel, newLevel);
      const skillPoints = this.getSkillPointsRange(newLevel, newLevel);
      const talentPoints = this.getTalentPointsRange(newLevel, newLevel);

      // Update character level
      character.level = newLevel;
      character.pendingLevel = true; // Set flag for level-up flow
      await characterRepository.progression.save(characterId, newLevel, character.pendingLevelPoints, true);

      // Update Attributes state: add points to pointsRemaining, set finalized: false
      if (attributePoints > 0) {
        const attrRecord = await getAttributesRecord(characterId);
        if (attrRecord) {
          await updateAttributesRecord(characterId, {
            pointsRemaining: (attrRecord.pointsRemaining || 0) + attributePoints,
            finalized: false
          });
        }
      }

      // Update SkillsState: add points to pointsRemaining, set finalized: false
      if (skillPoints > 0) {
        const skillsRecord = await getSkillsStateRecord(characterId);
        if (skillsRecord) {
          await updateSkillsStateRecord(characterId, {
            pointsRemaining: (skillsRecord.pointsRemaining || 0) + skillPoints,
            finalized: false
          });
        }
      }

      // Update CharacterTalents: add points to pointsRemaining, set finalized: false
      if (talentPoints > 0) {
        const talentsRecord = await getTalentsStateRecord(characterId);
        if (talentsRecord) {
          await updateTalentsStateRecord(characterId, {
            pointsRemaining: (talentsRecord.pointsRemaining || 0) + talentPoints,
            finalized: false
          });
        }
      }

      // Update Expertise: derived from Intellect, so we need to check if Intellect changed
      // For now, just set finalized: false if Intellect was awarded this level
      const intellectIncrease = attributePoints > 0 ? 1 : 0; // Intellect is one of 6 attributes
      if (intellectIncrease > 0) {
        const expertiseRecord = await getExpertiseStateRecord(characterId);
        if (expertiseRecord) {
          // Intellect increased, so expertise pool increased
          // Add the delta to pointsRemaining
          await updateExpertiseStateRecord(characterId, {
            pointsRemaining: (expertiseRecord.pointsRemaining || 0) + intellectIncrease,
            finalized: false
          });
        }
      }

      return {
        success: true,
        newLevel,
        attributePointsAwarded: attributePoints,
        skillPointsAwarded: skillPoints,
        talentPointsAwarded: talentPoints
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process multiple level-ups at once (for catch-up scenarios)
   * Calls processLevelUp for each level from currentLevel+1 to targetLevel
   * 
   * @param characterId - The character to level up
   * @param targetLevel - The level to reach
   * @returns Summary of all levels processed
   */
  async processMultipleLevelUps(characterId: string, targetLevel: number): Promise<{
    success: boolean;
    levelsProcessed: number;
    totalAttributePoints: number;
    totalSkillPoints: number;
    totalTalentPoints: number;
    errors?: string[];
  }> {
    const character = await characterRepository.load(characterId);
    if (!character) {
      return {
        success: false,
        levelsProcessed: 0,
        totalAttributePoints: 0,
        totalSkillPoints: 0,
        totalTalentPoints: 0,
        errors: [`Character ${characterId} not found`]
      };
    }

    const currentLevel = character.level;
    const errors: string[] = [];
    let totalAttributePoints = 0;
    let totalSkillPoints = 0;
    let totalTalentPoints = 0;

    for (let level = currentLevel + 1; level <= targetLevel && level <= 21; level++) {
      const result = await this.processLevelUp(characterId);
      if (!result.success) {
        errors.push(`Failed to process level ${level}: ${result.error}`);
      } else {
        totalAttributePoints += result.attributePointsAwarded || 0;
        totalSkillPoints += result.skillPointsAwarded || 0;
        totalTalentPoints += result.talentPointsAwarded || 0;
      }
    }

    return {
      success: errors.length === 0,
      levelsProcessed: Math.min(targetLevel, 21) - currentLevel,
      totalAttributePoints,
      totalSkillPoints,
      totalTalentPoints,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Get finalization status for all categories
   * Returns which categories are finalized and which need updating for level-up
   * 
   * @param characterId - The character to check
   * @returns Status object with finalized flags and first unfinalzed step
   */
  async getLevelUpStatus(characterId: string): Promise<{
    success: boolean;
    attributesFinalized: boolean;
    skillsFinalized: boolean;
    talentsFinalized: boolean;
    expertiseFinalized: boolean;
    firstUnfinalizedStep: string | null;
    error?: string;
  }> {
    try {
      const attributesRecord = await getAttributesRecord(characterId);
      const skillsRecord = await getSkillsStateRecord(characterId);
      const talentsRecord = await getTalentsStateRecord(characterId);
      const expertiseRecord = await getExpertiseStateRecord(characterId);

      const attributesFinalized = attributesRecord?.finalized ?? true;
      const skillsFinalized = skillsRecord?.finalized ?? true;
      const talentsFinalized = talentsRecord?.finalized ?? true;
      const expertiseFinalized = expertiseRecord?.finalized ?? true;

      // Determine first unfinalzed step
      let firstUnfinalizedStep: string | null = null;
      if (!attributesFinalized) {
        firstUnfinalizedStep = 'attributes';
      } else if (!skillsFinalized) {
        firstUnfinalizedStep = 'skills';
      } else if (!talentsFinalized) {
        firstUnfinalizedStep = 'talents';
      } else if (!expertiseFinalized) {
        firstUnfinalizedStep = 'expertise';
      }

      return {
        success: true,
        attributesFinalized,
        skillsFinalized,
        talentsFinalized,
        expertiseFinalized,
        firstUnfinalizedStep
      };
    } catch (error) {
      return {
        success: false,
        attributesFinalized: true,
        skillsFinalized: true,
        talentsFinalized: true,
        expertiseFinalized: true,
        firstUnfinalizedStep: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const levelUpManager = new LevelUpManager();
