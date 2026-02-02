import * as path from 'path';
import * as fsPromises from 'fs/promises';
import { Character } from '../character/character';
import { createEmptyCharacterDTO } from '../data-access/character-dto';
import { characterRepository } from '../repositories/character-repository';

/**
 * Create a new character with minimal data and generated ID
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
    
    // Save to database using repository
    const saveResult = await characterRepository.save(character);
    
    if (!saveResult.success) {
      throw new Error(saveResult.error || 'Failed to save character');
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
