/**
 * Character Creation Routes
 * 
 * Handles creation-specific endpoints:
 * - POST /api/characters/:id/ancestry
 * - POST /api/characters/:id/name
 * - POST /api/characters/:id/cultures
 * - POST /api/characters/:id/attributes
 */

const path = require('path');
const fsPromises = require('fs').promises;

function createCreationRoutes(app, CHARACTERS_DIR) {
  console.log('[Routes] Registering creation routes...');

  // Helper to get correct filepath - id may already include 'character_' prefix
  function getCharacterFilepath(id) {
    const filename = id.startsWith('character_') ? id : `character_${id}`;
    return path.join(CHARACTERS_DIR, `${filename}.json`);
  }

  /**
   * POST /api/characters/:id/ancestry
   * Update character ancestry
   */
  app.post('/api/characters/:id/ancestry', async (req, res) => {
    console.log('[Routes] Ancestry POST received for:', req.params.id);
    try {
      const { id } = req.params;
      const { ancestry } = req.body;

      if (!ancestry || typeof ancestry !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'ancestry is required and must be a string'
        });
      }

      // Validate ancestry value
      const validAncestries = ['human', 'singer'];
      if (!validAncestries.includes(ancestry.toLowerCase())) {
        return res.status(400).json({
          success: false,
          error: `Invalid ancestry: ${ancestry}. Must be one of: ${validAncestries.join(', ')}`
        });
      }

      const filepath = getCharacterFilepath(id);
      const data = await fsPromises.readFile(filepath, 'utf8');
      const character = JSON.parse(data);
      
      character.ancestry = ancestry.toLowerCase();
      character.lastModified = new Date().toISOString();

      await fsPromises.writeFile(
        filepath,
        JSON.stringify(character, null, 2)
      );
      
      // Also save to database
      try {
        const db = require('../database.js');
        db.saveCharacter(character);
        console.log(`[Ancestry] Saved ancestry to database for ${character.name} (${id})`);
      } catch (dbError) {
        console.warn(`[Ancestry] Warning: Failed to save to database: ${dbError.message}`);
      }

      console.log(`[Ancestry] Updated ${character.name} (${id}) ancestry to: ${ancestry}`);

      res.json({
        success: true,
        id,
        ancestry: character.ancestry,
        message: `Ancestry set to ${ancestry}`
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({ success: false, error: 'Character not found' });
      }
      console.error('[Ancestry] Error updating ancestry:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/characters/:id/name
   * Update character name
   */
  app.post('/api/characters/:id/name', async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;

      if (!name || typeof name !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'name is required and must be a string'
        });
      }

      const trimmedName = name.trim();
      if (trimmedName.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'name cannot be empty'
        });
      }

      if (trimmedName.length < 2 || trimmedName.length > 50) {
        return res.status(400).json({
          success: false,
          error: 'name must be between 2 and 50 characters'
        });
      }

      const filepath = getCharacterFilepath(id);
      const data = await fsPromises.readFile(filepath, 'utf8');
      const character = JSON.parse(data);
      
      character.name = trimmedName;
      character.lastModified = new Date().toISOString();

      await fsPromises.writeFile(
        filepath,
        JSON.stringify(character, null, 2)
      );
      
      // Also save to database
      try {
        const db = require('../database.js');
        db.saveCharacter(character);
        console.log(`[Name] Saved name to database for ${character.name} (${id})`);
      } catch (dbError) {
        console.warn(`[Name] Warning: Failed to save to database: ${dbError.message}`);
      }

      console.log(`[Name] Updated character (${id}) name to: ${trimmedName}`);

      res.json({
        success: true,
        id,
        name: character.name,
        message: `Character name set to ${trimmedName}`
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({ success: false, error: 'Character not found' });
      }
      console.error('[Name] Error updating name:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/characters/:id/cultures
   * Update character cultures
   */
  app.post('/api/characters/:id/cultures', async (req, res) => {
    try {
      const { id } = req.params;
      const { cultures } = req.body;

      if (!Array.isArray(cultures)) {
        return res.status(400).json({
          success: false,
          error: 'cultures must be an array'
        });
      }

      const filepath = getCharacterFilepath(id);
      const data = await fsPromises.readFile(filepath, 'utf8');
      const character = JSON.parse(data);
      
      character.cultures = cultures;
      character.lastModified = new Date().toISOString();

      await fsPromises.writeFile(
        filepath,
        JSON.stringify(character, null, 2)
      );
      
      // Also save to database
      try {
        const db = require('../database.js');
        db.saveCharacter(character);
        console.log(`[Cultures] Saved cultures to database for ${character.name} (${id})`);
      } catch (dbError) {
        console.warn(`[Cultures] Warning: Failed to save to database: ${dbError.message}`);
      }

      console.log(`[Cultures] Updated ${character.name} (${id}) with ${cultures.length} culture(s)`);

      res.json({
        success: true,
        id,
        cultures: character.cultures,
        message: `Updated ${cultures.length} culture(s)`
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({ success: false, error: 'Character not found' });
      }
      console.error('[Cultures] Error updating cultures:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/characters/:id/attributes
   * Update character attributes
   */
  app.post('/api/characters/:id/attributes', async (req, res) => {
    try {
      const { id } = req.params;
      const { attributes } = req.body;

      if (!attributes || typeof attributes !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'attributes must be an object'
        });
      }

      const filepath = getCharacterFilepath(id);
      const data = await fsPromises.readFile(filepath, 'utf8');
      const character = JSON.parse(data);
      
      character.attributes = { ...character.attributes, ...attributes };
      character.lastModified = new Date().toISOString();

      await fsPromises.writeFile(
        filepath,
        JSON.stringify(character, null, 2)
      );
      
      // Also save to database
      try {
        const db = require('../database.js');
        db.saveCharacter(character);
        console.log(`[Attributes] Saved attributes to database for ${character.name} (${id})`);
      } catch (dbError) {
        console.warn(`[Attributes] Warning: Failed to save to database: ${dbError.message}`);
      }

      console.log(`[Attributes] Updated ${character.name} (${id}) attributes:`, attributes);

      res.json({
        success: true,
        id,
        attributes: character.attributes,
        message: 'Attributes updated'
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({ success: false, error: 'Character not found' });
      }
      console.error('[Attributes] Error updating attributes:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/characters/:id/expertises
   * Update character expertises
   */
  app.post('/api/characters/:id/expertises', async (req, res) => {
    try {
      const { id } = req.params;
      const { selectedExpertises } = req.body;

      if (!Array.isArray(selectedExpertises)) {
        return res.status(400).json({
          success: false,
          error: 'selectedExpertises must be an array'
        });
      }

      const filepath = getCharacterFilepath(id);
      const data = await fsPromises.readFile(filepath, 'utf8');
      const character = JSON.parse(data);
      
      character.selectedExpertises = selectedExpertises;
      character.lastModified = new Date().toISOString();

      await fsPromises.writeFile(
        filepath,
        JSON.stringify(character, null, 2)
      );
      
      // Also save to database
      try {
        const db = require('../database.js');
        db.saveCharacter(character);
        console.log(`[Expertises] Saved expertises to database for ${character.name} (${id})`);
      } catch (dbError) {
        console.warn(`[Expertises] Warning: Failed to save to database: ${dbError.message}`);
      }

      console.log(`[Expertises] Updated ${character.name} (${id}) with ${selectedExpertises.length} expertise(ies)`);

      res.json({
        success: true,
        id,
        selectedExpertises: character.selectedExpertises,
        message: `Updated ${selectedExpertises.length} expertise(ies)`
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({ success: false, error: 'Character not found' });
      }
      console.error('[Expertises] Error updating expertises:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

module.exports = createCreationRoutes;
console.log('[Routes] Creation routes module loaded and exported');
