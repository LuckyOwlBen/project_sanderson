import { Request, Response } from 'express';
import { getNameByCharacterId, setNameByCharacterId } from '../services/name-service';

export async function getName(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const nameData = await getNameByCharacterId(id);

    res.json({
      success: true,
      name: nameData.name ?? '',
      level: nameData.level ?? 1,
      cultures: nameData.cultures ?? []
    });
  } catch (error) {
    console.error('Error loading name:', error);
    res.status(500).json({
      success: false,
      error: typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error)
    });
  }
}

export async function setName(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, level } = req.body ?? {};

    // Validate name
    if (typeof name !== 'string') {
      res.status(400).json({
        success: false,
        error: 'name must be a string'
      });
      return;
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      res.status(400).json({
        success: false,
        error: 'name must be at least 2 characters'
      });
      return;
    }

    if (trimmedName.length > 50) {
      res.status(400).json({
        success: false,
        error: 'name must be 50 characters or less'
      });
      return;
    }

    const validNamePattern = /^[a-zA-Z\s\-']+$/;
    if (!validNamePattern.test(trimmedName)) {
      res.status(400).json({
        success: false,
        error: 'name can only contain letters, spaces, hyphens, and apostrophes'
      });
      return;
    }

    if (/\s{2,}/.test(trimmedName)) {
      res.status(400).json({
        success: false,
        error: 'name cannot contain multiple consecutive spaces'
      });
      return;
    }

    // Validate level
    if (typeof level !== 'number') {
      res.status(400).json({
        success: false,
        error: 'level must be a number'
      });
      return;
    }

    if (!Number.isInteger(level) || level < 1 || level > 21) {
      res.status(400).json({
        success: false,
        error: 'level must be an integer between 1 and 21'
      });
      return;
    }

    const updated = await setNameByCharacterId(id, trimmedName, level);

    res.json({
      success: true,
      name: updated.name ?? '',
      level: updated.level ?? 1,
      cultures: updated.cultures ?? []
    });
  } catch (error) {
    console.error('Error saving name:', error);
    res.status(500).json({
      success: false,
      error: typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error)
    });
  }
}
