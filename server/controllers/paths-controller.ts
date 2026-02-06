import { Request, Response } from 'express';
import { getPathsByCharacterId, setPathsByCharacterId } from '../services/paths-service';
import TalentService from '../services/talent-service';
import { SocketBroadcaster } from '../socket-broadcaster';

const talentService = new TalentService();

export async function getPaths(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const paths = await getPathsByCharacterId(id);

    res.json({
      success: true,
      type: paths.type,
      sub: paths.sub
    });
  } catch (error) {
    console.error('Error loading paths:', error);
    res.status(500).json({
      success: false,
      error: typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error)
    });
  }
}

export async function setPaths(req: Request, res: Response, broadcaster: SocketBroadcaster): Promise<void> {
  try {
    const { id } = req.params;
    const { type, sub } = req.body ?? {};

    if (typeof type !== 'string' || typeof sub !== 'string') {
      res.status(400).json({
        success: false,
        error: 'type and sub must be strings'
      });
      return;
    }

    const updated = await setPathsByCharacterId(id, type, sub);
    
    // Ensure tier 0 talent is unlocked in the UnlockedTalent table
    talentService.ensureTier0Unlocked(id, type);
    
    // Broadcast character update via WebSocket
    broadcaster.scheduleCharacterUpdate(id);

    res.json({
      success: true,
      type: updated.type,
      sub: updated.sub
    });
  } catch (error) {
    console.error('Error saving paths:', error);
    res.status(500).json({
      success: false,
      error: typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error)
    });
  }
}
