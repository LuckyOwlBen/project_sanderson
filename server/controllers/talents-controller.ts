import { Request, Response } from 'express';
import { 
  getTalentsByCharacterId,
  getTalentUIResponseForCharacterId,
  setTalentsByCharacterId, 
  findParentPath, 
  getAvailableBonusClasses,
  finalizeTalentsByCharacterId
} from '../services/talents-service';
import { addTalentGrantedExpertises } from '../services/expertise-service';
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

/**
 * GET /api/characters/:id/talents/ui
 * Load minimal talent UI response for display
 * Returns only keywords, points, and unlocked talents needed for UI
 */
export async function getTalentUI(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await getTalentUIResponseForCharacterId(id);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error loading talent UI response:', error);
    res.status(500).json({
      success: false,
      error: typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error)
    });
  }
}

/**
 * GET /api/talents/parent/:treeId
 * Find the parent core path for a specialization tree
 * e.g., GET /api/talents/parent/duelist => { treeId: 'duelist', parent: 'warrior' }
 */
export function getTalentParent(req: Request, res: Response): void {
  try {
    const { treeId } = req.params;
    const parent = findParentPath(treeId);

    res.json({
      success: true,
      data: {
        treeId,
        parent: parent || null
      }
    });
  } catch (error) {
    console.error('Error finding talent parent:', error);
    res.status(500).json({
      success: false,
      error: typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error)
    });
  }
}

/**
 * GET /api/talents/bonus-classes?mainPath=warrior&specialty=scholar
 * Get available bonus class core paths for selection
 * Returns all 6 core paths except main and specialty
 */
export function getBonusClasses(req: Request, res: Response): void {
  try {
    const mainPath = req.query.mainPath as string | undefined;
    const specialty = req.query.specialty as string | undefined;
    
    const bonusClasses = getAvailableBonusClasses(mainPath || null, specialty || null);

    res.json({
      success: true,
      data: {
        mainPath: mainPath || null,
        specialty: specialty || null,
        available: bonusClasses
      }
    });
  } catch (error) {
    console.error('Error getting bonus classes:', error);
    res.status(500).json({
      success: false,
      error: typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error)
    });
  }
}

/**
 * POST /api/characters/:id/talents/finalize
 * Finalize talents for a character (merge pending to total)
 * Called during character finalization step
 */
export async function finalizeTalents(req: Request, res: Response, broadcaster: SocketBroadcaster): Promise<void> {
  try {
    const { id } = req.params;
    const result = await finalizeTalentsByCharacterId(id);

    // Broadcast character update via WebSocket
    broadcaster.scheduleCharacterUpdate(id);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error finalizing talents:', error);
    res.status(500).json({
      success: false,
      error: typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error)
    });
  }}export async function setTalents(req: Request, res: Response, broadcaster: SocketBroadcaster): Promise<void> {
  try {
    const { id } = req.params;
    // Accept two payload shapes: { talents: { ... } } or direct body { ... }
    const talents = (req.body && (req.body.talents ?? req.body)) || {};

    console.log('[TalentsController] saveTalents payload for', id, ':', talents);

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

    if (talents.pendingTrees !== undefined && !Array.isArray(talents.pendingTrees)) {
      res.status(400).json({
        success: false,
        error: 'talents.pendingTrees must be an array'
      });
      return;
    }

    const updated = await setTalentsByCharacterId(id, talents);

    // If talent unlocks included expertise choices (fixed or user-selected), persist them
    if (Array.isArray(talents.expertiseChoices) && talents.expertiseChoices.length > 0) {
      await addTalentGrantedExpertises(id, talents.expertiseChoices);
    }

    // Broadcast character update via WebSocket
    broadcaster.scheduleCharacterUpdate(id);

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    const message = typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message: string }).message
      : String(error);
    console.error('Error saving talents:', message);

    // If this is a validation error from the service, return 400
    if (typeof message === 'string' && message.startsWith('validation:')) {
      const friendly = message.replace('validation:', '');
      res.status(400).json({ success: false, error: friendly });
      return;
    }

    res.status(500).json({
      success: false,
      error: message
    });
  }
}
