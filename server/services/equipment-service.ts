import { InventoryModuleRepository, InventoryDTO, InventoryItemDTO } from '../repositories/modules/inventory-repository';
import { getItemById, STARTING_KITS, ALL_ITEMS } from '../character/inventory/itemDefinitions';
import { loadCharacter, saveCharacter } from '../database';

export interface InventoryViewItem {
  id: string;
  name: string;
  description: string;
  type: string;
  baseId: string;
  quantity: number;
}

/**
 * Get equipment/inventory for a character
 * Loads directly from database
 */
export async function getEquipmentByCharacterId(characterId: string): Promise<{
  inventory: InventoryDTO | null;
  inventoryItems: InventoryViewItem[];
  currency: number;
}> {
  const char = await loadCharacter(characterId);
  if (!char) {
    return {
      inventory: null,
      inventoryItems: [],
      currency: 0
    };
  }

  // Convert database inventory format to view format
  const inventoryItems: InventoryViewItem[] = (char.inventory?.items ?? []).map((item: any) => {
    const baseId = item.id.split('-')[0];
    const itemDef = getItemById(baseId);
    return {
      id: item.id,
      name: itemDef?.name ?? baseId,
      description: itemDef?.description ?? '',
      type: itemDef?.type ?? 'unknown',
      baseId,
      quantity: item.quantity ?? 1
    };
  });

  return {
    inventory: char.inventory || null,
    inventoryItems,
    currency: char.inventory?.currencyInChips ?? 0
  };
}

/**
 * Set equipment/inventory for a character
 */
export async function setEquipmentByCharacterId(
  characterId: string,
  inventory: InventoryDTO
): Promise<InventoryDTO> {
  const char = await loadCharacter(characterId);
  if (!char) {
    throw new Error('Character not found');
  }

  char.inventory = inventory;
  await saveCharacter(char);
  return inventory;
}

/**
 * Purchase an item for a character
 */
export async function purchaseItemForCharacter(
  characterId: string,
  itemId: string,
  quantity: number = 1
): Promise<{
  success: boolean;
  inventory?: InventoryDTO;
  inventoryItems?: InventoryViewItem[];
  currency?: number;
  message?: string;
  error?: string;
}> {
  try {
    // Validate item exists
    const item = getItemById(itemId);
    if (!item) {
      return {
        success: false,
        error: 'Item not found'
      };
    }

    // Load current character
    const char = await loadCharacter(characterId);
    if (!char) {
      return {
        success: false,
        error: 'Character not found'
      };
    }

    const currentCurrency = char.inventory?.currencyInChips ?? 0;
    const cost = (item.price ?? 0) * quantity;

    // Check if can afford
    if (currentCurrency < cost) {
      return {
        success: false,
        error: 'Cannot afford item'
      };
    }

    // Deduct currency and add item
    const newCurrency = currentCurrency - cost;
    const newItems = [...(char.inventory?.items ?? [])];
    
    const existingIndex = newItems.findIndex((inv: any) => inv.id === itemId);
    if (existingIndex >= 0) {
      newItems[existingIndex].quantity = (newItems[existingIndex].quantity || 1) + quantity;
    } else {
      newItems.push({
        id: itemId,
        quantity,
        customData: {}
      });
    }

    char.inventory = {
      ...char.inventory,
      items: newItems,
      currencyInChips: newCurrency
    };

    console.log(`[Equipment] Purchase: Character ${characterId} bought ${quantity}x ${item.name} for ${cost}`);

    // Save
    await saveCharacter(char);

    const result = await getEquipmentByCharacterId(characterId);
    return {
      success: true,
      inventory: char.inventory,
      inventoryItems: result.inventoryItems,
      currency: newCurrency,
      message: `Purchased ${quantity}x ${item.name}`
    };
  } catch (error) {
    console.error('[Equipment] Error purchasing item:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Apply a starting kit to a character
 */
export async function applyStartingKitForCharacter(
  characterId: string,
  kitId: string
): Promise<{
  success: boolean;
  inventory?: InventoryDTO;
  inventoryItems?: InventoryViewItem[];
  currency?: number;
  message?: string;
  error?: string;
}> {
  try {
    // Validate kit exists
    const kit = STARTING_KITS.find(k => k.id === kitId);
    if (!kit) {
      return {
        success: false,
        error: 'Starting kit not found'
      };
    }

    // Load character
    const char = await loadCharacter(characterId);
    if (!char) {
      return {
        success: false,
        error: 'Character not found'
      };
    }

    // Apply kit items
    const newItems = [...(char.inventory?.items ?? [])];
    if (kit.equipment) {
      for (const { itemId, quantity } of kit.equipment) {
        const existingIndex = newItems.findIndex((inv: any) => inv.id === itemId);
        if (existingIndex >= 0) {
          newItems[existingIndex].quantity = (newItems[existingIndex].quantity || 1) + quantity;
        } else {
          newItems.push({
            id: itemId,
            quantity,
            customData: {}
          });
        }
      }
    }

    // Add kit currency
    const kitCurrency = kit.currency ?? 0;

    char.inventory = {
      ...char.inventory,
      items: newItems,
      currencyInChips: (char.inventory?.currencyInChips ?? 0) + kitCurrency
    };

    console.log(`[Equipment] Applied kit '${kit.name}' to character ${characterId}`);

    // Save
    await saveCharacter(char);

    const result = await getEquipmentByCharacterId(characterId);
    return {
      success: true,
      inventory: char.inventory,
      inventoryItems: result.inventoryItems,
      currency: char.inventory.currencyInChips,
      message: `Applied ${kit.name}`
    };
  } catch (error) {
    console.error('[Equipment] Error applying kit:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Refund a starting kit (clear inventory, restore currency to 0)
 */
export async function refundStartingKitForCharacter(
  characterId: string
): Promise<{
  success: boolean;
  inventory?: InventoryDTO;
  inventoryItems?: InventoryViewItem[];
  currency?: number;
  message?: string;
  error?: string;
}> {
  try {
    // Load character
    const char = await loadCharacter(characterId);
    if (!char) {
      return {
        success: false,
        error: 'Character not found'
      };
    }

    // Clear inventory
    char.inventory = {
      items: [],
      equippedItems: [],
      currencyInChips: 0
    };

    console.log(`[Equipment] Refunded starting kit for character ${characterId}`);

    // Save
    await saveCharacter(char);

    const result = await getEquipmentByCharacterId(characterId);
    return {
      success: true,
      inventory: char.inventory,
      inventoryItems: result.inventoryItems,
      currency: 0,
      message: 'Starting kit refunded'
    };
  } catch (error) {
    console.error('[Equipment] Error refunding kit:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Get all available starting kits
 */
export function getAllStartingKits(): typeof STARTING_KITS {
  return STARTING_KITS;
}

/**
 * Get all items available in the store
 */
export function getStoreItems() {
  return ALL_ITEMS;
}
