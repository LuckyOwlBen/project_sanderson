/**
 * ItemGrantRepository - Manages item grants with database persistence
 */

import InventoryManager from '../inventory-manager';
import { characterRepository } from './character-repository';

export interface ItemGrantPayload {
  characterId: string;
  itemId: string;
  quantity: number;
  grantedBy: string;
  timestamp: string;
}

export class ItemGrantRepository {
  /**
   * Add an item to a character's inventory and persist to database
   * @param characterId - Character ID
   * @param itemId - Item ID to add
   * @param quantity - Quantity to add
   * @returns Success status and error if any
   */
  async addItemToCharacter(
    characterId: string,
    itemId: string,
    quantity: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`[Item] 📦 Adding ${quantity}x ${itemId} to character ${characterId}`);

      // Load inventory from database via module repository
      const inventoryDTO = await characterRepository.inventory.load(characterId);
      if (!inventoryDTO) {
        const error = `Character ${characterId} not found`;
        console.error(`[Item] ❌ ${error}`);
        return { success: false, error };
      }

      // Create inventory manager and load from database format
      const inventoryManager = new InventoryManager();
      
      // Convert DTO to InventoryManager format and deserialize
      if (inventoryDTO.items && Array.isArray(inventoryDTO.items)) {
        const serializedFormat = {
          items: inventoryDTO.items.map(item => ({
            id: item.itemId,
            quantity: item.quantity,
            customData: { fabrialCharges: 0, properties: {} }
          })),
          equippedItems: [],
          currencyInChips: 0
        };
        inventoryManager.deserialize(serializedFormat);
      }

      // Add the new item using InventoryManager
      const added = inventoryManager.addItem(itemId, quantity);
      if (!added) {
        const error = `Failed to add item ${itemId} to inventory`;
        console.warn(`[Item] ⚠️ ${error}`);
        return { success: false, error };
      }

      console.log(`[Item] ✅ Item ${itemId} added to character ${characterId}`);

      // Serialize back to DTO format for database
      const serialized = inventoryManager.serialize();
      const updatedDTO = {
        items: serialized.items.map(item => ({
          itemId: item.id,
          quantity: item.quantity,
          equipped: false
        })),
        equipped: {
          armor: null,
          weapons: []
        }
      };

      // Persist via module repository
      const saveResult = await characterRepository.inventory.save(characterId, updatedDTO);
      if (!saveResult.success) {
        console.error(`[Item] ❌ Failed to save inventory: ${saveResult.error}`);
        return { success: false, error: saveResult.error };
      }

      console.log(`[Item] 💾 Inventory for ${characterId} saved to database`);
      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Item] ❌ Error adding item to character:`, error);
      return { success: false, error: errorMsg };
    }
  }
}
