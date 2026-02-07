import * as path from 'path';
import * as fsPromises from 'fs/promises';
import { Character } from '../character/character';
import { createEmptyCharacterDTO } from '../data-access/character-dto';
import { characterRepository } from '../repositories/character-repository';
import { pointAllocationService } from './point-allocation-service';
import { createAttributesRecord, createSkillsStateRecord, createTalentsStateRecord, createExpertiseStateRecord } from '../database';
import { getTotalTalentPointsUpToLevel } from './calculation-constants';

/**
 * Create a new character with minimal data and generated ID
 * Initializes attributes with 12 starting points
 * Uses the new repository pattern to create and save a Character instance
 * @param charactersDir - Directory to store character files (for backward compatibility)
 * @returns Response with success, character ID, and hydrated Character instance
 */
export async function createCharacter(charactersDir: string): Promise<{ success: boolean; id: string; character: Character }> {
  try {
    const timestamp = Date.now();
    const id = `character_${timestamp}`;
    
    // Create empty character DTO
    const dto = createEmptyCharacterDTO(id, '');
    
    // Convert DTO to Character instance for rich domain model
    const character = characterRepository.fromDTO(dto);
    
    // Get starting attribute points for level 1 using point allocation service
    const startingAttributePoints = pointAllocationService.getTotalAttributePointsAvailable(1);
    console.log(`[Create] Point allocation service returned: ${startingAttributePoints} points for level 1`);
    
    // Initialize attributes with starting points (before saving to database)
    character.attributes.totalPoints = startingAttributePoints;
    character.attributes.pointsSpent = 0;
    character.attributes.pointsRemaining = startingAttributePoints;
    character.attributes.finalized = false;
    console.log(`[Create] Initialized attributes for character: ${id} with ${startingAttributePoints} starting points`);
    
    // Save to database using repository first (character must exist before attributes record due to FK constraint)
    const saveResult = await characterRepository.save(character);
    
    if (!saveResult.success) {
      throw new Error(saveResult.error || 'Failed to save character');
    }
    
    // Now create attributes record in database (requires character to exist first for FK constraint)
    try {
      console.log(`[Create] Creating attributes record with totalPoints: ${startingAttributePoints}`);
      await createAttributesRecord({
        characterId: id,
        totalPoints: startingAttributePoints,
        pointsSpent: 0,
        pointsRemaining: startingAttributePoints,
        strength: 0,
        speed: 0,
        intellect: 0,
        willpower: 0,
        awareness: 0,
        presence: 0,
        finalized: false
      });
      console.log(`[Create] Successfully created attributes record for character: ${id} with ${startingAttributePoints} points`);
    } catch (attrError) {
      console.warn(`[Create] Warning: Failed to create attributes record:`, attrError);
      // Continue anyway - character was saved successfully
    }
    
    // Create skills state record with starting skill points
    try {
      const startingSkillPoints = pointAllocationService.getTotalSkillPointsAvailable(1);
      console.log(`[Create] Creating skills state record with totalPoints: ${startingSkillPoints}`);
      await createSkillsStateRecord({
        characterId: id,
        totalPoints: startingSkillPoints,
        pointsSpent: 0,
        pointsRemaining: startingSkillPoints,
        finalized: false
      });
      console.log(`[Create] Successfully created skills state record for character: ${id} with ${startingSkillPoints} points`);
    } catch (skillsError) {
      console.warn(`[Create] Warning: Failed to create skills state record:`, skillsError);
      // Continue anyway - character was saved successfully
    }

    // Create talents state record with starting talent points
    try {
      const startingTalentPoints = getTotalTalentPointsUpToLevel(1);
      console.log(`[Create] Creating talents state record with totalPoints: ${startingTalentPoints}`);
      await createTalentsStateRecord({
        characterId: id,
        totalPoints: startingTalentPoints,
        pointsSpent: 0,
        pointsRemaining: startingTalentPoints,
        finalized: false,
        totalTalents: [],
        pendingTalents: []
      });
      console.log(`[Create] Successfully created talents state record for character: ${id} with ${startingTalentPoints} points`);
    } catch (talentsError) {
      console.warn(`[Create] Warning: Failed to create talents state record:`, talentsError);
      // Continue anyway - character was saved successfully
    }

    // Create expertise state record with starting expertise points
    try {
      // Expertise points = intellect attribute, which defaults to 2
      const startingExpertisePoints = character.attributes.intellect || 2;
      console.log(`[Create] Creating expertise state record with totalPoints: ${startingExpertisePoints}`);
      await createExpertiseStateRecord({
        characterId: id,
        totalPoints: startingExpertisePoints,
        pointsSpent: 0,
        pointsRemaining: startingExpertisePoints,
        finalized: false
      });
      console.log(`[Create] Successfully created expertise state record for character: ${id} with ${startingExpertisePoints} points`);
    } catch (expertiseError) {
      console.warn(`[Create] Warning: Failed to create expertise state record:`, expertiseError);
      // Continue anyway - character was saved successfully
    }
    
    // Also save to file system for backward compatibility
    const filename = `${id}.json`;
    const filepath = path.join(charactersDir, filename);
    const characterDTO = characterRepository.toDTO(character);
    await fsPromises.writeFile(filepath, JSON.stringify(characterDTO, null, 2), 'utf8');
    
    console.log(`[Create] Created new character: ${id}`);
    
    return { 
      success: true, 
      id,
      character
    };
  } catch (error) {
    console.error('[Create] Error creating character:', error);
    throw error;
  }
}
