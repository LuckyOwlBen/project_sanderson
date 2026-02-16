import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import util from 'util';
import path from 'path';
import multer from 'multer';
// import sharp from 'sharp'; // TODO: Fix C++ build issue on Node 24.11.1

import talentRules from './talent-rules';
import talentService from './talent-service';
import attributeAllocator from './services/attribute-allocator';
import InventoryManager from './inventory-manager';
import { ALL_ITEMS, getItemById, getKitById } from 'shared/data/items/item-definitions';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { SocketBroadcaster } from './socket-broadcaster';
import { SprenGrantService } from './services/spren-grant-service';
import { ItemGrantRepository } from './repositories/item-grant-repository';
import createCreationRoutes from './routes/creation';
import createConstantsRoutes from './routes/constants';
import createAllocationRoutes from './routes/allocations';
import createCalculationsRoutes from './routes/calculations';
import createSkillCalculationsRoutes from './routes/skill-calculations';
import { createAttackCalculationsRoutes } from './routes/attack-calculations';
import createCharacterRoutes from './routes/character';
import createAncestryRoute from './routes/ancestry-route';
import createCultureRoute from './routes/culture-route';
import createNameRoute from './routes/name-route';
import createAttributesRoute from './routes/attributes-route';
import createSkillsRoute from './routes/skills-route';
import createExpertiseRoute from './routes/expertise-route';
import createTalentsRoute from './routes/talents-route';
import createPathsRoute from './routes/paths';
import createEquipmentRoute from './routes/equipment-route';
import createCharacterFinalizationRoute from './routes/character-finalization-route';
import createCharacterNavFinalizedRoute from './routes/character-nav-finalized-route';
import { attributesService } from './services/attributes-service';
import { AttributesFinalizationService } from './services/attributes-finalization';
import { SprenGrantService } from './services/spren-grant-service';
import { ItemGrantRepository } from './repositories/item-grant-repository';
import { levelUpManager } from './services/levelup-manager';

import {
  initDatabase,
  initializeSchema,
  saveCharacter,
  loadCharacter,
  listCharacters,
  deleteCharacter,
  unlockTalent,
  getSpentPoints,
  getAttributesRecord,
  updateAttributesRecord,
  setAttributesFinalized,
  clearDatabase,
  getTalentsStateRecord,
} from './database';

import { createCharacter } from './services/character-service';

// Initialize database at server startup
initDatabase()
  .then(() => initializeSchema())
  .catch((err) => {
    console.error('[Startup] Failed to initialize database:', err);
  });

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const attributesFinalizationService = new AttributesFinalizationService();

// Initialize grant services
const sprenGrantService = new SprenGrantService(io);
const itemGrantRepository = new ItemGrantRepository();

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
  talentPointsPerLevel: [2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1],
};

// Track active players
const activePlayers = new Map(); // socketId -> {characterId, name, level, ancestry, joinedAt}

// Initialize socket broadcaster (created after io initialization below)
let socketBroadcaster: SocketBroadcaster;

// Track store state
const storeState = {
  'main-store': true,
  'weapons-shop': true,
  'armor-shop': true,
  'equipment-shop': true,
  'consumables-shop': true,
  'fabrials-shop': true,
  'mounts-shop': true,
};

// Track highstorm state
let highstormActive = false;

// Track level-up delivery state
// pendingLevelUps stores queued payloads per characterId to allow retries
// lastConfirmedLevels tracks the last acknowledged level per characterId
const pendingLevelUps = new Map();
const lastConfirmedLevels = new Map();

// Track expertise grant delivery state
// pendingExpertiseGrants stores queued expertise grants per characterId (array of grant objects)
const pendingExpertiseGrants = new Map();
const confirmedExpertiseGrants = new Map(); // characterId -> Set of expertiseNames

// NOTE: Spren grant and item grant delivery state is now managed by:
// - SprenGrantService (in-memory queue + database persistence)
// - ItemGrantRepository (with in-memory queue in socket-handlers/item-grant-handlers.ts)

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
  },
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Handle malformed JSON bodies gracefully
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const parseErrorType = (err as { type?: string })?.type;
  if (err instanceof SyntaxError && parseErrorType === 'entity.parse.failed') {
    console.warn('[API] Malformed JSON payload:', err.message);
    return res.status(400).json({
      success: false,
      error: 'Malformed JSON payload',
    });
  }

  return next(err);
});

// Serve images directory as static
app.use('/images', express.static(IMAGES_DIR));

// Initialize Socket Broadcaster for character updates
socketBroadcaster = new SocketBroadcaster(io, activePlayers);

// Set up periodic cleanup of expired queued updates (every 5 minutes)
setInterval(() => {
  socketBroadcaster.cleanupExpiredUpdates();
}, 5 * 60 * 1000);

// Register character creation routes (ancestry, name, cultures, attributes)
createCreationRoutes(app, CHARACTERS_DIR);

// Register constants routes (point tables, progression data)
createConstantsRoutes(app);

// Register allocation routes (attribute/skill/talent slices and validation)
createAllocationRoutes(app, CHARACTERS_DIR);

// Register calculations routes (defense, derived attributes, full stats)
createCalculationsRoutes(app);

// Register skill calculations routes (skill totals by attribute, surge/non-surge)
createSkillCalculationsRoutes(app);

// Register attack calculations routes (attack rolls, damage, advantage/disadvantage)
createAttackCalculationsRoutes(app);

// Register character service routes (create character, etc.)
createCharacterRoutes(app, CHARACTERS_DIR);

// Register ancestry routes (read ancestry by character ID)
createAncestryRoute(app, socketBroadcaster);

// Register culture routes (read/write cultures by character ID)
createCultureRoute(app, socketBroadcaster);

// Register name routes (read/write name and level by character ID)
createNameRoute(app, socketBroadcaster);

// Register attributes routes (read/write attributes by character ID)
createAttributesRoute(app, socketBroadcaster);

