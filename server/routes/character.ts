import { Express } from 'express';
import { createCharacter } from '../services/character-service';
import { characterRepository } from '../repositories/character-repository';

/**
 * Register character management routes
 * @param app Express app instance
 * @param charactersDir Directory for storing character files
 */
export default function createCharacterRoutes(app: Express, charactersDir: string): void {
  /**
   * POST /api/characters/create
   * Create a new character with minimal data and generated ID
   * Saves to both file system and database
   * 
   * @returns { success: boolean, id: string, character: CharacterDTO }
   */
  app.post('/api/characters/create', async (req, res) => {
    try {
      const result = await createCharacter(charactersDir);
      
      // Convert Character instance to DTO for JSON response
      const characterDTO = characterRepository.toDTO(result.character);
      
      res.json({
        success: result.success,
        id: result.id,
        character: characterDTO
      });
    } catch (error) {
      console.error('Error creating character:', error);
      res.status(500).json({ 
        success: false, 
        error: typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : String(error)
      });
    }
  });
}
