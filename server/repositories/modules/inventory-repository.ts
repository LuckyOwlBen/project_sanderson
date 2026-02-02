/**
 * InventoryModuleRepository - MODULE 11: INVENTORY
 * Handles items and equipment management
 */

import { BaseModuleRepository, SaveResult } from './base-module-repository';

export interface InventoryItemDTO {
  itemId: string;
  quantity: number;
  equipped: boolean;
}

export interface InventoryDTO {
  items: InventoryItemDTO[];
  equipped: {
    armor: InventoryItemDTO | null;
    weapons: InventoryItemDTO[];
  };
}

export class InventoryModuleRepository extends BaseModuleRepository {
  /**
   * Save inventory module
   * @param characterId - Character ID
   * @param inventory - Inventory object with items and equipped
   */
  async save(characterId: string, inventory: InventoryDTO): Promise<SaveResult> {
    return await this.updateCharacterModule(characterId, { inventory });
  }

  /**
   * Load inventory module data
   * @param characterId - Character ID
   * @returns Inventory data or null
   */
  async load(characterId: string): Promise<InventoryDTO | null> {
    const char = await this.loadCharacterData(characterId);
    if (!char) return null;
    return char.inventory || null;
  }
}
