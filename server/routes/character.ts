import { Express } from 'express';
import { createCharacter } from '../services/character-service';
import { characterRepository } from '../repositories/character-repository';
import { saveCharacter } from '../database';

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
      console.error('[Character Route] Error creating character:', error);
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error 
        ? (error as { message: string }).message 
        : String(error);
      const errorStack = typeof error === 'object' && error !== null && 'stack' in error
        ? (error as { stack: string }).stack
        : '';
      console.error('[Character Route] Error details:', errorStack);
      res.status(500).json({ 
        success: false, 
        error: errorMessage,
        details: errorStack
      });
    }
  });

  /**
   * POST /api/characters/save
   * Save an existing character to the database
   * Takes CharacterDTO from client and saves to database
   * 
   * @body CharacterDTO - Character data to save
   * @returns { success: boolean, error?: string }
   */
  app.post('/api/characters/save', async (req, res) => {
    try {
      const characterDTO = req.body;
      
      if (!characterDTO.id) {
        return res.status(400).json({ 
          success: false, 
          error: 'Character ID is required' 
        });
      }

      // Save the character DTO directly to database
      // saveCharacter expects CharacterData which matches CharacterDTO structure
      await saveCharacter(characterDTO);

      console.log(`[Character Route] Saved character: ${characterDTO.name} (${characterDTO.id})`);
      
      res.json({
        success: true
      });
    } catch (error) {
      console.error('[Character Route] Error saving character:', error);
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error 
        ? (error as { message: string }).message 
        : String(error);
      res.status(500).json({ 
        success: false, 
        error: errorMessage
      });
    }
  });
}
