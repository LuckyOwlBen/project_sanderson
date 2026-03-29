import { InventoryModuleRepository, InventoryDTO, InventoryItemDTO } from '../repositories/modules/inventory-repository';
import { getItemById, STARTING_KITS, ALL_ITEMS } from 'shared/data/items/item-definitions';
import { loadCharacter, saveCharacter, getGameSettings } from '../database';

export interface InventoryViewItem {
  id: string;
  name: string;
  description: string;
  type: string;
  rarity?: string;
  price: number;
  weight?: number;
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
  selectedKitId: string | null;
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
  const inventoryItems: InventoryViewItem[] = (char.inventory?.items ?? [])
    .map((item: any) => {
      const baseId = item.id;
      const itemDef = getItemById(baseId);
      
      // Only include items with valid definitions
      if (!itemDef) {
        console.warn(`[Equipment] Invalid item definition for baseId: ${baseId}`);
        return null;
      }
      
      return {
        id: item.id,
        name: itemDef.name,
        description: itemDef.description ?? '',
        type: itemDef.type,
        rarity: itemDef.rarity,
        price: itemDef.price ?? 0,
        weight: itemDef.weight,
        baseId,
        quantity: item.quantity ?? 1
      };
    })
    .filter((item): item is InventoryViewItem => item !== null);

  return {
    inventory: char.inventory || null,
    inventoryItems,
    currency: char.inventory?.currencyInChips ?? 0,
    selectedKitId: char.selectedKitId ?? null
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
 * Sell an item for a character (remove from inventory, gain currency at 50% value or full value)
 */
export async function sellItemForCharacter(
  characterId: string,
  itemId: string,
  quantity: number = 1,
  fullPrice: boolean = false
): Promise<{
  success: boolean;
  inventory?: InventoryDTO;
  inventoryItems?: InventoryViewItem[];
  currency?: number;
  message?: string;
  error?: string;
}> {
  try {
    // Load current character
    const char = await loadCharacter(characterId);
    if (!char) {
      return {
        success: false,
        error: 'Character not found'
      };
    }

    // Find the item in inventory
    const newItems = [...(char.inventory?.items ?? [])];
    const itemIndex = newItems.findIndex((inv: any) => inv.id === itemId);
    
    if (itemIndex < 0) {
      return {
        success: false,
        error: 'Item not found in inventory'
      };
    }

    const currentQuantity = newItems[itemIndex].quantity ?? 1;
    if (currentQuantity < quantity) {
      return {
        success: false,
        error: `Not enough items to sell (have ${currentQuantity}, trying to sell ${quantity})`
      };
    }

    // Get item definition for price
    const item = getItemById(itemId);
    if (!item) {
      return {
        success: false,
        error: 'Item definition not found'
      };
    }

    // Calculate sale price (full price during character creation, or DB-configured % otherwise)
    let salePrice: number;
    if (fullPrice) {
      salePrice = item.price ?? 0;
    } else {
      const gameSettings = await getGameSettings();
      salePrice = Math.floor((item.price ?? 0) * (gameSettings.sellPercent / 100));
    }
    const totalSalePrice = salePrice * quantity;

    // Remove or reduce quantity
    if (currentQuantity === quantity) {
      // Remove item entirely if selling all
      newItems.splice(itemIndex, 1);
    } else {
      // Reduce quantity
      newItems[itemIndex].quantity = currentQuantity - quantity;
    }

    // Add currency
    const currentCurrency = char.inventory?.currencyInChips ?? 0;
    const newCurrency = currentCurrency + totalSalePrice;

    char.inventory = {
      ...char.inventory,
      items: newItems,
      currencyInChips: newCurrency
    };

    console.log(`[Equipment] Sell: Character ${characterId} sold ${quantity}x ${item.name} for ${totalSalePrice} (${salePrice} each)${fullPrice ? ' [full price]' : ' [50%]'}`);

    // Save
    await saveCharacter(char);

    const result = await getEquipmentByCharacterId(characterId);
    return {
      success: true,
      inventory: char.inventory,
      inventoryItems: result.inventoryItems,
      currency: newCurrency,
      message: `Sold ${quantity}x ${item.name} for ${totalSalePrice}`
    };
  } catch (error) {
    console.error('[Equipment] Error selling item:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Helper: Add items from a kit array to inventory
 */
function addKitItemsToInventory(items: any[], kitItems: { itemId: string; quantity: number }[] | undefined): void {
  if (!kitItems) return;
  
  for (const { itemId, quantity } of kitItems) {
    const existingIndex = items.findIndex((inv: any) => inv.id === itemId);
    if (existingIndex >= 0) {
      items[existingIndex].quantity = (items[existingIndex].quantity || 1) + quantity;
    } else {
      items.push({
        id: itemId,
        quantity,
        customData: {}
      });
    }
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

    // Apply kit items from all three categories
    const newItems: any[] = [];
    addKitItemsToInventory(newItems, kit.weapons);
    addKitItemsToInventory(newItems, kit.armor);
    addKitItemsToInventory(newItems, kit.equipment);

    // Set currency to kit's currency (replacing, not adding) - convert marks to chips (1 mark = 5 chips)
    const kitCurrencyInChips = (kit.currency ?? 0) * 5;

    char.inventory = {
      ...char.inventory,
      items: newItems,
      currencyInChips: kitCurrencyInChips
    };
    char.selectedKitId = kitId;

    console.log(`[Equipment] Applied kit '${kit.name}' to character ${characterId}`);

    // Save
    await saveCharacter(char);

    const result = await getEquipmentByCharacterId(characterId);
    return {
      success: true,
      inventory: char.inventory,
      inventoryItems: result.inventoryItems,
      currency: char.inventory.currencyInChips,
      selectedKitId: char.selectedKitId ?? null,
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
    char.selectedKitId = null;

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
