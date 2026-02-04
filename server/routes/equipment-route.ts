import { Express } from 'express';
import {
  getEquipment,
  setEquipment,
  purchaseItem,
  applyStartingKit,
  refundStartingKit,
  getAvailableKits,
  getStore
} from '../controllers/equipment-controller';

/**
 * Register equipment routes
 * @param app Express app instance
 */
export default function createEquipmentRoute(app: Express): void {
  /**
   * GET /api/characters/:id/equipment
   * Load equipment/inventory for a character
   *
   * @returns { success: boolean, inventory: InventoryDTO | null }
   */
  app.get('/api/characters/:id/equipment', getEquipment);

  /**
   * POST /api/characters/:id/equipment
   * Save equipment/inventory for a character
   *
   * @returns { success: boolean, inventory: InventoryDTO }
   */
  app.post('/api/characters/:id/equipment', setEquipment);

  /**
   * POST /api/characters/:id/equipment/purchase
   * Purchase an item for a character
   *
   * @body { itemId: string, quantity: number }
   * @returns { success: boolean, inventory: InventoryDTO, currency: number }
   */
  app.post('/api/characters/:id/equipment/purchase', purchaseItem);

  /**
   * POST /api/characters/:id/equipment/apply-kit
   * Apply a starting kit to a character
   *
   * @body { kitId: string }
   * @returns { success: boolean, inventory: InventoryDTO, appliedKit: string, currency: number }
   */
  app.post('/api/characters/:id/equipment/apply-kit', applyStartingKit);

  /**
   * POST /api/characters/:id/equipment/refund-kit
   * Refund a starting kit (remove items, restore currency)
   *
   * @returns { success: boolean, inventory: InventoryDTO, currency: number }
   */
  app.post('/api/characters/:id/equipment/refund-kit', refundStartingKit);

  /**
   * GET /api/equipment/kits
   * Get all available starting kits
   *
   * @returns { success: boolean, kits: StartingKitDTO[] }
   */
  app.get('/api/equipment/kits', getAvailableKits);

  /**
   * GET /api/equipment/store
   * Get all items available for purchase
   *
   * @returns { success: boolean, items: InventoryItem[] }
   */
  app.get('/api/equipment/store', getStore);
}
