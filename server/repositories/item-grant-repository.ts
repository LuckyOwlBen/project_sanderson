/**
 * ItemGrantRepository - Manages item grants with database persistence
 */

import { loadCharacter, saveCharacter } from '../database';

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

      // Load character from database
      const character = await loadCharacter(characterId);
      if (!character) {
        const error = `Character ${characterId} not found`;
        console.error(`[Item] ❌ ${error}`);
        return { success: false, error };
      }

      // Get current inventory items
      const items = character.inventory?.items ?? [];

      // Check if item already exists
      const existingIndex = items.findIndex((item: any) => item.id === itemId);
      if (existingIndex >= 0) {
        items[existingIndex].quantity = (items[existingIndex].quantity || 1) + quantity;
      } else {
        items.push({
          id: itemId,
          quantity,
          customData: {},
        });
      }

      // Update character inventory
      character.inventory = {
        ...character.inventory,
        items,
        currencyInChips: character.inventory?.currencyInChips ?? 0,
      };

      console.log(`[Item] ✅ Item ${itemId} added to character ${characterId}`);

      // Save to database
      await saveCharacter(character);

      console.log(`[Item] 💾 Inventory for ${characterId} saved to database`);
      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Item] ❌ Error adding item to character:`, error);
      return { success: false, error: errorMsg };
    }
  }
}
