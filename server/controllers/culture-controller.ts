import { Request, Response } from 'express';
import { getCulturesByCharacterId, setCulturesByCharacterId } from '../services/culture-service';
import { SocketBroadcaster } from '../socket-broadcaster';

export async function getCultures(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await getCulturesByCharacterId(id);

    res.json({
      success: true,
      cultures: result.cultures ?? []
    });
  } catch (error) {
    console.error('Error loading cultures:', error);
    res.status(500).json({
      success: false,
      error: typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error)
    });
  }
}

export async function setCultures(req: Request, res: Response, broadcaster: SocketBroadcaster): Promise<void> {
  try {
    const { id } = req.params;
    const { cultures } = req.body ?? {};

    if (!Array.isArray(cultures)) {
      res.status(400).json({
        success: false,
        error: 'cultures must be an array'
      });
      return;
    }

    const updated = await setCulturesByCharacterId(id, cultures);
    
    // Broadcast character update via WebSocket
    broadcaster.scheduleCharacterUpdate(id);

    res.json({
      success: true,
      cultures: updated.cultures ?? []
    });
  } catch (error) {
    console.error('Error saving cultures:', error);
    res.status(500).json({
      success: false,
      error: typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error)
    });
  }
}
