import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { initDatabase, initializeSchema } from './database';
import { AttributesService } from './services/attributeService';
import { AttributesController } from './controllers/attributesController';
import { createAttributeRouter } from './routes/attributeRoute';
import { CharacterService } from './services/characterService';
import { CharacterController } from './controllers/characterController';
import { createCharacterRouter } from './routes/characterRoute';

const app: Express = express();
const PORT = Number(process.env.PORT) || 3000;
const attributesService = new AttributesService();
const attributesController = new AttributesController(attributesService);
const characterService = new CharacterService();
const characterController = new CharacterController(characterService);

// Middleware
app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message });
});

//Routes
app.use('/api', createAttributeRouter(attributesController));
app.use('/api', createCharacterRouter(characterController));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Start server
async function startServer() {
  try {
    // Initialize database
    await initDatabase();
    await initializeSchema();
    console.log('Database initialized');

    // Start Express server
    app.listen(PORT, '127.0.0.1', () => {
      console.log(`Server running on http://127.0.0.1:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
