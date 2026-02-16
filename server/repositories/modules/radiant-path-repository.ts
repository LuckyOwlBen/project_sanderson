/**
 * RadiantPathRepository - MODULE: RADIANT PATH
 * Handles Radiant Order, spren bonding, ideals, and surge pair tracking
 */

import { BaseModuleRepository, SaveResult } from './base-module-repository';

export interface RadiantPathData {
  boundOrder: string | null;
  currentIdeal: number;
  idealSpoken: boolean;
  surgePair: string | null;
  sprenType: string | null;
  radiantTier0TalentId?: string | null;
}

export class RadiantPathModuleRepository extends BaseModuleRepository {
  /**
   * Save radiant path module (boundOrder, currentIdeal, surgePair, sprenType)
   * @param characterId - Character ID
   * @param data - Radiant path data to save
   */
  async save(characterId: string, data: RadiantPathData): Promise<SaveResult> {
    return await this.updateCharacterModule(characterId, {
      radiantPath: data,
    });
  }

  /**
   * Load radiant path module data
   * @param characterId - Character ID
   * @returns Radiant path data or null
   */
  async load(characterId: string): Promise<RadiantPathData | null> {
    const char = await this.loadCharacterData(characterId);
    if (!char || !char.radiantPath) return null;
    return {
      boundOrder: char.radiantPath.boundOrder || null,
      currentIdeal: char.radiantPath.currentIdeal || 1,
      idealSpoken: char.radiantPath.idealSpoken || false,
      surgePair: char.radiantPath.surgePair || null,
      sprenType: char.radiantPath.sprenType || null,
    };
  }

  /**
   * Add or update a spren bond for a character
   * @param characterId - Character ID
   * @param order - Radiant Order name (e.g., "Windrunner")
   * @param sprenType - Type of spren (e.g., "Honorspren")
   * @param surgePair - The surges (e.g., "Adhesion/Gravitation")
   * @param philosophy - First ideal philosophy
   * @param radiantTier0TalentId - The tier 0 talent ID for this radiant order
   */
  async addSpren(
    characterId: string,
    order: string,
    sprenType: string,
    surgePair: string[],
    philosophy: string,
    radiantTier0TalentId?: string | null
  ): Promise<SaveResult> {
    const surgePairString = surgePair.join('/');

    return await this.updateCharacterModule(characterId, {
      radiantPath: {
        boundOrder: order,
        sprenType,
        surgePair: surgePairString,
        currentIdeal: 1,
        idealSpoken: false,
        radiantTier0TalentId: radiantTier0TalentId || null,
      },
      radiantTier0TalentId: radiantTier0TalentId || null,
    });
  }

  /**
   * Speak an ideal for a character's radiant path
   * @param characterId - Character ID
   * @param idealNumber - The ideal number (1-4)
   */
  async speakIdeal(characterId: string, idealNumber: number): Promise<SaveResult> {
    return await this.updateCharacterModule(characterId, {
      radiantPath: {
        currentIdeal: idealNumber,
        idealSpoken: true,
      },
    });
  }

  /**
   * Check if a character has a spren bonded
   * @param characterId - Character ID
   * @returns True if spren is bonded
   */
  async hasSpren(characterId: string): Promise<boolean> {
    const data = await this.load(characterId);
    return data !== null && data.sprenType !== null;
  }
}
