import { Request, Response } from 'express';
import {
  getEquipmentByCharacterId,
  setEquipmentByCharacterId,
  purchaseItemForCharacter,
  applyStartingKitForCharacter,
  refundStartingKitForCharacter,
  getAllStartingKits,
  getStoreItems
} from '../services/equipment-service';
import { SocketBroadcaster } from '../socket-broadcaster';

/**
 * GET /api/characters/:id/equipment
 * Load equipment/inventory for a character
 */
export async function getEquipment(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await getEquipmentByCharacterId(id);

    res.json({
      success: true,
      inventory: result.inventory ?? null,
      inventoryItems: result.inventoryItems,
      currency: result.currency
    });
  } catch (error) {
    console.error('Error loading equipment:', error);
    res.status(500).json({
      success: false,
      error: typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error)
    });
  }
}

/**
 * POST /api/characters/:id/equipment
 * Save equipment/inventory for a character
 */
export async function setEquipment(req: Request, res: Response, broadcaster: SocketBroadcaster): Promise<void> {
  try {
    const { id } = req.params;
    const { inventory } = req.body ?? {};

    if (!inventory) {
      res.status(400).json({
        success: false,
        error: 'inventory is required'
      });
      return;
    }

    const updated = await setEquipmentByCharacterId(id, inventory);
    
    // Broadcast character update via WebSocket
    broadcaster.scheduleCharacterUpdate(id);

    res.json({
      success: true,
      inventory: updated
    });
  } catch (error) {
    console.error('Error saving equipment:', error);
    res.status(500).json({
      success: false,
      error: typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error)
    });
  }
}

/**
 * POST /api/characters/:id/equipment/purchase
 * Purchase an item for a character
 */
export async function purchaseItem(req: Request, res: Response, broadcaster: SocketBroadcaster): Promise<void> {
  try {
    const { id } = req.params;
    const { itemId, quantity } = req.body ?? {};

    if (!itemId) {
      res.status(400).json({
        success: false,
        error: 'itemId is required'
      });
      return;
    }

    const result = await purchaseItemForCharacter(id, itemId, quantity ?? 1);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error || 'Purchase failed'
      });
      return;
    }
    
    // Broadcast character update via WebSocket
    broadcaster.scheduleCharacterUpdate(id);

    res.json({
      success: true,
      inventory: result.inventory,
      inventoryItems: result.inventoryItems,
      currency: result.currency,
      message: result.message
    });
  } catch (error) {
    console.error('Error purchasing item:', error);
    res.status(500).json({
      success: false,
      error: typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error)
    });
  }
}

/**
 * POST /api/characters/:id/equipment/apply-kit
 * Apply a starting kit to a character
 */
export async function applyStartingKit(req: Request, res: Response, broadcaster: SocketBroadcaster): Promise<void> {
  try {
    const { id } = req.params;
    const { kitId } = req.body ?? {};

    if (!kitId) {
      res.status(400).json({
        success: false,
        error: 'kitId is required'
      });
      return;
    }

    const result = await applyStartingKitForCharacter(id, kitId);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to apply kit'
      });
      return;
    }
    
    // Broadcast character update via WebSocket
    broadcaster.scheduleCharacterUpdate(id);

    res.json({
      success: true,
      inventory: result.inventory,
      appliedKit: kitId,
      inventoryItems: result.inventoryItems,
      currency: result.currency,
      message: result.message
    });
  } catch (error) {
    console.error('Error applying starting kit:', error);
    res.status(500).json({
      success: false,
      error: typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error)
    });
  }
}

/**
 * POST /api/characters/:id/equipment/refund-kit
 * Refund a starting kit (remove items, restore currency)
 */
export async function refundStartingKit(req: Request, res: Response, broadcaster: SocketBroadcaster): Promise<void> {
  try {
    const { id } = req.params;
    const result = await refundStartingKitForCharacter(id);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to refund kit'
      });
      return;
    }
    
    // Broadcast character update via WebSocket
    broadcaster.scheduleCharacterUpdate(id);

    res.json({
      success: true,
      inventory: result.inventory,
      inventoryItems: result.inventoryItems,
      currency: result.currency,
      message: result.message
    });
  } catch (error) {
    console.error('Error refunding starting kit:', error);
    res.status(500).json({
      success: false,
      error: typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error)
    });
  }
}

/**
 * GET /api/equipment/kits
 * Get all available starting kits
 */
export async function getAvailableKits(req: Request, res: Response): Promise<void> {
  try {
    const kits = getAllStartingKits();

    res.json({
      success: true,
      kits
    });
  } catch (error) {
    console.error('Error getting available kits:', error);
    res.status(500).json({
      success: false,
      error: typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error)
    });
  }
}

/**
 * GET /api/equipment/store
 * Get all items available for purchase in the store
 */
export function getStore(req: Request, res: Response): void {
  try {
    const items = getStoreItems();
    res.json({
      success: true,
      items: items
    });
  } catch (error) {
    console.error('Error getting store items:', error);
    res.status(500).json({
      success: false,
      error: typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error)
    });
  }
}
