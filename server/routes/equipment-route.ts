import { Express } from 'express';
import {
  getEquipment,
  setEquipment,
  purchaseItem,
  sellItem,
  applyStartingKit,
  refundStartingKit,
  getAvailableKits,
  getStore
} from '../controllers/equipment-controller';
import { SocketBroadcaster } from '../socket-broadcaster';

/**
 * Register equipment routes
 * @param app Express app instance
 * @param broadcaster Socket broadcaster for character updates
 */
export default function createEquipmentRoute(app: Express, broadcaster: SocketBroadcaster): void {
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
  app.post('/api/characters/:id/equipment', (req, res) => setEquipment(req, res, broadcaster));

  /**
   * POST /api/characters/:id/equipment/purchase
   * Purchase an item for a character
   *
   * @body { itemId: string, quantity: number }
   * @returns { success: boolean, inventory: InventoryDTO, currency: number }
   */
  app.post('/api/characters/:id/equipment/purchase', (req, res) => purchaseItem(req, res, broadcaster));

  /**
   * POST /api/characters/:id/equipment/sell
   * Sell an item for a character
   *
   * @body { itemId: string, quantity: number }
   * @returns { success: boolean, inventory: InventoryDTO, currency: number }
   */
  app.post('/api/characters/:id/equipment/sell', (req, res) => sellItem(req, res, broadcaster));

  /**
   * POST /api/characters/:id/equipment/apply-kit
   * Apply a starting kit to a character
   *
   * @body { kitId: string }
   * @returns { success: boolean, inventory: InventoryDTO, appliedKit: string, currency: number }
   */
  app.post('/api/characters/:id/equipment/apply-kit', (req, res) => applyStartingKit(req, res, broadcaster));

  /**
   * POST /api/characters/:id/equipment/refund-kit
   * Refund a starting kit (remove items, restore currency)
   *
   * @returns { success: boolean, inventory: InventoryDTO, currency: number }
   */
  app.post('/api/characters/:id/equipment/refund-kit', (req, res) => refundStartingKit(req, res, broadcaster));

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
