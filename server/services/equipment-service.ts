import { InventoryModuleRepository, InventoryDTO, InventoryItemDTO } from '../repositories/modules/inventory-repository';
import { InventoryManager } from '../character/inventory/inventoryManager';
import { InventoryItem } from '../character/inventory/inventoryItem';
import { getItemById, STARTING_KITS, ALL_ITEMS } from '../character/inventory/itemDefinitions';

const inventoryRepository = new InventoryModuleRepository();

export interface InventoryViewItem extends InventoryItem {
  baseId: string;
  quantity: number;
}

function buildInventoryViewFromManager(manager: InventoryManager): { items: InventoryViewItem[]; currency: number } {
  const items = manager.getAllItems().map((item) => ({
    ...item,
    baseId: item.id.split('-')[0],
    quantity: item.quantity ?? 1
  }));

  return {
    items,
    currency: manager.getCurrency()
  };
}

function buildInventoryViewFromSerialized(serialized: InventoryDTO | null): { items: InventoryViewItem[]; currency: number } {
  const manager = new InventoryManager();
  if (serialized) {
    manager.deserialize(serialized);
  }
  return buildInventoryViewFromManager(manager);
}

/**
 * Get equipment/inventory for a character
 */
export async function getEquipmentByCharacterId(characterId: string): Promise<{
  inventory: InventoryDTO | null;
  inventoryItems: InventoryViewItem[];
  currency: number;
}> {
  const inventory = await inventoryRepository.load(characterId);
  const view = buildInventoryViewFromSerialized(inventory);
  return {
    inventory,
    inventoryItems: view.items,
    currency: view.currency
  };
}

/**
 * Set equipment/inventory for a character
 */
export async function setEquipmentByCharacterId(
  characterId: string,
  inventory: InventoryDTO
): Promise<InventoryDTO> {
  const result = await inventoryRepository.save(characterId, inventory);
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to save equipment');
  }

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

    // Load current inventory
    const currentInventory = await inventoryRepository.load(characterId);
    
    // Create inventory manager and restore state
    const inventoryManager = new InventoryManager();
    if (currentInventory) {
      inventoryManager.deserialize(currentInventory);
    }

    // Attempt purchase
    if (!inventoryManager.purchaseItem(itemId, item.price, quantity)) {
      return {
        success: false,
        error: 'Cannot afford item'
      };
    }

    // Log transaction
    const conversion = inventoryManager.convertToMixedDenominations(item.price * quantity);
    console.log(`[Equipment] Purchase: Character ${characterId} bought ${quantity}x ${item.name} for ${conversion.broams}b ${conversion.marks}m ${conversion.chips}c`);

    // Save updated inventory
    const serialized = inventoryManager.serialize();
    const saveResult = await inventoryRepository.save(characterId, serialized);

    if (!saveResult.success) {
      throw new Error(saveResult.error || 'Failed to save inventory');
    }

    const view = buildInventoryViewFromManager(inventoryManager);

    return {
      success: true,
      inventory: serialized,
      inventoryItems: view.items,
      currency: view.currency,
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

    // Create inventory manager and apply kit
    const inventoryManager = new InventoryManager();
    const applyResult = inventoryManager.applyStartingKit(kitId);

    if (!applyResult) {
      return {
        success: false,
        error: 'Failed to apply starting kit'
      };
    }

    // Log action
    console.log(`[Equipment] Applied kit '${kit.name}' to character ${characterId}`);

    // Save new inventory
    const serialized = inventoryManager.serialize();
    const saveResult = await inventoryRepository.save(characterId, serialized);

    if (!saveResult.success) {
      throw new Error(saveResult.error || 'Failed to save inventory');
    }

    const view = buildInventoryViewFromManager(inventoryManager);

    return {
      success: true,
      inventory: serialized,
      inventoryItems: view.items,
      currency: view.currency,
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
    // Create empty inventory manager
    const inventoryManager = new InventoryManager();
    // Currency starts at 0 by default

    console.log(`[Equipment] Refunded starting kit for character ${characterId}`);

    // Save empty inventory
    const serialized = inventoryManager.serialize();
    const saveResult = await inventoryRepository.save(characterId, serialized);

    if (!saveResult.success) {
      throw new Error(saveResult.error || 'Failed to save inventory');
    }

    const view = buildInventoryViewFromManager(inventoryManager);

    return {
      success: true,
      inventory: serialized,
      inventoryItems: view.items,
      currency: view.currency,
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
