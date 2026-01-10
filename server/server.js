const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
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

const PORT = process.env.PORT || 3000;
const CHARACTERS_DIR = path.join(__dirname, 'characters');
const IMAGES_DIR = path.join(__dirname, 'images');
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

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

// Serve static Angular files in production
if (IS_PRODUCTION) {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  console.log('Serving static files from:', distPath);
}

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.access(CHARACTERS_DIR);
  } catch {
    await fs.mkdir(CHARACTERS_DIR, { recursive: true });
    console.log('Created characters directory:', CHARACTERS_DIR);
  }
  
  try {
    await fs.access(IMAGES_DIR);
  } catch {
    await fs.mkdir(IMAGES_DIR, { recursive: true });
    console.log('Created images directory:', IMAGES_DIR);
  }
}

//Wireguard invite validation
app.get('/invite/:name', (req, res) => {
   
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

    const filename = `${character.id}.json`;
    const filepath = path.join(CHARACTERS_DIR, filename);
    
    await fs.writeFile(filepath, JSON.stringify(character, null, 2), 'utf8');
    
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

// Load character by ID
app.get('/api/characters/load/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const filepath = path.join(CHARACTERS_DIR, `${id}.json`);
    
    const data = await fs.readFile(filepath, 'utf8');
    const character = JSON.parse(data);
    
    console.log(`Loaded character: ${character.name} (${id})`);
    
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
    const files = await fs.readdir(CHARACTERS_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    const characters = await Promise.all(
      jsonFiles.map(async (file) => {
        try {
          const filepath = path.join(CHARACTERS_DIR, file);
          const data = await fs.readFile(filepath, 'utf8');
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

// Delete character
app.delete('/api/characters/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const filepath = path.join(CHARACTERS_DIR, `${id}.json`);
    
    await fs.unlink(filepath);
    
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
    
    await fs.unlink(filepath);
    
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
    const files = await fs.readdir(IMAGES_DIR);
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
    
    activePlayers.set(socket.id, {
      characterId,
      name,
      level,
      ancestry: ancestryName,
      health: health || { current: 0, max: 0 },
      focus: focus || { current: 0, max: 0 },
      investiture: investiture || { current: 0, max: 0 },
      joinedAt: new Date().toISOString(),
      socketId: socket.id
    });
    
    console.log(`[Session] Player joined: ${name} (${characterId})`);
    
    // Broadcast updated player list to all GM clients
    io.emit('player-joined', activePlayers.get(socket.id));
    io.emit('active-players', Array.from(activePlayers.values()));
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
    console.log(`[GM Action] Current active players:`, Array.from(activePlayers.entries()).map(([sid, p]) => ({ socketId: sid, characterId: p.characterId, name: p.name })));
    
    // Find the target player's socket
    let targetSocket = null;
    for (const [socketId, player] of activePlayers.entries()) {
      if (player.characterId === characterId) {
        targetSocket = socketId;
        break;
      }
    }
    
    if (targetSocket) {
      // Send spren grant to specific player
      const payload = {
        characterId,
        order,
        sprenType,
        surgePair,
        philosophy
      };
      console.log(`[GM Action] ⭐ Sending spren-granted to socket ${targetSocket} with payload:`, payload);
      io.to(targetSocket).emit('spren-granted', payload);
      console.log(`[GM Action] ⭐ Spren grant sent to socket ${targetSocket}`);
    } else {
      console.warn(`[GM Action] ⚠️ Could not find active player with characterId ${characterId}`);
      console.warn(`[GM Action] ⚠️ Available character IDs:`, Array.from(activePlayers.values()).map(p => p.characterId));
    }
  });

  // Store transaction from player
  socket.on('store-transaction', (data) => {
    const { storeId, characterId, items, totalCost, timestamp } = data;
    console.log(`[Store] Transaction at ${storeId} by ${characterId}: ${totalCost}mk`);
    
    // Broadcast to all GM clients for tracking
    io.emit('store-transaction', data);
  });

  // GM grants item to a player
  socket.on('gm-grant-item', (data) => {
    const { characterId, itemId, quantity, timestamp } = data;
    console.log(`[GM Action] 🎁 Granting ${quantity}x ${itemId} to character ${characterId}`);
    
    // Find the target player's socket
    let targetSocket = null;
    for (const [socketId, player] of activePlayers.entries()) {
      if (player.characterId === characterId) {
        targetSocket = socketId;
        break;
      }
    }
    
    if (targetSocket) {
      const payload = {
        characterId,
        itemId,
        quantity,
        grantedBy: 'GM',
        timestamp: timestamp || new Date().toISOString()
      };
      console.log(`[GM Action] 🎁 Sending item-granted to socket ${targetSocket}`);
      io.to(targetSocket).emit('item-granted', payload);
    } else {
      console.warn(`[GM Action] ⚠️ Could not find active player with characterId ${characterId}`);
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
    
    // Find the target player's socket
    let targetSocket = null;
    for (const [socketId, player] of activePlayers.entries()) {
      if (player.characterId === characterId) {
        targetSocket = socketId;
        break;
      }
    }
    
    if (targetSocket) {
      const payload = {
        characterId,
        expertiseName,
        grantedBy: 'GM',
        timestamp: timestamp || new Date().toISOString()
      };
      console.log(`[GM Action] 📚 Sending expertise-granted to socket ${targetSocket}`);
      io.to(targetSocket).emit('expertise-granted', payload);
    } else {
      console.warn(`[GM Action] ⚠️ Could not find active player with characterId ${characterId}`);
    }
  });

  // GM grants a level-up to a player
  socket.on('gm-grant-level-up', (data) => {
    const { characterId, timestamp } = data;
    console.log(`[GM Action] 🆙 Granting level-up to character ${characterId}`);
    
    // Find the target player's socket and update their level
    let targetSocket = null;
    let player = null;
    for (const [socketId, p] of activePlayers.entries()) {
      if (p.characterId === characterId) {
        targetSocket = socketId;
        player = p;
        break;
      }
    }
    
    if (targetSocket && player) {
      // Increment level
      player.level += 1;
      const newLevel = player.level;
      
      const payload = {
        characterId,
        newLevel,
        grantedBy: 'GM',
        timestamp: timestamp || new Date().toISOString()
      };
      
      console.log(`[GM Action] 🆙 Sending level-up-granted to socket ${targetSocket}, new level: ${newLevel}`);
      io.to(targetSocket).emit('level-up-granted', payload);
      
      // Also notify GM with updated player info
      io.emit('player-joined', player);
    } else {
      console.warn(`[GM Action] ⚠️ Could not find active player with characterId ${characterId}`);
    }
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
