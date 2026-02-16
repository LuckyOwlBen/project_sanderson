import { Request, Response } from 'express';
import {
  getAttributesByCharacterId,
  setAttributesByCharacterId,
  finalizeAttributesByCharacterId,
} from '../services/attributes-crud-service';
import { SocketBroadcaster } from '../socket-broadcaster';

export async function getAttributes(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    console.log(`[Controller] GET /api/characters/${id}/attributes - Handler invoked`);

    const attributesData = await getAttributesByCharacterId(id);
    console.log(
      `[Controller] Successfully retrieved attributes, sending response:`,
      attributesData
    );

    res.json({
      success: true,
      data: attributesData,
    });
  } catch (error) {
    console.error('Error loading attributes:', error);
    res.status(500).json({
      success: false,
      error:
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message: string }).message
          : String(error),
    });
  }
}

export async function setAttributes(
  req: Request,
  res: Response,
  broadcaster: SocketBroadcaster
): Promise<void> {
  try {
    const { id } = req.params;
    const { attributes } = req.body ?? {};

    if (!attributes || typeof attributes !== 'object') {
      res.status(400).json({
        success: false,
        error: 'attributes must be an object',
      });
      return;
    }

    // Validate all required attributes are present
    const requiredAttrs = ['strength', 'speed', 'awareness', 'intellect', 'willpower', 'presence'];
    for (const attr of requiredAttrs) {
      if (attributes[attr] === undefined || attributes[attr] === null) {
        res.status(400).json({
          success: false,
          error: `Missing required attribute: ${attr}`,
        });
        return;
      }

      if (typeof attributes[attr] !== 'number') {
        res.status(400).json({
          success: false,
          error: `Attribute ${attr} must be a number`,
        });
        return;
      }

      if (attributes[attr] < 0) {
        res.status(400).json({
          success: false,
          error: `Attribute ${attr} cannot be negative`,
        });
        return;
      }
    }

    const updated = await setAttributesByCharacterId(id, attributes);

    // Broadcast character update via WebSocket
    broadcaster.scheduleCharacterUpdate(id);

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Error saving attributes:', error);
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error);

    // Return appropriate status code based on error type
    if (errorMessage.includes('finalized')) {
      res.status(400).json({
        success: false,
        error: errorMessage,
      });
    } else if (errorMessage.includes('not found')) {
      res.status(404).json({
        success: false,
        error: errorMessage,
      });
    } else {
      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  }
}

export async function finalizeAttributes(
  req: Request,
  res: Response,
  broadcaster: SocketBroadcaster
): Promise<void> {
  try {
    const { id } = req.params;
    const result = await finalizeAttributesByCharacterId(id);

    // Broadcast character update via WebSocket
    broadcaster.scheduleCharacterUpdate(id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error finalizing attributes:', error);
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error);

    if (errorMessage.includes('not found')) {
      res.status(404).json({
        success: false,
        error: errorMessage,
      });
    } else if (errorMessage.includes('points remaining')) {
      res.status(400).json({
        success: false,
        error: errorMessage,
      });
    } else {
      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  }
}
