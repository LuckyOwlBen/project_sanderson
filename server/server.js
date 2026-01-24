const express = require('express');
const cors = require('cors');
const fs = require('fs');
const fsPromises = require('fs').promises;
const util = require('util');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const talentRules = require('./talent-rules');
const talentService = require('./talent-service');
const attributeAllocator = require('./services/attribute-allocator');
const InventoryManager = require('./inventory-manager');
const itemDefinitions = require('./item-definitions');
const { Server } = require('socket.io');
const { createServer } = require('http');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || (IS_PRODUCTION ? 80 : 3000);
const CHARACTERS_DIR = path.join(__dirname, 'characters');
const IMAGES_DIR = path.join(__dirname, 'images');

// Level-up tables (server is source of truth)
const LEVEL_TABLES = {
  attributePointsPerLevel: [12, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0],
  skillPointsPerLevel: [4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  healthPerLevel: [10, 5, 5, 5, 5, 4, 4, 4, 4, 4, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 1],
  healthStrengthBonusLevels: [1, 6, 11, 16, 21],
  maxSkillRanksPerLevel: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  skillRanksPerLevel: [5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0],
  talentPointsPerLevel: [2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1]
};

// Track active players
const activePlayers = new Map(); // socketId -> {characterId, name, level, ancestry, joinedAt}

// Track store state
const storeState = {
  'main-store': true,
  'weapons-shop': true,
  'armor-shop': true,
  'equipment-shop': true,
  'consumables-shop': true,
  'fabrials-shop': true,
  'mounts-shop': true
};

// Track highstorm state
let highstormActive = false;

// Track level-up delivery state
// pendingLevelUps stores queued payloads per characterId to allow retries
// lastConfirmedLevels tracks the last acknowledged level per characterId
const pendingLevelUps = new Map();
const lastConfirmedLevels = new Map();

// Track spren grant delivery state
// pendingSprenGrants stores queued spren grants per characterId (array of grant objects)
// confirmedSprenGrants tracks which characters have received spren (Set of characterIds)
const pendingSprenGrants = new Map();
const confirmedSprenGrants = new Set();

// Track expertise grant delivery state
// pendingExpertiseGrants stores queued expertise grants per characterId (array of grant objects)
const pendingExpertiseGrants = new Map();
const confirmedExpertiseGrants = new Map(); // characterId -> Set of expertiseNames

// Track item grant delivery state
// pendingItemGrants stores queued item grants per characterId (array of grant objects)
const pendingItemGrants = new Map();

// Track recent server logs for transparency/ops
const LOG_BUFFER_SIZE = 100;
const logBuffer = [];

function recordLog(level, args) {
  const message = util.format(...args);
  logBuffer.push({
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    level,
    message,
  });
  if (logBuffer.length > LOG_BUFFER_SIZE) {
    logBuffer.shift();
  }
}

const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
};

console.log = (...args) => {
  recordLog('info', args);
  originalConsole.log(...args);
};

console.error = (...args) => {
  recordLog('error', args);
  originalConsole.error(...args);
};

console.warn = (...args) => {
  recordLog('warn', args);
  originalConsole.warn(...args);
};

// Configure multer for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
      return;
    }
    cb(null, true);
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve images directory as static
app.use('/images', express.static(IMAGES_DIR));

// Lightweight operational logs endpoint (newest first)
app.get('/api/logs', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 200, LOG_BUFFER_SIZE);
  const start = Math.max(logBuffer.length - limit, 0);
  const logs = logBuffer.slice(start).reverse();
  originalConsole.log(`[API] GET /api/logs requested. Buffer size: ${logBuffer.length}, returning ${logs.length} logs`);
  res.json({ logs });
});

// Serve static Angular files in production
if (IS_PRODUCTION) {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  console.log('Serving static files from:', distPath);
}

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fsPromises.access(CHARACTERS_DIR);
  } catch {
    await fsPromises.mkdir(CHARACTERS_DIR, { recursive: true });
    console.log('Created characters directory:', CHARACTERS_DIR);
  }
  
  try {
    await fsPromises.access(IMAGES_DIR);
  } catch {
    await fsPromises.mkdir(IMAGES_DIR, { recursive: true });
    console.log('Created images directory:', IMAGES_DIR);
  }
}

function getCharacterFilepath(id) {
  return path.join(CHARACTERS_DIR, `${id}.json`);
}

