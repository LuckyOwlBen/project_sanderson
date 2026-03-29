/**
 * Character Navigation Finalized Service
 * 
 * Provides tri-state status for character creation/level-up steps.
 * This service is the single source of truth for what steps need action
 * in a character's progression. Used by frontend to display nav button colors.
 * 
 * States:
 *   'pending'   – Has unspent points or selection not yet made (Gold)
 *   'spent'     – All points spent / selection made, still editable (Green)
 *   'finalized' – Locked via Review page finalize, read-only (Blue)
 */

import {
  getAttributesRecord,
  getSkillsStateRecord,
  getTalentsStateRecord,
  getExpertiseStateRecord,
  getPathsFinalized,
  loadCharacter
} from '../database';

export type StepState = 'pending' | 'spent' | 'finalized';

export interface NavigationFinalizedStatus {
  ancestry: StepState;
  culture: StepState;
  name: StepState;
  attributes: StepState;
  expertises: StepState;
  skills: StepState;
  paths: StepState;
  talents: StepState;
  equipment: StepState;
}

export class CharacterNavFinalizedService {
  /**
   * Derive tri-state for a point-based step from its DB record.
   */
  private pointStepState(record: { finalized: boolean; pointsRemaining: number } | null): StepState {
    if (!record) return 'pending';
    if (record.finalized) return 'finalized';
    return record.pointsRemaining > 0 ? 'pending' : 'spent';
  }

  /**
   * Get navigation status for a character.
   * Returns a tri-state for each creation/level-up step.
   * 
   * @param characterId - Character to query
   * @returns Navigation status object with tri-state per step
   */
  async getNavigationFinalized(characterId: string): Promise<NavigationFinalizedStatus> {
    try {
      const character = await loadCharacter(characterId);
      if (!character) {
        throw new Error(`Character ${characterId} not found`);
      }

      // Load state records for point-based steps
      const attrs = await getAttributesRecord(characterId);
      const skills = await getSkillsStateRecord(characterId);
      const talents = await getTalentsStateRecord(characterId);
      const expertise = await getExpertiseStateRecord(characterId);

      // Point-based steps use the helper
      const attributesState = this.pointStepState(attrs);
      const skillsState = this.pointStepState(skills);
      const talentsState = this.pointStepState(talents);
      const expertisesState = this.pointStepState(expertise);

      // Selection-based steps: pending if empty, finalized if all point-steps are finalized, otherwise spent
      const allPointStepsFinalized =
        attributesState === 'finalized' &&
        skillsState === 'finalized' &&
        talentsState === 'finalized' &&
        expertisesState === 'finalized';

      const hasAncestry = !!character.ancestry;
      const hasCulture = (character.cultures?.length ?? 0) > 0;
      const hasName = !!(character.name && character.name.length > 0) && character.name !== 'Unnamed';

      const selectionState = (hasValue: boolean): StepState => {
        if (!hasValue) return 'pending';
        return allPointStepsFinalized ? 'finalized' : 'spent';
      };

      // Paths: selected = spent, finalized column = finalized, no selection = pending
      const pathsFinalized = await getPathsFinalized(characterId);
      const hasPath = (character.paths?.length ?? 0) > 0;
      let pathsState: StepState = 'pending';
      if (pathsFinalized) {
        pathsState = 'finalized';
      } else if (hasPath) {
        pathsState = 'spent';
      }

      // Equipment: pending until a kit is selected; spent until all point steps finalized; then finalized
      const equipmentState: StepState = !character.selectedKitId
        ? 'pending'
        : allPointStepsFinalized ? 'finalized' : 'spent';

      return {
        ancestry: selectionState(hasAncestry),
        culture: selectionState(hasCulture),
        name: selectionState(hasName),
        attributes: attributesState,
        expertises: expertisesState,
        skills: skillsState,
        paths: pathsState,
        talents: talentsState,
        equipment: equipmentState
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[CharacterNavFinalized] Error getting navigation status for ${characterId}:`, message);
      throw error;
    }
  }

  /**
   * Get status for a specific step
   */
  async getStepStatus(characterId: string, step: string): Promise<StepState> {
    const status = await this.getNavigationFinalized(characterId);
    return (status as any)[step] ?? 'pending';
  }
}

// Singleton export
export const characterNavFinalizedService = new CharacterNavFinalizedService();