// Register skills routes (read/write skills by character ID)
createSkillsRoute(app, socketBroadcaster);

// Register talents routes (read/write talents by character ID)
createTalentsRoute(app, socketBroadcaster);

// Register expertise routes (read/write expertise by character ID)
createExpertiseRoute(app, socketBroadcaster);

// Register paths routes (read/write path selections by character ID)
createPathsRoute(app, socketBroadcaster);

// Register equipment routes (read/write equipment/inventory by character ID)
createEquipmentRoute(app, socketBroadcaster);

// Register character finalization route (finalize character creation)
createCharacterFinalizationRoute(app, socketBroadcaster);

// Register character navigation finalized route (get finalized status for sidenav)
createCharacterNavFinalizedRoute(app);

// Lightweight operational logs endpoint (newest first)
app.get('/api/logs', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 200, LOG_BUFFER_SIZE);
  const start = Math.max(logBuffer.length - limit, 0);
  const logs = logBuffer.slice(start).reverse();
  originalConsole.log(
    `[API] GET /api/logs requested. Buffer size: ${logBuffer.length}, returning ${logs.length} logs`
  );
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

async function loadCharacterData(id) {
  // Load from database instead of JSON files
  return await loadCharacter(id);
}

async function saveCharacterData(character) {
  // Save to database instead of JSON files
  await saveCharacter(character);
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
    console.log(
      `[GM Action] 🆙 Sending pending level-up to socket ${targetSocket}, new level: ${payload.newLevel}`
    );
    io.to(targetSocket).emit('level-up-granted', payload);
  } else {
    console.warn(
      `[GM Action] ⚠️ No active socket for character ${characterId} while sending pending level-up`
    );
  }
}

// NOTE: sendPendingSprenGrant is now handled by SprenGrantService
// NOTE: sendPendingItemGrants is now handled by item grant handlers

function sendPendingExpertiseGrants(characterId) {
  const queue = pendingExpertiseGrants.get(characterId);
  if (!queue || queue.length === 0) {
    return;
  }

  const targetSocket = findSocketIdByCharacterId(characterId);
  if (targetSocket) {
    const grant = queue[0];
    console.log(
      `[GM Action] 📚 Sending pending expertise grant to socket ${targetSocket}: ${grant.expertiseName}`
    );
    io.to(targetSocket).emit('expertise-granted', grant);
  } else {
    console.warn(
      `[GM Action] ⚠️ No active socket for character ${characterId} while sending pending expertise grant`
    );
  }
}

//Wireguard invite validation
app.get('/invite/:name', (req, res) => {});

