import { Request, Response } from 'express';
import { getTalentsByCharacterId, setTalentsByCharacterId } from '../services/talents-service';
import { SocketBroadcaster } from '../socket-broadcaster';

export async function getTalents(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await getTalentsByCharacterId(id);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error loading talents:', error);
    res.status(500).json({
      success: false,
      error: typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error)
    });
  }
}

export async function setTalents(req: Request, res: Response, broadcaster: SocketBroadcaster): Promise<void> {
  try {
    const { id } = req.params;
    const { talents } = req.body ?? {};

    if (!talents || typeof talents !== 'object' || Array.isArray(talents)) {
      res.status(400).json({
        success: false,
        error: 'talents must be an object'
      });
      return;
    }

    if (talents.totalTalents !== undefined && !Array.isArray(talents.totalTalents)) {
      res.status(400).json({
        success: false,
        error: 'talents.totalTalents must be an array'
      });
      return;
    }

    if (talents.pendingTalents !== undefined && !Array.isArray(talents.pendingTalents)) {
      res.status(400).json({
        success: false,
        error: 'talents.pendingTalents must be an array'
      });
      return;
    }

    const updated = await setTalentsByCharacterId(id, talents);
    
    // Broadcast character update via WebSocket
    broadcaster.scheduleCharacterUpdate(id);

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Error saving talents:', error);
    res.status(500).json({
      success: false,
      error: typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error)
    });
  }
}
