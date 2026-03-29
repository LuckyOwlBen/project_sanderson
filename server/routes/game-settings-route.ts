import { Express } from 'express';
import { getGameSettings, patchGameSettings } from '../controllers/game-settings-controller';

export default function createGameSettingsRoute(app: Express): void {
  app.get('/api/settings', getGameSettings);
  app.patch('/api/settings', patchGameSettings);
}
