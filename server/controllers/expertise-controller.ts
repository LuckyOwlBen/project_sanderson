import { Request, Response } from 'express';
import { getExpertiseByCharacterId, setExpertiseByCharacterId, ValidationError } from '../services/expertise-service';
import { expertiseListManager } from '../services/expertise-list-manager';
import { SocketBroadcaster } from '../socket-broadcaster';

export async function getExpertise(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await getExpertiseByCharacterId(id);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error loading expertise:', error);
    res.status(500).json({
      success: false,
      error: typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error)
    });
  }
}

export async function setExpertise(req: Request, res: Response, broadcaster: SocketBroadcaster): Promise<void> {
  try {
    const { id } = req.params;
    const { expertise } = req.body ?? {};

    if (!expertise || !Array.isArray(expertise)) {
      res.status(400).json({
        success: false,
        error: 'expertise must be an array of expertise selections'
      });
      return;
    }

    const result = await setExpertiseByCharacterId(id, expertise);

    // Check if result is a validation error
    if (!('characterId' in result)) {
      // It's a ValidationError
      const validationError = result as ValidationError;
      res.status(400).json({
        success: false,
        error: validationError.error
      });
      return;
    }
    
    // Broadcast character update via WebSocket
    broadcaster.scheduleCharacterUpdate(id);

    // It's a successful ExpertiseStateDTO
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error saving expertise:', error);
    res.status(500).json({
      success: false,
      error: typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error)
    });
  }
}

export async function getAvailableExpertise(req: Request, res: Response): Promise<void> {
  try {
    const available = expertiseListManager.getAvailableExpertise();
    res.json({
      success: true,
      data: available
    });
  } catch (error) {
    console.error('Error loading available expertise:', error);
    res.status(500).json({
      success: false,
      error: typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error)
    });
  }
}
