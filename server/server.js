const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 3000;
const CHARACTERS_DIR = path.join(__dirname, 'characters');
const IMAGES_DIR = path.join(__dirname, 'images');
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

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

// Start server
async function startServer() {
  await ensureDirectories();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log('========================================');
    console.log('  Sanderson RPG Character Server');
    console.log('========================================');
    console.log(`  Status: Running`);
    console.log(`  Mode: ${IS_PRODUCTION ? 'Production' : 'Development'}`);
    console.log(`  Port: ${PORT}`);
    console.log(`  Storage: ${CHARACTERS_DIR}`);
    console.log(`  Images: ${IMAGES_DIR}`);
    console.log(`  API: http://0.0.0.0:${PORT}/api`);
    if (IS_PRODUCTION) {
      console.log(`  App: http://0.0.0.0:${PORT}`);
    }
    console.log('========================================');
  });
}

startServer().catch(console.error);
