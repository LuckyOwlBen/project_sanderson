import { Request, Response } from 'express';
import { getSkillsByCharacterId, setSkillsByCharacterId } from '../services/skills-service';
import { skillsListManager } from '../services/skills-list-manager';
import { SocketBroadcaster } from '../socket-broadcaster';

export async function getSkills(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await getSkillsByCharacterId(id);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error loading skills:', error);
    res.status(500).json({
      success: false,
      error: typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error)
    });
  }
}

export async function setSkills(req: Request, res: Response, broadcaster: SocketBroadcaster): Promise<void> {
  try {
    const { id } = req.params;
    const { skills } = req.body ?? {};

    if (!skills || typeof skills !== 'object' || Array.isArray(skills)) {
      res.status(400).json({
        success: false,
        error: 'skills must be an object of type Record<string, number>'
      });
      return;
    }

    const updated = await setSkillsByCharacterId(id, skills);
    
    // Broadcast character update via WebSocket
    broadcaster.scheduleCharacterUpdate(id);

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Error saving skills:', error);
    res.status(500).json({
      success: false,
      error: typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error)
    });
  }
}

export async function getAvailableSkills(req: Request, res: Response): Promise<void> {
  try {
    const available = skillsListManager.getAvailableSkills();
    res.json({
      success: true,
      data: available
    });
  } catch (error) {
    console.error('Error loading available skills:', error);
    res.status(500).json({
      success: false,
      error: typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error)
    });
  }
}
