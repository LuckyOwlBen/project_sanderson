import { Request, Response } from 'express';
import { getAncestryByCharacterId, setAncestryByCharacterId } from '../services/ancestry-service';
import { SocketBroadcaster } from '../socket-broadcaster';

export async function getAncestry(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const ancestry = await getAncestryByCharacterId(id);

    res.json({
      success: true,
      ancestry: ancestry.ancestry ?? null,
    });
  } catch (error) {
    console.error('Error loading ancestry:', error);
    res.status(500).json({
      success: false,
      error:
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message: string }).message
          : String(error),
    });
  }
}

export async function setAncestry(
  req: Request,
  res: Response,
  broadcaster: SocketBroadcaster
): Promise<void> {
  try {
    const { id } = req.params;
    const { ancestry } = req.body ?? {};

    if (ancestry !== null && typeof ancestry !== 'string') {
      res.status(400).json({
        success: false,
        error: 'ancestry must be a string or null',
      });
      return;
    }

    const updated = await setAncestryByCharacterId(id, ancestry ?? null);

    // Broadcast character update via WebSocket
    broadcaster.scheduleCharacterUpdate(id);

    res.json({
      success: true,
      ancestry: updated.ancestry ?? null,
    });
  } catch (error) {
    console.error('Error saving ancestry:', error);
    res.status(500).json({
      success: false,
      error:
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message: string }).message
          : String(error),
    });
  }
}