async function loadCharacterData(id, retries = 3) {
  const filepath = getCharacterFilepath(id);
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const data = await fsPromises.readFile(filepath, 'utf8');
      
      // Check if data is empty
      if (!data || data.trim().length === 0) {
        throw new Error('Character file is empty');
      }
      
      const character = JSON.parse(data);
      
      // Ensure paths array exists and is initialized properly
      if (!character.paths) {
        character.paths = [];
      }
      
      return character;
    } catch (error) {
      // If it's a JSON parse error and we have retries left, wait and try again
      if (error instanceof SyntaxError && attempt < retries - 1) {
        console.warn(`JSON parse error on attempt ${attempt + 1} for ${id}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
        continue;
      }
      // Otherwise throw the error
      throw error;
    }
  }
}

async function saveCharacterData(character) {
  const filepath = getCharacterFilepath(character.id);
await fsPromises.writeFile(filepath, JSON.stringify(character, null, 2), 'utf8');
}

function getLevelTableValue(table, level) {
  return table[level - 1] || 0;
}

function findSocketIdByCharacterId(characterId) {
  for (const [socketId, player] of activePlayers.entries()) {
    if (player.characterId === characterId) {
      return socketId;
    }
  }
  return null;
}

function sendPendingLevelUp(characterId) {
  const queue = pendingLevelUps.get(characterId);
  if (!queue || queue.length === 0) {
    return;
  }

  const targetSocket = findSocketIdByCharacterId(characterId);
  if (targetSocket) {
    const payload = queue[0];
    console.log(`[GM Action] 🆙 Sending pending level-up to socket ${targetSocket}, new level: ${payload.newLevel}`);
    io.to(targetSocket).emit('level-up-granted', payload);
  } else {
    console.warn(`[GM Action] ⚠️ No active socket for character ${characterId} while sending pending level-up`);
  }
}

function sendPendingSprenGrant(characterId) {
  const queue = pendingSprenGrants.get(characterId);
  if (!queue || queue.length === 0) {
    return;
  }

  const targetSocket = findSocketIdByCharacterId(characterId);
  if (targetSocket) {
    const grant = queue[0];
    console.log(`[GM Action] ⭐ Sending pending spren grant to socket ${targetSocket}`);
    io.to(targetSocket).emit('spren-granted', grant);
  } else {
    console.warn(`[GM Action] ⚠️ No active socket for character ${characterId} while sending pending spren grant`);
  }
}

function sendPendingExpertiseGrants(characterId) {
  const queue = pendingExpertiseGrants.get(characterId);
  if (!queue || queue.length === 0) {
    return;
  }

  const targetSocket = findSocketIdByCharacterId(characterId);
  if (targetSocket) {
    const grant = queue[0];
    console.log(`[GM Action] 📚 Sending pending expertise grant to socket ${targetSocket}: ${grant.expertiseName}`);
    io.to(targetSocket).emit('expertise-granted', grant);
  } else {
    console.warn(`[GM Action] ⚠️ No active socket for character ${characterId} while sending pending expertise grant`);
  }
}

function sendPendingItemGrants(characterId) {
  const queue = pendingItemGrants.get(characterId);
  if (!queue || queue.length === 0) {
    return;
  }

  const targetSocket = findSocketIdByCharacterId(characterId);
  if (targetSocket) {
    const grant = queue[0];
    console.log(`[GM Action] 🎁 Sending pending item grant to socket ${targetSocket}: ${grant.itemId} x${grant.quantity}`);
    io.to(targetSocket).emit('item-granted', grant);
  } else {
    console.warn(`[GM Action] ⚠️ No active socket for character ${characterId} while sending pending item grant`);
  }
}

//Wireguard invite validation
app.get('/invite/:name', (req, res) => {
   
});

// Create new character (minimal data with generated ID)
app.post('/api/characters/create', async (req, res) => {
  try {
    const timestamp = Date.now();
    const id = `character_${timestamp}`;
    
    // Create minimal character structure for creation flow
    const character = {
      id,
      name: '',
      level: 1,
      pendingLevelPoints: 0,
      ancestry: null,
      cultures: [],
      paths: [],
      selectedExpertises: [],
      attributes: {
        strength: 0,
        speed: 0,
        intellect: 0,
        willpower: 0,
        awareness: 0,
        presence: 0
      },
      skills: {},
      unlockedTalents: [],
      baselineUnlockedTalents: [],
      unlockedSingerForms: [],
      activeForm: null,
      health: { current: 0, max: 0 },
      focus: { current: 0, max: 0 },
      investiture: { current: 0, max: 0, isActive: false },
      radiantPath: { currentIdeal: 1, currentOath: null },
      inventory: { items: [], equipped: { armor: null, weapons: [] } },
      sessionNotes: '',
      lastModified: new Date().toISOString()
    };

    const filename = `${id}.json`;
    const filepath = path.join(CHARACTERS_DIR, filename);
    
    await fsPromises.writeFile(filepath, JSON.stringify(character, null, 2), 'utf8');
    
    console.log(`Created new character: ${id}`);
    
    res.json({ 
      success: true, 
      id,
      character
    });
  } catch (error) {
    console.error('Error creating character:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Save character
app.post('/api/characters/save', async (req, res) => {
  try {
    const character = req.body;
    
    if (!character.id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Character ID is required' 
      });
    }

    // Load existing character to preserve server-side tracking (like spentPoints)
    let existingCharacter = null;
    try {
      existingCharacter = await loadCharacterData(character.id);
    } catch (err) {
      // Character doesn't exist yet, that's fine
    }

    // Always preserve spentPoints from existing character (server-side only, client never sends)
    if (existingCharacter && existingCharacter.spentPoints) {
      character.spentPoints = existingCharacter.spentPoints;
    }

    const filename = `${character.id}.json`;
    const filepath = path.join(CHARACTERS_DIR, filename);
    const tempPath = `${filepath}.tmp`;
    
    // Write to temp file first, then rename for atomic operation
    await fsPromises.writeFile(tempPath, JSON.stringify(character, null, 2), 'utf8');
    await fsPromises.rename(tempPath, filepath);
    
    console.log(`Saved character: ${character.name} (${character.id})`);
    
    res.json({ 
      success: true, 
      id: character.id 
    });
  } catch (error) {
    console.error('Error saving character:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ===== INVENTORY ENDPOINTS =====

// Purchase item from store
app.post('/api/character/:id/inventory/purchase', async (req, res) => {
  try {
    const { id } = req.params;
    const { itemId, quantity = 1, price } = req.body;

    if (!itemId || !price || quantity < 1) {
      return res.status(400).json({
        success: false,
        error: 'itemId, price, and quantity are required'
      });
    }

    // Load character
    const character = await loadCharacterData(id);
    if (!character) {
      return res.status(404).json({
        success: false,
        error: 'Character not found'
      });
    }

    // Validate item exists
    const item = itemDefinitions.getItemById(itemId);
    if (!item) {
      return res.status(400).json({
        success: false,
        error: 'Item not found'
      });
    }

    // Instantiate inventory manager and restore from character data
    const inventoryManager = new InventoryManager();
    if (character.inventory) {
      inventoryManager.deserialize(character.inventory);
    }

    // Attempt purchase
    if (!inventoryManager.purchaseItem(itemId, price, quantity)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot afford item'
      });
    }

    // Log transaction
    const conversion = inventoryManager.convertToMixedDenominations(price * quantity);
    console.log(`[Store] Purchase: Character ${id} bought ${quantity}x ${item.name} for ${conversion.broams}b ${conversion.marks}m ${conversion.chips}c`);

    // Save character with updated inventory
    character.inventory = inventoryManager.serialize();
    await saveCharacterData(character);

    res.json({
      success: true,
      inventory: character.inventory,
      message: `Purchased ${quantity}x ${item.name}`
    });
  } catch (error) {
    console.error('Error purchasing item:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Apply starting equipment kit
app.post('/api/character/:id/inventory/apply-kit', async (req, res) => {
  try {
    const { id } = req.params;
    const { kitId } = req.body;

    if (!kitId) {
      return res.status(400).json({
        success: false,
        error: 'kitId is required'
      });
    }

    // Validate kit exists
    const kit = itemDefinitions.getKitById(kitId);
    if (!kit) {
      return res.status(400).json({
        success: false,
        error: 'Starting kit not found'
      });
    }

    // Load character
    const character = await loadCharacterData(id);
    if (!character) {
      return res.status(404).json({
        success: false,
        error: 'Character not found'
      });
    }

    // Instantiate inventory manager and apply kit
    const inventoryManager = new InventoryManager();
    inventoryManager.applyStartingKit(kitId);

    // Log action
    console.log(`[Inventory] Applied kit '${kit.name}' to character ${id}`);

    // Save character with new inventory
    character.inventory = inventoryManager.serialize();
    await saveCharacterData(character);

    res.json({
      success: true,
      inventory: character.inventory,
      message: `Applied ${kit.name}`
    });
  } catch (error) {
    console.error('Error applying kit:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add item directly (GM grant)
app.post('/api/character/:id/inventory/add', async (req, res) => {
  try {
    const { id } = req.params;
    const { itemId, quantity = 1 } = req.body;

    if (!itemId || quantity < 1) {
      return res.status(400).json({
        success: false,
        error: 'itemId and quantity are required'
      });
    }

    // Validate item exists
    const item = itemDefinitions.getItemById(itemId);
    if (!item) {
      return res.status(400).json({
        success: false,
        error: 'Item not found'
      });
    }

    // Load character
    const character = await loadCharacterData(id);
    if (!character) {
      return res.status(404).json({
        success: false,
        error: 'Character not found'
      });
    }

    // Instantiate inventory manager and restore from character data
    const inventoryManager = new InventoryManager();
    if (character.inventory) {
      inventoryManager.deserialize(character.inventory);
    }

    // Add item
    inventoryManager.addItem(itemId, quantity);

    // Log action
    console.log(`[Inventory] GM added ${quantity}x ${item.name} to character ${id}`);

    // Save character with updated inventory
    character.inventory = inventoryManager.serialize();
    await saveCharacterData(character);

    res.json({
      success: true,
      inventory: character.inventory,
      message: `Added ${quantity}x ${item.name}`
    });
  } catch (error) {
    console.error('Error adding item:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Remove item
app.post('/api/character/:id/inventory/remove', async (req, res) => {
  try {
    const { id } = req.params;
    const { itemId, quantity = 1 } = req.body;

    if (!itemId || quantity < 1) {
      return res.status(400).json({
        success: false,
        error: 'itemId and quantity are required'
      });
    }

    // Load character
    const character = await loadCharacterData(id);
    if (!character) {
      return res.status(404).json({
        success: false,
        error: 'Character not found'
      });
    }

    // Instantiate inventory manager and restore from character data
    const inventoryManager = new InventoryManager();
    if (character.inventory) {
      inventoryManager.deserialize(character.inventory);
    }

    // Remove item
    if (!inventoryManager.removeItem(itemId, quantity)) {
      return res.status(400).json({
        success: false,
        error: 'Item not found in inventory'
      });
    }

    // Log action
    console.log(`[Inventory] Removed ${quantity}x item ${itemId} from character ${id}`);

    // Save character with updated inventory
    character.inventory = inventoryManager.serialize();
    await saveCharacterData(character);

    res.json({
      success: true,
      inventory: character.inventory,
      message: `Removed item`
    });
  } catch (error) {
    console.error('Error removing item:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Equip item
app.post('/api/character/:id/inventory/equip', async (req, res) => {
  try {
    const { id } = req.params;
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({
        success: false,
        error: 'itemId is required'
      });
    }

    // Load character
    const character = await loadCharacterData(id);
    if (!character) {
      return res.status(404).json({
        success: false,
        error: 'Character not found'
      });
    }

    // Instantiate inventory manager and restore from character data
    const inventoryManager = new InventoryManager();
    if (character.inventory) {
      inventoryManager.deserialize(character.inventory);
    }

    // Get item definition for expertise validation
    const item = itemDefinitions.getItemById(itemId);
    if (item) {
      // Check weapon expertise requirements
      if (item.weaponProperties?.expertTraits && item.weaponProperties.expertTraits.length > 0) {
        // Map item to required expertise
        const requiredExpertise = getRequiredExpertiseForWeapon(item.id, item.name);
        if (requiredExpertise) {
          const characterExpertises = character.expertises || [];
          const hasExpertise = characterExpertises.some(e => {
            const expertiseName = typeof e === 'string' ? e : e.name;
            return expertiseName === requiredExpertise;
          });
          
          if (!hasExpertise) {
            console.log(`[Inventory] Warning: Character lacks '${requiredExpertise}' expertise for ${item.name}`);
            // Log but don't block - character can equip but won't get benefit from expert traits
          }
        }
      }

      // Check armor expertise requirements
      if (item.armorProperties?.expertTraits && item.armorProperties.expertTraits.length > 0) {
        const requiredExpertise = getRequiredExpertiseForArmor(item.id, item.name);
        if (requiredExpertise) {
          const characterExpertises = character.expertises || [];
          const hasExpertise = characterExpertises.some(e => {
            const expertiseName = typeof e === 'string' ? e : e.name;
            return expertiseName === requiredExpertise;
          });
          
          if (!hasExpertise) {
            console.log(`[Inventory] Warning: Character lacks '${requiredExpertise}' expertise for ${item.name}`);
            // Log but don't block
          }
        }
      }
    }

    // Equip item
    if (!inventoryManager.equipItem(itemId)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot equip item'
      });
    }

    // Log action
    console.log(`[Inventory] Equipped item ${itemId} on character ${id}`);

    // Save character with updated inventory
    character.inventory = inventoryManager.serialize();
    await saveCharacterData(character);

    res.json({
      success: true,
      inventory: character.inventory,
      message: `Item equipped`
    });
  } catch (error) {
    console.error('Error equipping item:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get required expertise for weapon based on item ID or name
 * @bonus Expertise validation helper for equipment
 */
function getRequiredExpertiseForWeapon(itemId, itemName) {
  const weaponMap = {
    'sword': 'Dueling',
    'axe': 'Axe Fighting',
    'mace': 'Bludgeoning Weapons',
    'spear': 'Spear Fighting',
    'bow': 'Archery',
    'dagger': 'Knife Fighting',
    'staff': 'Staff Fighting',
    'hammer': 'Hammer Fighting',
    'lance': 'Mounted Combat'
  };

  const lowerName = itemName.toLowerCase();
  const lowerId = itemId.toLowerCase();

  for (const [weaponType, expertise] of Object.entries(weaponMap)) {
    if (lowerName.includes(weaponType) || lowerId.includes(weaponType)) {
      return expertise;
    }
  }

  return null;
}

/**
 * Get required expertise for armor based on item ID or name
 * @bonus Expertise validation helper for equipment
 */
function getRequiredExpertiseForArmor(itemId, itemName) {
  const armorMap = {
    'plate': 'Armor Mastery',
    'mail': 'Armor Mastery',
    'leather': 'Light Armor',
    'hide': 'Light Armor'
  };

  const lowerName = itemName.toLowerCase();
  const lowerId = itemId.toLowerCase();

  for (const [armorType, expertise] of Object.entries(armorMap)) {
    if (lowerName.includes(armorType) || lowerId.includes(armorType)) {
      return expertise;
    }
  }

  return null;
}

// Unequip item
app.post('/api/character/:id/inventory/unequip', async (req, res) => {
  try {
    const { id } = req.params;
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({
        success: false,
        error: 'itemId is required'
      });
    }

    // Load character
    const character = await loadCharacterData(id);
    if (!character) {
      return res.status(404).json({
        success: false,
        error: 'Character not found'
      });
    }

    // Instantiate inventory manager and restore from character data
    const inventoryManager = new InventoryManager();
    if (character.inventory) {
      inventoryManager.deserialize(character.inventory);
    }

    // Unequip item
    if (!inventoryManager.unequipItem(itemId)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot unequip item'
      });
    }

    // Log action
    console.log(`[Inventory] Unequipped item ${itemId} from character ${id}`);

    // Save character with updated inventory
    character.inventory = inventoryManager.serialize();
    await saveCharacterData(character);

    res.json({
      success: true,
      inventory: character.inventory,
      message: `Item unequipped`
    });
  } catch (error) {
    console.error('Error unequipping item:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all available items with optional filters
app.get('/api/items', (req, res) => {
  try {
    const { type, rarity } = req.query;
    let items = itemDefinitions.ALL_ITEMS;

    if (type) {
      items = items.filter(item => item.type === type);
    }

    if (rarity) {
      items = items.filter(item => item.rarity === rarity);
    }

    res.json({
      success: true,
      count: items.length,
      items
    });
  } catch (error) {
    console.error('Error retrieving items:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get store items (respects GM toggles)
app.get('/api/store/items', (req, res) => {
  try {
    // Filter to common rarity items only
    const storeItems = itemDefinitions.ALL_ITEMS.filter(item => item.rarity === 'common');

    res.json({
      success: true,
      count: storeItems.length,
      items: storeItems,
      storeState
    });
  } catch (error) {
    console.error('Error retrieving store items:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Submit path selection and auto-unlock tier 0 talent
app.post('/api/characters/:id/paths', async (req, res) => {
  try {
    const { id } = req.params;
    const { mainPath, specialization } = req.body;

    if (!mainPath || typeof mainPath !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'mainPath is required and must be a string'
      });
    }

    const character = await loadCharacterData(id);
    const currentTalents = character.unlockedTalents || [];

    // Ensure tier-0 talent is unlocked (SINGLE LOCATION FOR THIS)
    const tier0Result = talentService.ensureTier0Unlocked(id, mainPath, currentTalents);

    // If tier 0 needs to be unlocked, add it
    if (tier0Result.needsUnlock && tier0Result.talentId) {
      if (!character.unlockedTalents) {
        character.unlockedTalents = [];
      }
      if (!character.unlockedTalents.includes(tier0Result.talentId)) {
        character.unlockedTalents.push(tier0Result.talentId);
      }
    }

    // Update main path
    character.mainPath = mainPath;
    if (!character.paths) {
      character.paths = [];
    }
    if (!character.paths.includes(mainPath)) {
      character.paths.unshift(mainPath);
    }
    
    // Add specialization if provided
    if (specialization && !character.paths.includes(specialization)) {
      character.paths.push(specialization);
    }
    
    await fsPromises.writeFile(
      path.join(CHARACTERS_DIR, `character_${id}.json`),
      JSON.stringify(character, null, 2)
    );

    res.json({
      success: true,
      id,
      mainPath,
      unlockedTalent: tier0Result.talentId || undefined,
      paths: character.paths,
      tier0Unlocked: tier0Result.unlocked,
      tier0TalentId: tier0Result.talentId,
      message: tier0Result.unlocked ? 'Path selected and tier-0 talent unlocked' : 'Path selected'
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ success: false, error: 'Character not found' });
    }
    console.error('[Paths] Error selecting path:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Load character by ID
app.get('/api/characters/load/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const filepath = path.join(CHARACTERS_DIR, `${id}.json`);
    
    const data = await fsPromises.readFile(filepath, 'utf8');
    const character = JSON.parse(data);
    
    console.log(`Loaded character: ${character.name} (${id})`);
    console.log(`Character skills:`, character.skills || {});
    
    res.json(character);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ 
        success: false, 
        error: 'Character not found' 
      });
    }
    console.error('Error loading character:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// List all characters
app.get('/api/characters/list', async (req, res) => {
  try {
    const files = await fsPromises.readdir(CHARACTERS_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    const characters = await Promise.all(
      jsonFiles.map(async (file) => {
        try {
          const filepath = path.join(CHARACTERS_DIR, file);
          const data = await fsPromises.readFile(filepath, 'utf8');
          const character = JSON.parse(data);
          
          return {
            id: character.id,
            name: character.name,
            level: character.level,
            ancestry: character.ancestry,
            lastModified: character.lastModified,
            data: character
          };
        } catch (error) {
          console.error(`Error reading ${file}:`, error);
          return null;
        }
      })
    );
    
    // Filter out any failed reads and sort by last modified
    const validCharacters = characters
      .filter(c => c !== null)
      .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    
    console.log(`Listed ${validCharacters.length} characters`);
    
    res.json(validCharacters);
  } catch (error) {
    console.error('Error listing characters:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Level-up: expose server-owned tables
app.get('/api/levelup/tables', (req, res) => {
  res.json(LEVEL_TABLES);
});

// Level-up: lightweight character summary
app.get('/api/characters/:id/level/summary', async (req, res) => {
  try {
    const { id } = req.params;
    const character = await loadCharacterData(id);
    res.json({
      id: character.id,
      name: character.name,
      level: character.level || 1,
      ancestry: character.ancestry || null,
      pendingLevelPoints: character.pendingLevelPoints || 0,
      lastModified: character.lastModified
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ success: false, error: 'Character not found' });
    }
    console.error('Error loading level summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Character creation: initialize level with cumulative points
app.post('/api/characters/:id/creation-init', async (req, res) => {
  try {
    const { id } = req.params;
    const { targetLevel } = req.body;
    
    if (!targetLevel || targetLevel < 1 || targetLevel > 21) {
      return res.status(400).json({
        success: false,
        error: 'targetLevel must be between 1 and 21'
      });
    }
    
    const filepath = path.join(CHARACTERS_DIR, `${id}.json`);
    const data = await fsPromises.readFile(filepath, 'utf8');
    const character = JSON.parse(data);
    
    // Set level and clear spent points for fresh creation at this level
    character.level = targetLevel;
    character.spentPoints = {}; // Fresh state for creation
    
    // Save character
    const tempPath = `${filepath}.tmp`;
    await fsPromises.writeFile(tempPath, JSON.stringify(character, null, 2), 'utf8');
    await fsPromises.rename(tempPath, filepath);
    
    console.log(`[Character Creation] Initialized character ${character.name} (${id}) at level ${targetLevel}`);
    res.json({
      success: true,
      id,
      level: targetLevel,
      message: `Character initialized for creation at level ${targetLevel}`
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ success: false, error: 'Character not found' });
    }
    console.error('Error initializing character level:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function to calculate cumulative points
function getCumulativePoints(table, level) {
  if (level < 1 || level > table.length) return 0;
  let total = 0;
  for (let i = 0; i < level; i++) {
    total += table[i];
  }
  return total;
}

// Level-up: attribute slice
app.get('/api/characters/:id/level/attributes', async (req, res) => {
  try {
    const { id } = req.params;
    const isCreationMode = req.query.isCreationMode === 'true';
    const character = await loadCharacterData(id);
    const level = character.level || 1;
    
    // In creation mode, return cumulative points; otherwise single-level points
    const totalPointsForLevel = isCreationMode 
      ? getCumulativePoints(LEVEL_TABLES.attributePointsPerLevel, level)
      : getLevelTableValue(LEVEL_TABLES.attributePointsPerLevel, level);
    
    // Track spent points per level to prevent re-adding on revisits
    if (!character.spentPoints) character.spentPoints = {};
    if (!character.spentPoints.attributes) character.spentPoints.attributes = {};
    const spentForThisLevel = character.spentPoints.attributes[level] || 0;
    const pointsForLevel = Math.max(0, totalPointsForLevel - spentForThisLevel);
    
    const mode = isCreationMode ? 'creation' : 'level-up';
    console.log(`[${mode.toUpperCase()}] Provided attribute points for ${character.name} (${character.id}): ${pointsForLevel} (${spentForThisLevel} already spent, cumulative: ${isCreationMode})`);
    res.json({
      id: character.id,
      level,
      attributes: character.attributes || {},
      pointsForLevel,
      isCreationMode
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ success: false, error: 'Character not found' });
    }
    console.error('Error loading attribute slice:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Level-up: skill slice
app.get('/api/characters/:id/level/skills', async (req, res) => {
  try {
    const { id } = req.params;
    const isCreationMode = req.query.isCreationMode === 'true';
    const character = await loadCharacterData(id);
    const level = character.level || 1;
    
    // In creation mode, return cumulative points; otherwise single-level points
    const totalPointsForLevel = isCreationMode
      ? getCumulativePoints(LEVEL_TABLES.skillPointsPerLevel, level)
      : getLevelTableValue(LEVEL_TABLES.skillPointsPerLevel, level);
    
    // Track spent points per level to prevent re-adding on revisits
    if (!character.spentPoints) character.spentPoints = {};
    if (!character.spentPoints.skills) character.spentPoints.skills = {};
    const spentForThisLevel = character.spentPoints.skills[level] || 0;
    const pointsForLevel = Math.max(0, totalPointsForLevel - spentForThisLevel);
    
    const mode = isCreationMode ? 'creation' : 'level-up';
    console.log(`[${mode.toUpperCase()}] Provided skill points for ${character.name} (${character.id}): ${pointsForLevel} (${spentForThisLevel} already spent, cumulative: ${isCreationMode})`);
    console.log(`[${mode}] Current skills for ${character.name}:`, character.skills || {});
    res.json({
      id: character.id,
      level,
      skills: character.skills || {},
      pointsForLevel,
      maxRank: getLevelTableValue(LEVEL_TABLES.maxSkillRanksPerLevel, level),
      ranksPerLevel: getLevelTableValue(LEVEL_TABLES.skillRanksPerLevel, level),
      success: true
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ success: false, error: 'Character not found' });
    }
    console.error('Error loading skill slice:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get talents for current level (unified talent API)
app.get('/api/characters/:id/talents/forLevel', async (req, res) => {
  try {
    const { id } = req.params;
    const isCreationMode = req.query.isCreationMode === 'true';
    
    const character = await loadCharacterData(id);
    const level = character.level || 1;
    const mainPath = character.paths && character.paths.length > 0 ? character.paths[0] : null;
    
    if (!mainPath) {
      console.warn(`[Talents] Character ${character.id} has no main path selected; returning zero points`);
      return res.json({
        talentPoints: 0,
        previouslySelectedTalents: [],
        lockedPowers: [],
        requiresSingerSelection: false,
        requiresPathSelection: true,
        ancestry: character.ancestry || null,
        level,
        mainPath: null,
        isCreationMode
      });
    }

    // Get talent selection state from service (pass character object)
    const state = talentService.getTalentSelectionState(character, level, isCreationMode);

    res.json({
      talentPoints: state.talentPoints,
      previouslySelectedTalents: state.previouslySelectedTalents,
      lockedPowers: state.previouslySelectedTalents,
      unlockedTalents: state.unlockedTalents,
      spentPoints: state.spentPoints,
      requiresSingerSelection: state.requiresSingerSelection,
      tier0TalentId: state.tier0TalentId,
      ancestry: character.ancestry || null,
      level,
      mainPath,
      isCreationMode
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ success: false, error: 'Character not found' });
    }
    console.error('[Talents] Error in getTalentForLevel:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Level-up: talent slice
app.get('/api/characters/:id/level/talents', async (req, res) => {
  try {
    const { id } = req.params;
    const character = await loadCharacterData(id);
    const level = character.level || 1;

    // Get talent state from service (READ-ONLY, no side effects)
    const state = talentService.getTalentSelectionState(character, level, false);

    res.json({
      id: character.id,
      level,
      ancestry: character.ancestry || null,
      unlockedTalents: state.unlockedTalents,
      baselineUnlockedTalents: state.previouslySelectedTalents,
      pointsForLevel: state.talentPoints,
      talentPointsAllocation: state.talentPoints,
      spentPoints: state.spentPoints
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ success: false, error: 'Character not found' });
    }
    console.error('[Talents] Error loading talent slice:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Level-up: patch attribute slice
app.patch('/api/characters/:id/level/attributes', async (req, res) => {
  try {
    const { id } = req.params;
    const isCreationMode = req.query.isCreationMode === 'true';
    const { attributes } = req.body || {};
    if (!attributes || typeof attributes !== 'object') {
      return res.status(400).json({ success: false, error: 'attributes payload required' });
    }

    const character = await loadCharacterData(id);
    const level = character.level || 1;
    // In creation mode, use cumulative points; otherwise single-level points
    const pointsForLevel = isCreationMode
      ? getCumulativePoints(LEVEL_TABLES.attributePointsPerLevel, level)
      : getLevelTableValue(LEVEL_TABLES.attributePointsPerLevel, level);
    const prevAttrs = character.attributes || {};
    // Calculate total positive increases compared to previous values
    const keys = ['strength','speed','awareness','intellect','willpower','presence'];
    let increaseTotal = 0;
    keys.forEach(k => {
      const oldVal = Number(prevAttrs[k] ?? 0);
      const newVal = Number(attributes[k] ?? oldVal);
      if (newVal > oldVal) {
        increaseTotal += (newVal - oldVal);
      }
    });
    if (increaseTotal > pointsForLevel) {
      return res.status(400).json({ success: false, error: `Attribute allocation exceeded. Level ${level} allows ${pointsForLevel} points, attempted ${increaseTotal}.` });
    }

    // Persist merged attributes
    character.attributes = { ...(prevAttrs), ...attributes };
    character.lastModified = new Date().toISOString();
    
    // Track spent points for this level to prevent re-adding on revisits
    if (!character.spentPoints) character.spentPoints = {};
    if (!character.spentPoints.attributes) character.spentPoints.attributes = {};
    character.spentPoints.attributes[level] = increaseTotal;

    await fsPromises.writeFile(getCharacterFilepath(id), JSON.stringify(character, null, 2), 'utf8');

    res.json({
      success: true,
      id: character.id,
      attributes: character.attributes,
      lastModified: character.lastModified
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ success: false, error: 'Character not found' });
    }
    console.error('Error saving attribute slice:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Level-up: patch skill slice
app.patch('/api/characters/:id/level/skills', async (req, res) => {
  try {
    const { id } = req.params;
    const isCreationMode = req.query.isCreationMode === 'true';
    const { skills } = req.body || {};
    if (!skills || typeof skills !== 'object') {
      return res.status(400).json({ success: false, error: 'skills payload required' });
    }

    console.log(`[Skills] Updating skills for character ${id}:`, skills);

    const character = await loadCharacterData(id);
    const level = character.level || 1;
    // In creation mode, use cumulative points; otherwise single-level points
    const pointsForLevel = isCreationMode
      ? getCumulativePoints(LEVEL_TABLES.skillPointsPerLevel, level)
      : getLevelTableValue(LEVEL_TABLES.skillPointsPerLevel, level);
    const maxRank = getLevelTableValue(LEVEL_TABLES.maxSkillRanksPerLevel, level);
    const prevSkills = character.skills || {};
    // Validate increases and max rank
    let increaseTotal = 0;
    Object.entries(skills).forEach(([skillKey, newRankRaw]) => {
      const oldRank = Number(prevSkills[skillKey] ?? 0);
      const newRank = Number(newRankRaw ?? oldRank);
      if (newRank > maxRank) {
        throw new Error(`Skill ${skillKey} exceeds max rank ${maxRank} at level ${level}`);
      }
      if (newRank > oldRank) {
        increaseTotal += (newRank - oldRank);
      }
    });
    if (increaseTotal > pointsForLevel) {
      return res.status(400).json({ success: false, error: `Skill allocation exceeded. Level ${level} allows ${pointsForLevel} points, attempted ${increaseTotal}.` });
    }

    character.skills = { ...(prevSkills), ...skills };
    character.lastModified = new Date().toISOString();
    
    // Track spent points for this level to prevent re-adding on revisits
    if (!character.spentPoints) character.spentPoints = {};
    if (!character.spentPoints.skills) character.spentPoints.skills = {};
    character.spentPoints.skills[level] = increaseTotal;

    console.log(`[Skills] Saved skills for ${character.name} (${character.id}):`, character.skills);

    await fsPromises.writeFile(getCharacterFilepath(id), JSON.stringify(character, null, 2), 'utf8');

    res.json({
      success: true,
      id: character.id,
      skills: character.skills,
      lastModified: character.lastModified
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ success: false, error: 'Character not found' });
    }
    console.error('Error saving skill slice:', error);
    // If validation error is thrown, return 400
    if (error && typeof error.message === 'string' && error.message.includes('exceeds max rank')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Level-up: patch talent slice
app.patch('/api/characters/:id/level/talents', async (req, res) => {
  try {
    const { id } = req.params;
    const { unlockedTalents } = req.body;

    if (!Array.isArray(unlockedTalents)) {
      return res.status(400).json({
        success: false,
        error: 'unlockedTalents must be an array'
      });
    }

    const character = await loadCharacterData(id);
    const level = character.level || 1;
    const mainPath = character.mainPath || character.paths?.[0] || null;

    // Validate selection (pass character object)
    const validation = talentService.validateTalentSelection(character, unlockedTalents, level, mainPath);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
        validation
      });
    }

    // Prepare for save
    const saveResult = talentService.saveTalentSelections(character, unlockedTalents, level, mainPath);
    if (!saveResult.success) {
      return res.status(400).json({
        success: false,
        error: saveResult.error
      });
    }

    // Actually save to file/database (this is where server.js would call DB layer)
    character.unlockedTalents = unlockedTalents;
    await fsPromises.writeFile(
      path.join(CHARACTERS_DIR, `character_${id}.json`),
      JSON.stringify(character, null, 2)
    );

    // Return updated state (pass character object)
    const updatedState = talentService.getTalentSelectionState(character, level, false);
    res.json({
      success: true,
      id,
      level,
      unlockedTalents: updatedState.unlockedTalents,
      spentPoints: updatedState.spentPoints,
      pointsForLevel: updatedState.talentPoints
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ success: false, error: 'Character not found' });
    }
    console.error('[Talents] Error saving talent selections:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete character
app.delete('/api/characters/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const filepath = path.join(CHARACTERS_DIR, `${id}.json`);
    
    await fsPromises.unlink(filepath);
    
    console.log(`Deleted character: ${id}`);
    
    res.json({ success: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ 
        success: false, 
        error: 'Character not found' 
      });
    }
    console.error('Error deleting character:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Upload character portrait/image
app.post('/api/images/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No image file provided' 
      });
    }

    const { characterId, imageType } = req.body; // imageType: 'portrait', 'background', etc.
    
    // Generate filename
    const timestamp = Date.now();
    const filename = characterId 
      ? `${characterId}_${imageType || 'image'}_${timestamp}.webp`
      : `${imageType || 'image'}_${timestamp}.webp`;
    
    const filepath = path.join(IMAGES_DIR, filename);

    // Convert and compress to WebP
    await sharp(req.file.buffer)
      .resize(800, 800, { // Max dimensions, maintains aspect ratio
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ 
        quality: 85, // Good balance of quality and file size
        effort: 4    // Compression effort (0-6, higher = smaller file)
      })
      .toFile(filepath);

    const imageUrl = `/images/${filename}`;
    
    console.log(`Uploaded image: ${filename} (${Math.round(req.file.size / 1024)}KB -> WebP)`);
    
    res.json({ 
      success: true, 
      imageUrl: imageUrl,
      filename: filename
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete image
app.delete('/api/images/delete/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Security: prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid filename' 
      });
    }
    
    const filepath = path.join(IMAGES_DIR, filename);
    
    await fsPromises.unlink(filepath);
    
    console.log(`Deleted image: ${filename}`);
    
    res.json({ success: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ 
        success: false, 
        error: 'Image not found' 
      });
    }
    console.error('Error deleting image:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// List all images (optional - for gallery)
app.get('/api/images/list', async (req, res) => {
  try {
    const files = await fsPromises.readdir(IMAGES_DIR);
    const imageFiles = files.filter(f => f.endsWith('.webp') || f.endsWith('.jpg') || f.endsWith('.png'));
    
    const images = imageFiles.map(filename => ({
      filename: filename,
      url: `/images/${filename}`
    }));
    
    res.json({ 
      success: true, 
      images: images 
    });
  } catch (error) {
    console.error('Error listing images:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mode: IS_PRODUCTION ? 'production' : 'development'
  });
});

// Fallback to index.html for Angular routing (must be last)
if (IS_PRODUCTION) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`[WebSocket] Client connected: ${socket.id}`);

  // Debug: Log all events received on this socket
  socket.onAny((eventName, ...args) => {
    console.log(`[WebSocket] 🔍 Event received: "${eventName}" from ${socket.id}`);
  });

  // Player joins session with character
  socket.on('player-join', (data) => {
    const { characterId, name, level, ancestry, health, focus, investiture } = data;
    
    // Handle ancestry - should always be a string from Ancestry enum (e.g., 'human', 'singer')
    // Fallback to 'Unknown' if null/undefined
    const ancestryName = ancestry || 'Unknown';
    let effectiveLevel = level;

    const confirmedLevel = lastConfirmedLevels.get(characterId);
    const existingQueue = pendingLevelUps.get(characterId) || [];
    if (confirmedLevel && confirmedLevel > level) {
      console.warn(`[Session] Detected level mismatch for ${characterId}: client ${level}, confirmed ${confirmedLevel}. Queuing catch-up events.`);
      let baseLevel = existingQueue.length > 0 ? existingQueue[existingQueue.length - 1].newLevel : level;
      for (let nextLevel = baseLevel + 1; nextLevel <= confirmedLevel; nextLevel++) {
        existingQueue.push({
          characterId,
          newLevel: nextLevel,
          grantedBy: 'RESYNC',
          timestamp: new Date().toISOString()
        });
      }
      pendingLevelUps.set(characterId, existingQueue);
      effectiveLevel = confirmedLevel;
    }
    
    activePlayers.set(socket.id, {
      characterId,
      name,
      level: effectiveLevel,
      ancestry: ancestryName,
      health: health || { current: 0, max: 0 },
      focus: focus || { current: 0, max: 0 },
      investiture: investiture || { current: 0, max: 0 },
      joinedAt: new Date().toISOString(),
      socketId: socket.id
    });

    lastConfirmedLevels.set(characterId, effectiveLevel);
    
    console.log(`[Session] Player joined: ${name} (${characterId})`);
    
    // Broadcast updated player list to all GM clients
    io.emit('player-joined', activePlayers.get(socket.id));
    io.emit('active-players', Array.from(activePlayers.values()));

    // Send any pending grants to the reconnected player
    sendPendingLevelUp(characterId);
    sendPendingSprenGrant(characterId);
    sendPendingExpertiseGrants(characterId);
    sendPendingItemGrants(characterId);
  });

  // Player leaves session
  socket.on('player-leave', (data) => {
    const { characterId } = data;
    const player = activePlayers.get(socket.id);
    
    if (player) {
      console.log(`[Session] Player left: ${player.name} (${characterId})`);
      activePlayers.delete(socket.id);
      
      // Broadcast updated player list
      io.emit('player-left', { characterId, socketId: socket.id });
      io.emit('active-players', Array.from(activePlayers.values()));
    }
  });

  // Resource update from player
  socket.on('resource-update', (data) => {
    const { characterId, health, focus, investiture } = data;
    const player = activePlayers.get(socket.id);
    
    if (player) {
      // Update cached player resources
      player.health = health;
      player.focus = focus;
      player.investiture = investiture;
      
      // Broadcast to all GM clients
      io.emit('player-resource-update', {
        characterId,
        socketId: socket.id,
        health,
        focus,
        investiture
      });
      
      // Critical alert for zero health
      if (health.current === 0) {
        console.log(`[CRITICAL] ${player.name} has reached 0 health!`);
        io.emit('player-critical', {
          characterId,
          playerName: player.name,
          message: `${player.name} has reached 0 health!`
        });
      }
    }
  });

  // Get current active players (for GM dashboard on load)
  socket.on('get-active-players', () => {
    socket.emit('active-players', Array.from(activePlayers.values()));
  });

  // Handle request for current store state
  socket.on('request-store-state', () => {
    console.log('[WebSocket] 📥 Store state requested by:', socket.id);
    
    // Send current state of all stores
    Object.entries(storeState).forEach(([storeId, enabled]) => {
      socket.emit('store-toggle', {
        storeId,
        enabled,
        toggledBy: 'SERVER'
      });
    });
    
    console.log('[WebSocket] 📤 Sent current store state:', storeState);
  });

  // GM grants spren to a player
  socket.on('gm-grant-spren', (data) => {
    const { characterId, order, sprenType, surgePair, philosophy } = data;
    console.log(`[GM Action] ⭐⭐⭐ RECEIVED GM-GRANT-SPREN REQUEST ⭐⭐⭐`);
    console.log(`[GM Action] Granting ${order} spren to character ${characterId}`);
    // Always accept and queue spren grants; client handles idempotency.
    const targetSocket = findSocketIdByCharacterId(characterId);
    
    const payload = {
      characterId,
      order,
      sprenType,
      surgePair,
      philosophy
    };

    // Queue the grant
    const queue = pendingSprenGrants.get(characterId) || [];
    queue.push(payload);
    pendingSprenGrants.set(characterId, queue);
    console.log(`[GM Action] ⭐ Spren grant queued for ${characterId}. Queue size: ${queue.length}`);

    // Send if player is online
    if (targetSocket) {
      sendPendingSprenGrant(characterId);
    } else {
      console.warn(`[GM Action] ⚠️ Player ${characterId} offline - will send on reconnect`);
    }
  });

  // Store transaction from player
  socket.on('store-transaction', (data) => {
    const { storeId, characterId, items, totalCost, timestamp } = data;
    console.log(`[Store] Transaction at ${storeId} by ${characterId}: ${totalCost}mk`);
    
    // Broadcast to all GM clients for tracking
    io.emit('store-transaction', data);

    // Immediately acknowledge acceptance back to sender
    const ackId = `${Date.now()}-${Math.random()}`;
    socket.emit('store-transaction-accepted', {
      ackId,
      storeId,
      characterId,
      totalCost,
      timestamp: timestamp || new Date().toISOString()
    });
  });

  // GM grants item to a player
  socket.on('gm-grant-item', (data) => {
    const { characterId, itemId, quantity, timestamp } = data;
    console.log(`[GM Action] 🎁 Granting ${quantity}x ${itemId} to character ${characterId}`);
    
    const targetSocket = findSocketIdByCharacterId(characterId);
    
    const payload = {
      characterId,
      itemId,
      quantity,
      grantedBy: 'GM',
      timestamp: timestamp || new Date().toISOString()
    };

    // Add to queue
    const queue = pendingItemGrants.get(characterId) || [];
    queue.push(payload);
    pendingItemGrants.set(characterId, queue);
    console.log(`[GM Action] 🎁 Item queued. Queue size: ${queue.length}`);

    // Send if player is online
    if (targetSocket) {
      sendPendingItemGrants(characterId);
    } else {
      console.warn(`[GM Action] ⚠️ Player ${characterId} offline - will send on reconnect`);
    }
  });

  // GM toggles store availability
  socket.on('gm-toggle-store', (data) => {
    const { storeId, enabled } = data;
    console.log(`[GM Action] 🏪 Store ${storeId} toggled: ${enabled ? 'OPEN' : 'CLOSED'}`);
    
    // Update server-side store state
    storeState[storeId] = enabled;
    
    // Broadcast to all clients
    io.emit('store-toggle', {
      storeId,
      enabled,
      toggledBy: 'GM'
    });
  });
  // GM grants expertise to a player
  socket.on('gm-grant-expertise', (data) => {
    const { characterId, expertiseName, timestamp } = data;
    console.log(`[GM Action] 📚 Granting expertise "${expertiseName}" to character ${characterId}`);
    
    const targetSocket = findSocketIdByCharacterId(characterId);
    
    const payload = {
      characterId,
      expertiseName,
      grantedBy: 'GM',
      timestamp: timestamp || new Date().toISOString()
    };

    // Add to queue
    const queue = pendingExpertiseGrants.get(characterId) || [];
    queue.push(payload);
    pendingExpertiseGrants.set(characterId, queue);
    console.log(`[GM Action] 📚 Expertise queued. Queue size: ${queue.length}`);

    // Send if player is online
    if (targetSocket) {
      sendPendingExpertiseGrants(characterId);
    } else {
      console.warn(`[GM Action] ⚠️ Player ${characterId} offline - will send on reconnect`);
    }
  });

  // GM grants a level-up to a player
  socket.on('gm-grant-level-up', (data) => {
    const { characterId, timestamp } = data;
    console.log(`[GM Action] 🆙 Granting level-up to character ${characterId}`);
    
    const targetSocket = findSocketIdByCharacterId(characterId);
    const player = targetSocket ? activePlayers.get(targetSocket) : null;
    
    if (player) {
      const queue = pendingLevelUps.get(characterId) || [];
      const baseLevel = queue.length > 0 ? queue[queue.length - 1].newLevel : player.level;
      const newLevel = baseLevel + 1;
      const payload = {
        characterId,
        newLevel,
        grantedBy: 'GM',
        timestamp: timestamp || new Date().toISOString()
      };

      queue.push(payload);
      pendingLevelUps.set(characterId, queue);

      // Keep GM dashboards optimistic while we wait for ack
      player.level = Math.max(player.level, newLevel);
      console.log(`[GM Action] 🆙 Queue size for ${characterId}: ${queue.length}. Next level: ${newLevel}`);

      sendPendingLevelUp(characterId);

      io.emit('player-joined', player);
      io.emit('active-players', Array.from(activePlayers.values()));
    } else {
      console.warn(`[GM Action] ⚠️ Could not find active player with characterId ${characterId}`);
    }
  });

  socket.on('level-up-ack', ({ characterId, newLevel }) => {
    const player = activePlayers.get(socket.id);
    if (!player || player.characterId !== characterId) {
      console.warn(`[LevelUp] ⚠️ Ack from unknown player/socket ${socket.id} for character ${characterId}`);
      return;
    }

    const queue = pendingLevelUps.get(characterId) || [];
    if (queue.length > 0 && queue[0].newLevel === newLevel) {
      queue.shift();
    } else {
      const idx = queue.findIndex(entry => entry.newLevel === newLevel);
      if (idx !== -1) {
        queue.splice(idx, 1);
      } else {
        console.warn(`[LevelUp] ⚠️ Received ack for unexpected level ${newLevel} on character ${characterId}`);
      }
    }
    pendingLevelUps.set(characterId, queue);

    player.level = Math.max(player.level, newLevel);
    lastConfirmedLevels.set(characterId, newLevel);

    console.log(`[LevelUp] ✅ Ack received for ${characterId} level ${newLevel}. Remaining queue: ${queue.length}`);
    io.emit('player-joined', player);
    io.emit('active-players', Array.from(activePlayers.values()));

    // If more level-ups are queued, send the next one now
    sendPendingLevelUp(characterId);
  });

  socket.on('spren-grant-ack', ({ characterId, order }) => {
    const player = activePlayers.get(socket.id);
    if (!player || player.characterId !== characterId) {
      console.warn(`[Spren] ⚠️ Ack from unknown player/socket ${socket.id} for character ${characterId}`);
      return;
    }

    console.log(`[Spren] ✅ Ack received for ${characterId} spren: ${order}`);
    
    // Mark first confirmation and dequeue current pending grant
    if (!confirmedSprenGrants.has(characterId)) {
      confirmedSprenGrants.add(characterId);
    }

    const queue = pendingSprenGrants.get(characterId) || [];
    if (queue.length > 0) {
      queue.shift();
    }
    pendingSprenGrants.set(characterId, queue);

    // Send next queued spren grant if any
    sendPendingSprenGrant(characterId);
  });

  socket.on('expertise-grant-ack', ({ characterId, expertiseName }) => {
    const player = activePlayers.get(socket.id);
    if (!player || player.characterId !== characterId) {
      console.warn(`[Expertise] ⚠️ Ack from unknown player/socket ${socket.id} for character ${characterId}`);
      return;
    }

    const queue = pendingExpertiseGrants.get(characterId) || [];
    if (queue.length > 0 && queue[0].expertiseName === expertiseName) {
      queue.shift();
    } else {
      const idx = queue.findIndex(entry => entry.expertiseName === expertiseName);
      if (idx !== -1) {
        queue.splice(idx, 1);
      } else {
        console.warn(`[Expertise] ⚠️ Received ack for unexpected expertise ${expertiseName} on character ${characterId}`);
      }
    }
    pendingExpertiseGrants.set(characterId, queue);

    // Track confirmed expertises
    const confirmed = confirmedExpertiseGrants.get(characterId) || new Set();
    confirmed.add(expertiseName);
    confirmedExpertiseGrants.set(characterId, confirmed);

    console.log(`[Expertise] ✅ Ack received for ${characterId} expertise: ${expertiseName}. Remaining queue: ${queue.length}`);

    // Send next queued expertise if any
    sendPendingExpertiseGrants(characterId);
  });

  socket.on('item-grant-ack', ({ characterId, itemId, quantity }) => {
    const player = activePlayers.get(socket.id);
    if (!player || player.characterId !== characterId) {
      console.warn(`[Item] ⚠️ Ack from unknown player/socket ${socket.id} for character ${characterId}`);
      return;
    }

    const queue = pendingItemGrants.get(characterId) || [];
    if (queue.length > 0 && queue[0].itemId === itemId && queue[0].quantity === quantity) {
      queue.shift();
    } else {
      const idx = queue.findIndex(entry => entry.itemId === itemId && entry.quantity === quantity);
      if (idx !== -1) {
        queue.splice(idx, 1);
      } else {
        console.warn(`[Item] ⚠️ Received ack for unexpected item ${itemId} x${quantity} on character ${characterId}`);
      }
    }
    pendingItemGrants.set(characterId, queue);

    console.log(`[Item] ✅ Ack received for ${characterId} item: ${itemId} x${quantity}. Remaining queue: ${queue.length}`);

    // Send next queued item if any
    sendPendingItemGrants(characterId);
  });

  // Handle highstorm toggle from GM
  socket.on('gm-toggle-highstorm', ({ active, timestamp }) => {
    console.log(`[GM Action] ⚡ GM toggling highstorm: ${active}`);
    
    highstormActive = active;
    
    const payload = {
      active,
      triggeredBy: 'GM',
      timestamp: timestamp || new Date().toISOString()
    };
    
    // Broadcast to all connected clients
    io.emit('highstorm-toggle', payload);
    console.log(`[GM Action] ⚡ Highstorm ${active ? 'activated' : 'ended'}`);
  });

  // Handle combat start from GM
  socket.on('gm-start-combat', ({ timestamp }) => {
    console.log(`[Combat] ⚔️ GM starting combat`);
    
    const payload = {
      timestamp: timestamp || new Date().toISOString()
    };
    
    // Broadcast to all connected clients
    io.emit('combat-start', payload);
    console.log(`[Combat] ⚔️ Combat started`);
  });

  // Handle turn speed selection from player
  socket.on('player-select-turn-speed', ({ characterId, turnSpeed, timestamp }) => {
    console.log(`[Combat] 🔄 Player ${characterId} selected ${turnSpeed} turn`);
    
    const payload = {
      characterId,
      turnSpeed,
      timestamp: timestamp || new Date().toISOString()
    };
    
    // Broadcast to all connected clients (GM needs to see updates)
    io.emit('turn-speed-selection', payload);
    console.log(`[Combat] 🔄 Turn speed selection broadcasted`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const player = activePlayers.get(socket.id);
    
    if (player) {
      console.log(`[WebSocket] Player disconnected: ${player.name} (${socket.id})`);
      activePlayers.delete(socket.id);
      
      // Broadcast updated player list
      io.emit('player-left', { characterId: player.characterId, socketId: socket.id });
      io.emit('active-players', Array.from(activePlayers.values()));
    } else {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    }
  });
});

// Start server
async function startServer() {
  await ensureDirectories();
  
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log('========================================');
    console.log('  Sanderson RPG Character Server');
    console.log('========================================');
    console.log(`  Status: Running`);
    console.log(`  Mode: ${IS_PRODUCTION ? 'Production' : 'Development'}`);
    console.log(`  Port: ${PORT}`);
    console.log(`  Storage: ${CHARACTERS_DIR}`);
    console.log(`  Images: ${IMAGES_DIR}`);
    console.log(`  API: http://0.0.0.0:${PORT}/api`);
    console.log(`  WebSocket: Active`);
    if (IS_PRODUCTION) {
      console.log(`  App: http://0.0.0.0:${PORT}`);
    }
    console.log('========================================');
  });
}

startServer().catch(console.error);