// Purchase item from store
app.post('/api/characters/:id/inventory/purchase', async (req, res) => {
  try {
    const { id } = req.params;
    const { itemId, price, quantity } = req.body;

    if (!itemId || price === undefined || quantity === undefined) {
      return res.status(400).json({
        success: false,
        error: 'itemId, price, and quantity are required',
      });
    }

    // Load character
    const character = await loadCharacterData(id);
    if (!character) {
      return res.status(404).json({
        success: false,
        error: 'Character not found',
      });
    }

    // Validate item exists
    const item = getItemById(itemId);
    if (!item) {
      return res.status(400).json({
        success: false,
        error: 'Item not found',
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
        error: 'Cannot afford item',
      });
    }

    // Log transaction
    const conversion = inventoryManager.convertToMixedDenominations(price * quantity);
    console.log(
      `[Store] Purchase: Character ${id} bought ${quantity}x ${item.name} for ${conversion.broams}b ${conversion.marks}m ${conversion.chips}c`
    );

    // Save character with updated inventory
    character.inventory = inventoryManager.serialize();
    await saveCharacterData(character);

    // Also save to database
    try {
      // database.js require removed; use imported async functions
      await saveCharacter(character);
      console.log(`[Inventory] Saved purchase to database for ${character.name} (${character.id})`);
    } catch (dbError) {
      console.warn(`[Inventory] Warning: Failed to save purchase to database: ${dbError.message}`);
      // Continue anyway - JSON save succeeded
    }

    res.json({
      success: true,
      inventory: character.inventory,
      message: `Purchased ${quantity}x ${item.name}`,
    });
  } catch (error) {
    console.error('Error purchasing item:', error);
    res.status(500).json({
      success: false,
      error: error.message,
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
        error: 'kitId is required',
      });
    }

    // Validate kit exists
    const kit = getKitById(kitId);
    if (!kit) {
      return res.status(400).json({
        success: false,
        error: 'Starting kit not found',
      });
    }

    // Load character
    const character = await loadCharacterData(id);
    if (!character) {
      return res.status(404).json({
        success: false,
        error: 'Character not found',
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

    // Also save to database
    try {
      // database.js require removed; use imported async functions
      await saveCharacter(character);
      console.log(
        `[Inventory] Saved starting kit to database for ${character.name} (${character.id})`
      );
    } catch (dbError) {
      console.warn(
        `[Inventory] Warning: Failed to save starting kit to database: ${dbError.message}`
      );
      // Continue anyway - JSON save succeeded
    }

    res.json({
      success: true,
      inventory: character.inventory,
      message: `Applied ${kit.name}`,
    });
  } catch (error) {
    console.error('Error applying kit:', error);
    res.status(500).json({
      success: false,
      error: error.message,
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
        error: 'itemId and quantity are required',
      });
    }

    // Validate item exists
    const item = getItemById(itemId);
    if (!item) {
      return res.status(400).json({
        success: false,
        error: 'Item not found',
      });
    }

    // Load character
    const character = await loadCharacterData(id);
    if (!character) {
      return res.status(404).json({
        success: false,
        error: 'Character not found',
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

    // Also save to database
    try {
      const db = require('./database.js');
      await saveCharacter(character);
      console.log(
        `[Inventory] Saved item addition to database for ${character.name} (${character.id})`
      );
    } catch (dbError) {
      console.warn(
        `[Inventory] Warning: Failed to save item addition to database: ${dbError.message}`
      );
      // Continue anyway - JSON save succeeded
    }

    res.json({
      success: true,
      inventory: character.inventory,
      message: `Added ${quantity}x ${item.name}`,
    });
  } catch (error) {
    console.error('Error adding item:', error);
    res.status(500).json({
      success: false,
      error: error.message,
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
        error: 'itemId and quantity are required',
      });
    }

    // Load character
    const character = await loadCharacterData(id);
    if (!character) {
      return res.status(404).json({
        success: false,
        error: 'Character not found',
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
        error: 'Item not found in inventory',
      });
    }

    // Log action
    console.log(`[Inventory] Removed ${quantity}x item ${itemId} from character ${id}`);

    // Save character with updated inventory
    character.inventory = inventoryManager.serialize();
    await saveCharacterData(character);

    // Also save to database
    try {
      const db = require('./database.js');
      await saveCharacter(character);
      console.log(
        `[Inventory] Saved item removal to database for ${character.name} (${character.id})`
      );
    } catch (dbError) {
      console.warn(
        `[Inventory] Warning: Failed to save item removal to database: ${dbError.message}`
      );
      // Continue anyway - JSON save succeeded
    }

    res.json({
      success: true,
      inventory: character.inventory,
      message: `Removed item`,
    });
  } catch (error) {
    console.error('Error removing item:', error);
    res.status(500).json({
      success: false,
      error: error.message,
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
        error: 'itemId is required',
      });
    }

    // Load character
    const character = await loadCharacterData(id);
    if (!character) {
      return res.status(404).json({
        success: false,
        error: 'Character not found',
      });
    }

    // Instantiate inventory manager and restore from character data
    const inventoryManager = new InventoryManager();
    if (character.inventory) {
      inventoryManager.deserialize(character.inventory);
    }

    // Get item definition for expertise validation
    const item = getItemById(itemId);
    if (item) {
      // Check weapon expertise requirements
      if (item.weaponProperties?.expertTraits && item.weaponProperties.expertTraits.length > 0) {
        // Map item to required expertise
        const requiredExpertise = getRequiredExpertiseForWeapon(item.id, item.name);
        if (requiredExpertise) {
          const characterExpertises = character.expertises || [];
          const hasExpertise = characterExpertises.some((e) => {
            const expertiseName = typeof e === 'string' ? e : e.name;
            return expertiseName === requiredExpertise;
          });

          if (!hasExpertise) {
            console.log(
              `[Inventory] Warning: Character lacks '${requiredExpertise}' expertise for ${item.name}`
            );
            // Log but don't block - character can equip but won't get benefit from expert traits
          }
        }
      }

      // Check armor expertise requirements
      if (item.armorProperties?.expertTraits && item.armorProperties.expertTraits.length > 0) {
        const requiredExpertise = getRequiredExpertiseForArmor(item.id, item.name);
        if (requiredExpertise) {
          const characterExpertises = character.expertises || [];
          const hasExpertise = characterExpertises.some((e) => {
            const expertiseName = typeof e === 'string' ? e : e.name;
            return expertiseName === requiredExpertise;
          });

          if (!hasExpertise) {
            console.log(
              `[Inventory] Warning: Character lacks '${requiredExpertise}' expertise for ${item.name}`
            );
            // Log but don't block
          }
        }
      }
    }

    // Equip item
    if (!inventoryManager.equipItem(itemId)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot equip item',
      });
    }

    // Log action
    console.log(`[Inventory] Equipped item ${itemId} on character ${id}`);

    // Save character with updated inventory
    character.inventory = inventoryManager.serialize();
    await saveCharacterData(character);

    // Also save to database
    try {
      const db = require('./database.js');
      await saveCharacter(character);
      console.log(
        `[Inventory] Saved equipment change to database for ${character.name} (${character.id})`
      );
    } catch (dbError) {
      console.warn(
        `[Inventory] Warning: Failed to save equipment change to database: ${dbError.message}`
      );
      // Continue anyway - JSON save succeeded
    }

    res.json({
      success: true,
      inventory: character.inventory,
      message: `Item equipped`,
    });
  } catch (error) {
    console.error('Error equipping item:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get required expertise for weapon based on item ID or name
 * @bonus Expertise validation helper for equipment
 */
function getRequiredExpertiseForWeapon(itemId, itemName) {
  const weaponMap = {
    sword: 'Dueling',
    axe: 'Axe Fighting',
    mace: 'Bludgeoning Weapons',
    spear: 'Spear Fighting',
    bow: 'Archery',
    dagger: 'Knife Fighting',
    staff: 'Staff Fighting',
    hammer: 'Hammer Fighting',
    lance: 'Mounted Combat',
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
    plate: 'Armor Mastery',
    mail: 'Armor Mastery',
    leather: 'Light Armor',
    hide: 'Light Armor',
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
        error: 'itemId is required',
      });
    }

    // Load character
    const character = await loadCharacterData(id);
    if (!character) {
      return res.status(404).json({
        success: false,
        error: 'Character not found',
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
        error: 'Cannot unequip item',
      });
    }

    // Log action
    console.log(`[Inventory] Unequipped item ${itemId} from character ${id}`);

    // Save character with updated inventory
    character.inventory = inventoryManager.serialize();
    await saveCharacterData(character);

    // Also save to database
    try {
      const db = require('./database.js');
      await saveCharacter(character);
      console.log(
        `[Inventory] Saved equipment change to database for ${character.name} (${character.id})`
      );
    } catch (dbError) {
      console.warn(
        `[Inventory] Warning: Failed to save equipment change to database: ${dbError.message}`
      );
      // Continue anyway - JSON save succeeded
    }

    res.json({
      success: true,
      inventory: character.inventory,
      message: `Item unequipped`,
    });
  } catch (error) {
    console.error('Error unequipping item:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get all available items with optional filters
app.get('/api/items', (req, res) => {
  try {
    const { type, rarity } = req.query;
    let items = ALL_ITEMS;

    if (type) {
      items = items.filter((item) => item.type === type);
    }

    if (rarity) {
      items = items.filter((item) => item.rarity === rarity);
    }

    res.json({
      success: true,
      count: items.length,
      items,
    });
  } catch (error) {
    console.error('Error retrieving items:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get store items (respects GM toggles)
app.get('/api/store/items', (req, res) => {
  try {
    // Filter to common rarity items only
    const storeItems = ALL_ITEMS.filter((item) => item.rarity === 'common');

    res.json({
      success: true,
      count: storeItems.length,
      items: storeItems,
      storeState,
    });
  } catch (error) {
    console.error('Error retrieving store items:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Load character by ID
app.get('/api/characters/load/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const character = await loadCharacter(id);

    if (!character) {
      return res.status(404).json({
        success: false,
        error: 'Character not found',
      });
    }

    // If unlocked talents are missing, backfill from talents state record
    if (!character.unlockedTalents || character.unlockedTalents.length === 0) {
      const talentsState = await getTalentsStateRecord(id);
      if (talentsState) {
        const mergedTalents = new Set<string>([
          ...(talentsState.totalTalents || []),
          ...(talentsState.pendingTalents || []),
        ]);
        character.unlockedTalents = Array.from(mergedTalents);
      }
    }

    // Normalize inventory to client DTO shape
    let inventory = character.inventory as any;
    if (Array.isArray(inventory)) {
      const equippedItems: [string, string][] = [];
      inventory.forEach((item: any) => {
        if (item?.equipped) {
          const itemDef = getItemById(item.itemId);
          const slot = itemDef?.slot || 'mainHand';
          equippedItems.push([slot, item.itemId]);
        }
      });

      inventory = {
        items: inventory.map((item: any) => ({
          id: item.itemId,
          quantity: item.quantity ?? 1,
          customData: {},
        })),
        equippedItems,
        currencyInChips: character.inventory?.currencyInChips ?? 0,
      };
    }

    if (inventory?.items && Array.isArray(inventory.items)) {
      inventory.items = inventory.items.map((item: any) => {
        const itemId = item.id || item.itemId;
        const itemDef = getItemById(itemId);
        if (!itemDef) return item;
        return {
          id: itemId,
          quantity: item.quantity ?? 1,
          customData: item.customData ?? {},
          name: itemDef.name,
          type: itemDef.type,
          description: itemDef.description,
          rarity: itemDef.rarity,
          price: itemDef.price,
          weight: itemDef.weight,
          stackable: itemDef.stackable,
          equipable: itemDef.equipable,
          slot: itemDef.slot,
          weaponProperties: itemDef.weaponProperties,
          armorProperties: itemDef.armorProperties,
          fabrialProperties: itemDef.fabrialProperties,
          properties: itemDef.properties,
        };
      });
    }

    // Preserve currencyInChips from original inventory object
    if (!Array.isArray(character.inventory) && character.inventory?.currencyInChips !== undefined) {
      inventory.currencyInChips = character.inventory.currencyInChips;
    }

    const resources = character.resources || {
      health: { current: 10, max: 10 },
      focus: { current: 2, max: 2 },
      investiture: { current: 0, max: 0, isActive: false },
    };

    const response = {
      ...character,
      // Ensure expected DTO fields exist
      level: character.level,
      pendingLevelPoints: character.pendingLevelPoints,
      pendingLevel: character.pendingLevel ?? false,
      unlockedTalents: character.unlockedTalents || [],
      baselineUnlockedTalents: character.baselineUnlockedTalents || [],
      selectedExpertises: character.selectedExpertises || [],
      unlockedSingerForms: character.unlockedSingerForms || [],
      activeStanceId: character.activeStanceId ?? null,
      inventory: inventory || {
        items: [],
        equippedItems: [],
        currencyInChips: 0,
      },
      radiantPath: character.radiantPath || {
        boundOrder: null,
        currentIdeal: 1,
        idealSpoken: false,
        surgePair: null,
        sprenType: null,
      },
      sessionNotes: character.sessionNotes || '',
      lastModified: character.lastModified || new Date().toISOString(),
      resources,
      // Backward compatibility for client deserializer
      health: resources.health,
      focus: resources.focus,
      investiture: resources.investiture,
    };

    console.log(`Loaded character: ${response.name} (${id})`, {
      level: response.level,
      pendingLevelPoints: response.pendingLevelPoints,
      pendingLevel: response.pendingLevel,
      pendingLevelType: typeof response.pendingLevel,
    });
    console.log(`Character skills:`, response.skills || {});

    res.json(response);
  } catch (error) {
    console.error('Error loading character:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// List all characters
app.get('/api/characters/list', async (req, res) => {
  try {
    // Try to load from database first
    let characters: any[] = [];
    try {
      const db = require('./database.js');
      characters = await listCharacters();
      if (characters && characters.length > 0) {
        console.log(`[Characters/List] Retrieved ${characters.length} characters from database`);
        return res.json(characters);
      }
    } catch (dbError) {
      console.error('[Characters/List] Database error:', (dbError as Error).message);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve characters from database',
      });
    }
  } catch (error) {
    console.error('[Characters/List] Error listing characters:', error);
    res.status(500).json({
      success: false,
      error: error.message,
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
      lastModified: character.lastModified,
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ success: false, error: 'Character not found' });
    }
    console.error('Error loading level summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get level-up status: checks which category states are finalized
app.get('/api/characters/:id/level-up-status', async (req, res) => {
  try {
    const { id } = req.params;
    const status = await levelUpManager.getLevelUpStatus(id);

    if (!status.success) {
      return res.status(500).json({
        success: false,
        error: status.error || 'Failed to fetch level-up status',
      });
    }

    res.json(status);
  } catch (error) {
    console.error('Error fetching level-up status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
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
        error: 'targetLevel must be between 1 and 21',
      });
    }

    const character = await loadCharacterData(id);
    if (!character) {
      return res.status(404).json({ success: false, error: 'Character not found' });
    }

    // Set level and clear spent points for fresh creation at this level
    character.level = targetLevel;
    character.spentPoints = {}; // Fresh state for creation

    // Save character to database
    await saveCharacterData(character);

    console.log(
      `[Character Creation] Initialized character ${character.name} (${id}) at level ${targetLevel}`
    );
    res.json({
      success: true,
      id,
      level: targetLevel,
      message: `Character initialized for creation at level ${targetLevel}`,
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
    console.log(
      `[${mode.toUpperCase()}] Provided skill points for ${character.name} (${
        character.id
      }): ${pointsForLevel} (${spentForThisLevel} already spent, cumulative: ${isCreationMode})`
    );
    console.log(`[${mode}] Current skills for ${character.name}:`, character.skills || {});
    res.json({
      id: character.id,
      level,
      skills: character.skills || {},
      pointsForLevel,
      maxRank: getLevelTableValue(LEVEL_TABLES.maxSkillRanksPerLevel, level),
      ranksPerLevel: getLevelTableValue(LEVEL_TABLES.skillRanksPerLevel, level),
      success: true,
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
      console.warn(
        `[Talents] Character ${character.id} has no main path selected; returning zero points`
      );
      return res.json({
        talentPoints: 0,
        previouslySelectedTalents: [],
        lockedPowers: [],
        requiresSingerSelection: false,
        requiresPathSelection: true,
        ancestry: character.ancestry || null,
        level,
        mainPath: null,
        isCreationMode,
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
      ancestry: character.ancestry || null,
      level,
      mainPath,
      isCreationMode,
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
      spentPoints: state.spentPoints,
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
    const keys = ['strength', 'speed', 'awareness', 'intellect', 'willpower', 'presence'];
    let increaseTotal = 0;
    keys.forEach((k) => {
      const oldVal = Number(prevAttrs[k] ?? 0);
      const newVal = Number(attributes[k] ?? oldVal);
      if (newVal > oldVal) {
        increaseTotal += newVal - oldVal;
      }
    });
    if (increaseTotal > pointsForLevel) {
      return res
        .status(400)
        .json({
          success: false,
          error: `Attribute allocation exceeded. Level ${level} allows ${pointsForLevel} points, attempted ${increaseTotal}.`,
        });
    }

    // Persist merged attributes
    character.attributes = { ...prevAttrs, ...attributes };
    character.lastModified = new Date().toISOString();

    // Track spent points for this level to prevent re-adding on revisits
    if (!character.spentPoints) character.spentPoints = {};
    if (!character.spentPoints.attributes) character.spentPoints.attributes = {};
    character.spentPoints.attributes[level] = increaseTotal;

    // Save to database
    try {
      await saveCharacter(character, {
        attributes: increaseTotal,
        level,
      });
      console.log(
        `[Attributes] Saved attributes to database for ${character.name} (${character.id})`
      );
    } catch (dbError) {
      console.warn(
        `[Attributes] Warning: Failed to save attributes to database: ${dbError.message}`
      );
      // Continue anyway - JSON save succeeded
    }

    res.json({
      success: true,
      id: character.id,
      attributes: character.attributes,
      lastModified: character.lastModified,
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
        increaseTotal += newRank - oldRank;
      }
    });
    if (increaseTotal > pointsForLevel) {
      return res
        .status(400)
        .json({
          success: false,
          error: `Skill allocation exceeded. Level ${level} allows ${pointsForLevel} points, attempted ${increaseTotal}.`,
        });
    }

    character.skills = { ...prevSkills, ...skills };
    character.lastModified = new Date().toISOString();

    // Track spent points for this level to prevent re-adding on revisits
    if (!character.spentPoints) character.spentPoints = {};
    if (!character.spentPoints.skills) character.spentPoints.skills = {};
    character.spentPoints.skills[level] = increaseTotal;

    console.log(`[Skills] Saved skills for ${character.name} (${character.id}):`, character.skills);

    // Save to database
    try {
      await saveCharacter(character, {
        skills: increaseTotal,
        level,
        attributes: character.spentPoints.attributes?.[level] ?? 0,
        talents: character.spentPoints.talents?.[level] ?? 0,
      });
      console.log(`[Skills] Saved skills to database for ${character.name} (${character.id})`);
    } catch (dbError) {
      console.warn(`[Skills] Warning: Failed to save skills to database: ${dbError.message}`);
      // Continue anyway - JSON save succeeded
    }

    res.json({
      success: true,
      id: character.id,
      skills: character.skills,
      lastModified: character.lastModified,
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
        error: 'unlockedTalents must be an array',
      });
    }

    const character = await loadCharacterData(id);
    const level = character.level || 1;
    const mainPath = character.mainPath || character.paths?.[0] || null;

    // Validate selection (pass character object)
    const validation = talentService.validateTalentSelection(
      character,
      unlockedTalents,
      level,
      mainPath
    );
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
        validation,
      });
    }

    // Prepare for save
    const saveResult = talentService.saveTalentSelections(
      character,
      unlockedTalents,
      level,
      mainPath
    );
    if (!saveResult.success) {
      return res.status(400).json({
        success: false,
        error: saveResult.error,
      });
    }

    // Actually save to file/database (this is where server.js would call DB layer)
    character.unlockedTalents = unlockedTalents;
    // Save to database
    await saveCharacterData(character);

    // Return updated state (pass character object)
    const updatedState = talentService.getTalentSelectionState(character, level, false);
    res.json({
      success: true,
      id,
      level,
      unlockedTalents: updatedState.unlockedTalents,
      spentPoints: updatedState.spentPoints,
      pointsForLevel: updatedState.talentPoints,
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
    const result = await deleteCharacter(id);
    if (result.success) {
      console.log(`Deleted character: ${id}`);
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: result.error || 'Character not found' });
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({
        success: false,
        error: 'Character not found',
      });
    }
    console.error('Error deleting character:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Upload character portrait/image
app.post('/api/images/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided',
      });
    }

    // Sharp not available
    if (!sharp) {
      return res.status(503).json({
        success: false,
        error: 'Image processing service temporarily unavailable',
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
      .resize(800, 800, {
        // Max dimensions, maintains aspect ratio
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({
        quality: 85, // Good balance of quality and file size
        effort: 4, // Compression effort (0-6, higher = smaller file)
      })
      .toFile(filepath);

    const imageUrl = `/images/${filename}`;

    console.log(`Uploaded image: ${filename} (${Math.round(req.file.size / 1024)}KB -> WebP)`);

    res.json({
      success: true,
      imageUrl: imageUrl,
      filename: filename,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      error: error.message,
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
        error: 'Invalid filename',
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
        error: 'Image not found',
      });
    }
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// List all images (optional - for gallery)
app.get('/api/images/list', async (req, res) => {
  try {
    const files = await fsPromises.readdir(IMAGES_DIR);
    const imageFiles = files.filter(
      (f) => f.endsWith('.webp') || f.endsWith('.jpg') || f.endsWith('.png')
    );

    const images = imageFiles.map((filename) => ({
      filename: filename,
      url: `/images/${filename}`,
    }));

    res.json({
      success: true,
      images: images,
    });
  } catch (error) {
    console.error('Error listing images:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mode: IS_PRODUCTION ? 'production' : 'development',
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
  socket.on('player-join', async (data) => {
    const { characterId, name, level, ancestry, health, focus, investiture } = data;

    // Handle ancestry - should always be a string from Ancestry enum (e.g., 'human', 'singer')
    // Fallback to 'Unknown' if null/undefined
    const ancestryName = ancestry || 'Unknown';
    let effectiveLevel = level;
    let currencyInChips = 0;

    // Load character to get currency info
    try {
      const character = await loadCharacter(characterId);
      if (character && character.inventory) {
        currencyInChips = character.inventory.currencyInChips || 0;
      }
    } catch (error) {
      console.warn(`[Session] Could not load character currency for ${characterId}:`, error);
    }

    const confirmedLevel = lastConfirmedLevels.get(characterId);
    const existingQueue = pendingLevelUps.get(characterId) || [];
    if (confirmedLevel && confirmedLevel > level) {
      console.warn(
        `[Session] Detected level mismatch for ${characterId}: client ${level}, confirmed ${confirmedLevel}. Queuing catch-up events.`
      );
      let baseLevel =
        existingQueue.length > 0 ? existingQueue[existingQueue.length - 1].newLevel : level;
      for (let nextLevel = baseLevel + 1; nextLevel <= confirmedLevel; nextLevel++) {
        existingQueue.push({
          characterId,
          newLevel: nextLevel,
          grantedBy: 'RESYNC',
          timestamp: new Date().toISOString(),
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
      currencyInChips,
      joinedAt: new Date().toISOString(),
      socketId: socket.id,
    });

    lastConfirmedLevels.set(characterId, effectiveLevel);

    console.log(`[Session] Player joined: ${name} (${characterId})`);

    // Broadcast updated player list to all GM clients
    io.emit('player-joined', activePlayers.get(socket.id));
    io.emit('active-players', Array.from(activePlayers.values()));

    // Send any pending grants to the reconnected player
    sendPendingLevelUp(characterId);
    await sprenGrantService.resendPendingOnReconnect(characterId, socket.id);
    sendPendingExpertiseGrants(characterId);

    // Deliver any pending character-updated events
    socketBroadcaster.deliverPendingUpdates(socket.id, characterId);
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
        investiture,
      });

      // Critical alert for zero health
      if (health.current === 0) {
        console.log(`[CRITICAL] ${player.name} has reached 0 health!`);
        io.emit('player-critical', {
          characterId,
          playerName: player.name,
          message: `${player.name} has reached 0 health!`,
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
        toggledBy: 'SERVER',
      });
    });

    console.log('[WebSocket] 📤 Sent current store state:', storeState);
  });

  // Store transaction from player - process purchase and broadcast state update
  socket.on('store-transaction', async (data) => {
    const { storeId, characterId, items, totalCost, timestamp } = data;
    console.log(`[Store] Transaction at ${storeId} by ${characterId}: ${totalCost}mk`);

    try {
      // Load character once
      const character = await loadCharacterData(characterId);
      if (!character) {
        console.error(`[Store] Character ${characterId} not found`);
        socket.emit('store-transaction-error', {
          characterId,
          error: 'Character not found',
        });
        return;
      }

      // Get current currency
      let currentCurrency = character.inventory?.currencyInChips ?? 0;

      // Check if player can afford all items
      if (currentCurrency < totalCost) {
        socket.emit('store-transaction-error', {
          characterId,
          error: 'Cannot afford items',
        });
        return;
      }

      // Deduct currency
      const newCurrency = currentCurrency - totalCost;

      // Add purchased items to inventory
      const newItems = [...(character.inventory?.items ?? [])];
      for (const item of items) {
        const { itemId, quantity } = item;

        // Validate item exists
        const itemDef = getItemById(itemId);
        if (!itemDef) {
          socket.emit('store-transaction-error', {
            characterId,
            error: `Item ${itemId} not found`,
          });
          return;
        }

        // Check if item already exists in inventory
        const existingIndex = newItems.findIndex((inv: any) => inv.id === itemId);
        if (existingIndex >= 0) {
          newItems[existingIndex].quantity = (newItems[existingIndex].quantity || 1) + quantity;
        } else {
          newItems.push({
            id: itemId,
            quantity,
            customData: {},
          });
        }

        console.log(
          `[Store] Purchase: Character ${characterId} bought ${quantity}x ${itemDef.name}`
        );
      }

      // Update character inventory
      character.inventory = {
        ...character.inventory,
        items: newItems,
        currencyInChips: newCurrency,
      };

      // Save to database
      await saveCharacter(character);
      console.log(`[Store] Saved purchase to database for ${character.name} (${character.id})`);

      // Broadcast to all GM clients for tracking
      io.emit('store-transaction', data);

      // Immediately acknowledge acceptance back to sender
      const ackId = `${Date.now()}-${Math.random()}`;
      socket.emit('store-transaction-accepted', {
        ackId,
        storeId,
        characterId,
        totalCost,
        timestamp: timestamp || new Date().toISOString(),
      });
    } catch (error) {
      console.error('[Store] Transaction error:', error);
      socket.emit('store-transaction-error', {
        characterId,
        error: error.message || 'Transaction failed',
      });
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
      toggledBy: 'GM',
    });
  });

  // GM grants spren to a player
  socket.on('gm-grant-spren', async (data) => {
    const { characterId, order, sprenType, surgePair, philosophy } = data;
    console.log(`[GM Action] ⭐ RECEIVED GM-GRANT-SPREN REQUEST for ${characterId}: ${order}`);

    const targetSocket = findSocketIdByCharacterId(characterId);

    const payload = {
      characterId,
      order,
      sprenType,
      surgePair,
      philosophy,
    };

    // Queue via service
    const result = await sprenGrantService.queueSprenGrant(payload, findSocketIdByCharacterId);
    console.log(`[Spren] Queue result:`, result);
  });

  // Player acknowledges spren grant
  socket.on('spren-grant-ack', async ({ characterId, order }) => {
    const player = activePlayers.get(socket.id);
    if (!player || player.characterId !== characterId) {
      console.warn(
        `[Spren] ⚠️ Ack from unknown player/socket ${socket.id} for character ${characterId}`
      );
      return;
    }

    const result = await sprenGrantService.handleSprenAck(characterId, order);
    if (result.success) {
      console.log(`[Spren] ✅ Ack processed for ${characterId}: ${order}`);
    }
  });

  // GM grants item to a player
  socket.on('gm-grant-item', async (data) => {
    const { characterId, itemId, quantity, timestamp } = data;
    console.log(`[GM Action] 🎁 Granting ${quantity}x ${itemId} to character ${characterId}`);

    // Add to database via repository
    const result = await itemGrantRepository.addItemToCharacter(characterId, itemId, quantity);

    if (result.success) {
      console.log(`[Item] ✅ Item grant succeeded for ${characterId}`);

      // Send acknowledgment back to GM
      socket.emit('item-grant-success', {
        characterId,
        itemId,
        quantity,
        timestamp: timestamp || new Date().toISOString(),
      });

      // Notify the player that they received an item
      const targetSocket = findSocketIdByCharacterId(characterId);
      if (targetSocket) {
        io.to(targetSocket).emit('item-granted', {
          characterId,
          itemId,
          quantity,
          grantedBy: 'GM',
          timestamp: timestamp || new Date().toISOString(),
        });
      }
    } else {
      console.error(`[Item] ❌ Item grant failed: ${result.error}`);
      socket.emit('item-grant-error', {
        characterId,
        itemId,
        error: result.error,
      });
    }
  });

  // Player acknowledges item grant
  socket.on('item-grant-ack', ({ characterId, itemId, quantity }) => {
    const player = activePlayers.get(socket.id);
    if (!player || player.characterId !== characterId) {
      console.warn(
        `[Item] ⚠️ Ack from unknown player/socket ${socket.id} for character ${characterId}`
      );
      return;
    }

    console.log(`[Item] ✅ Ack received for ${characterId} item: ${itemId} x${quantity}`);
    // Item is already persisted, just log the ack
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
      timestamp: timestamp || new Date().toISOString(),
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

  // GM grants money to a player
  socket.on('gm-grant-money', async (data) => {
    const { characterId, amount, operation, timestamp } = data;
    console.log(
      `[GM Action] 💰 Granting money: ${amount} (${operation}) to character ${characterId}`
    );

    try {
      // Load character
      const character = await loadCharacter(characterId);
      if (!character) {
        console.error(`[GM Action] ❌ Character ${characterId} not found`);
        socket.emit('gm-grant-error', {
          type: 'money',
          characterId,
          error: 'Character not found',
        });
        return;
      }

      // Initialize inventory if needed
      if (!character.inventory) {
        character.inventory = {
          items: [],
          currencyInChips: 0,
        };
      }

      // Get current balance
      const currentBalance = character.inventory.currencyInChips || 0;
      let newBalance = currentBalance;

      // Apply operation
      if (operation === 'add') {
        newBalance = currentBalance + amount;
      } else if (operation === 'set') {
        newBalance = amount;
      }

      // Update character
      character.inventory.currencyInChips = newBalance;
      await saveCharacter(character);

      console.log(
        `[GM Action] ✅ Money updated for ${characterId}: ${currentBalance} → ${newBalance}`
      );

      // Find player's socket and notify them
      const targetSocketId = findSocketIdByCharacterId(characterId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('money-granted', {
          amount: operation === 'add' ? amount : 0,
          newBalance,
          operation,
          timestamp: timestamp || new Date().toISOString(),
        });
        console.log(`[GM Action] 💬 Notified player of money grant`);
      } else {
        console.warn(
          `[GM Action] ⚠️ Player ${characterId} offline - money still saved to character`
        );
      }

      // Update active players cache
      const targetPlayer = Array.from(activePlayers.values()).find(
        (p) => p.characterId === characterId
      );
      if (targetPlayer) {
        targetPlayer.currencyInChips = newBalance;
      }

      socket.emit('gm-grant-success', {
        type: 'money',
        characterId,
        amount,
        operation,
        newBalance,
      });
    } catch (error) {
      console.error(`[GM Action] ❌ Error in gm-grant-money handler:`, error);
      socket.emit('gm-grant-error', {
        type: 'money',
        characterId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // GM grants a level-up to a player
  socket.on('gm-grant-level-up', async (data) => {
    const { characterId, timestamp } = data;
    console.log(`[GM Action] 🆙 Granting level-up to character ${characterId}`);

    const targetSocket = findSocketIdByCharacterId(characterId);
    const player = targetSocket ? activePlayers.get(targetSocket) : null;

    if (player) {
      // Process level-up in database: increment level, award points, set finalized: false
      const levelUpResult = await levelUpManager.processLevelUp(characterId);
      if (!levelUpResult.success) {
        console.error(
          `[LevelUp] ❌ Failed to process level-up for ${characterId}: ${levelUpResult.error}`
        );
        return;
      }

      console.log(
        `[LevelUp] ✅ Awarded points - Attributes: ${levelUpResult.attributePointsAwarded}, ` +
          `Skills: ${levelUpResult.skillPointsAwarded}, Talents: ${levelUpResult.talentPointsAwarded}`
      );

      // Broadcast character update so UI sees pendingLevel: true
      socketBroadcaster.scheduleCharacterUpdate(characterId);

      const queue = pendingLevelUps.get(characterId) || [];
      const baseLevel = queue.length > 0 ? queue[queue.length - 1].newLevel : player.level;
      const newLevel = baseLevel + 1;
      const payload = {
        characterId,
        newLevel,
        grantedBy: 'GM',
        timestamp: timestamp || new Date().toISOString(),
      };

      queue.push(payload);
      pendingLevelUps.set(characterId, queue);

      // Keep GM dashboards optimistic while we wait for ack
      player.level = Math.max(player.level, newLevel);
      console.log(
        `[GM Action] 🆙 Queue size for ${characterId}: ${queue.length}. Next level: ${newLevel}`
      );

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
      console.warn(
        `[LevelUp] ⚠️ Ack from unknown player/socket ${socket.id} for character ${characterId}`
      );
      return;
    }

    const queue = pendingLevelUps.get(characterId) || [];
    if (queue.length > 0 && queue[0].newLevel === newLevel) {
      queue.shift();
    } else {
      const idx = queue.findIndex((entry) => entry.newLevel === newLevel);
      if (idx !== -1) {
        queue.splice(idx, 1);
      } else {
        console.warn(
          `[LevelUp] ⚠️ Received ack for unexpected level ${newLevel} on character ${characterId}`
        );
      }
    }
    pendingLevelUps.set(characterId, queue);

    player.level = Math.max(player.level, newLevel);
    lastConfirmedLevels.set(characterId, newLevel);

    console.log(
      `[LevelUp] ✅ Ack received for ${characterId} level ${newLevel}. Remaining queue: ${queue.length}`
    );
    io.emit('player-joined', player);
    io.emit('active-players', Array.from(activePlayers.values()));

    // If more level-ups are queued, send the next one now
    sendPendingLevelUp(characterId);
  });

  socket.on('expertise-grant-ack', ({ characterId, expertiseName }) => {
    const player = activePlayers.get(socket.id);
    if (!player || player.characterId !== characterId) {
      console.warn(
        `[Expertise] ⚠️ Ack from unknown player/socket ${socket.id} for character ${characterId}`
      );
      return;
    }

    const queue = pendingExpertiseGrants.get(characterId) || [];
    if (queue.length > 0 && queue[0].expertiseName === expertiseName) {
      queue.shift();
    } else {
      const idx = queue.findIndex((entry) => entry.expertiseName === expertiseName);
      if (idx !== -1) {
        queue.splice(idx, 1);
      } else {
        console.warn(
          `[Expertise] ⚠️ Received ack for unexpected expertise ${expertiseName} on character ${characterId}`
        );
      }
    }
    pendingExpertiseGrants.set(characterId, queue);

    // Track confirmed expertises
    const confirmed = confirmedExpertiseGrants.get(characterId) || new Set();
    confirmed.add(expertiseName);
    confirmedExpertiseGrants.set(characterId, confirmed);

    console.log(
      `[Expertise] ✅ Ack received for ${characterId} expertise: ${expertiseName}. Remaining queue: ${queue.length}`
    );

    // Send next queued expertise if any
    sendPendingExpertiseGrants(characterId);
  });

  // Handle highstorm toggle from GM
  socket.on('gm-toggle-highstorm', ({ active, timestamp }) => {
    console.log(`[GM Action] ⚡ GM toggling highstorm: ${active}`);

    highstormActive = active;

    const payload = {
      active,
      triggeredBy: 'GM',
      timestamp: timestamp || new Date().toISOString(),
    };

    // Broadcast to all connected clients
    io.emit('highstorm-toggle', payload);
    console.log(`[GM Action] ⚡ Highstorm ${active ? 'activated' : 'ended'}`);
  });

  // Handle combat start from GM
  socket.on('gm-start-combat', ({ timestamp }) => {
    console.log(`[Combat] ⚔️ GM starting combat`);

    const payload = {
      timestamp: timestamp || new Date().toISOString(),
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
      timestamp: timestamp || new Date().toISOString(),
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

    // Clean up broadcaster timers for this socket
    socketBroadcaster.cleanupSocket(socket.id);
  });
});

// Start server
async function startServer() {
  await ensureDirectories();

  httpServer.on('error', (err) => {
    console.error('[Server Error]', err);
    process.exit(1);
  });

  // Bind to localhost and 0.0.0.0 to ensure both work
  httpServer.listen(PORT, '127.0.0.1', () => {
    console.log('========================================');
    console.log('  Sanderson RPG Character Server');
    console.log('========================================');
    console.log(`  Status: Running`);
    console.log(`  Mode: ${IS_PRODUCTION ? 'Production' : 'Development'}`);
    console.log(`  Port: ${PORT}`);
    console.log(`  Storage: ${CHARACTERS_DIR}`);
    console.log(`  Images: ${IMAGES_DIR}`);
    console.log(`  API: http://localhost:${PORT}/api`);
    console.log(`  WebSocket: Active`);
    if (IS_PRODUCTION) {
      console.log(`  App: http://localhost:${PORT}`);
    }
    console.log('========================================');
  });
}

startServer().catch((err) => {
  console.error('[Startup Error]', err);
  process.exit(1);
});
