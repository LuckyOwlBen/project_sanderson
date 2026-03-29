import { Request, Response } from 'express';
import { getSettings, updateSettings } from '../services/game-settings-service';

/**
 * GET /api/settings
 * Returns current game settings
 */
export async function getGameSettings(req: Request, res: Response): Promise<void> {
  try {
    const settings = await getSettings();
    res.json({ success: true, settings });
  } catch (error) {
    console.error('[GameSettings] Error getting settings:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
}

/**
 * PATCH /api/settings
 * Update one or more game settings
 * @body { sellPercent?: number }
 */
export async function patchGameSettings(req: Request, res: Response): Promise<void> {
  try {
    const { sellPercent } = req.body ?? {};
    const patch: Record<string, any> = {};
    if (sellPercent !== undefined) patch.sellPercent = sellPercent;

    if (Object.keys(patch).length === 0) {
      res.status(400).json({ success: false, error: 'No settings provided' });
      return;
    }

    const updated = await updateSettings(patch);
    console.log('[GameSettings] Updated settings:', updated);
    res.json({ success: true, settings: updated });
  } catch (error) {
    console.error('[GameSettings] Error updating settings:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
}
