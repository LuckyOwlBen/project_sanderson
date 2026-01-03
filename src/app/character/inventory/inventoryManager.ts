import { InventoryItem, StartingKit, CurrencyConversion } from './inventoryItem';
import { getItemById, STARTING_KITS } from './itemDefinitions';
import { BonusManager } from '../bonuses/bonusManager';

export class InventoryManager {
  private items: Map<string, InventoryItem> = new Map();
  private equippedItems: Map<string, string> = new Map(); // slot -> itemId
  private currency: number = 0; // stored in marks
  private bonusManager: BonusManager | null = null;

  constructor() {}

  // ===== INITIALIZATION =====

  setBonusManager(bonusManager: BonusManager): void {
    this.bonusManager = bonusManager;
  }

  applyStartingKit(kitId: string): boolean {
    const kit = STARTING_KITS.find(k => k.id === kitId);
    if (!kit) return false;

    // Clear existing inventory
    this.items.clear();
    this.equippedItems.clear();

    // Add weapons
    kit.weapons.forEach(({ itemId, quantity }) => {
      this.addItem(itemId, quantity);
    });

    // Add armor
    kit.armor.forEach(({ itemId, quantity }) => {
      this.addItem(itemId, quantity);
    });

    // Add equipment
    kit.equipment.forEach(({ itemId, quantity }) => {
      this.addItem(itemId, quantity);
    });

    // Set currency
    this.currency = kit.currency;

    return true;
  }

  // ===== ITEM MANAGEMENT =====

  addItem(itemId: string, quantity: number = 1): boolean {
    const itemDef = getItemById(itemId);
    if (!itemDef) {
      console.warn(`[InventoryManager] Unknown item: ${itemId}`);
      return false;
    }

    const existingItem = this.items.get(itemId);

    if (existingItem) {
      // Item already exists
      if (itemDef.stackable) {
        existingItem.quantity += quantity;
      } else {
        // Non-stackable items - add separate instances
        let counter = 1;
        let uniqueId = `${itemId}-${counter}`;
        while (this.items.has(uniqueId)) {
          counter++;
          uniqueId = `${itemId}-${counter}`;
        }
        const newItem = { ...itemDef, id: uniqueId, quantity: 1 };
        this.items.set(uniqueId, newItem);
      }
    } else {
      // New item
      const newItem = { ...itemDef, quantity };
      this.items.set(itemId, newItem);
    }

    return true;
  }

  removeItem(itemId: string, quantity: number = 1): boolean {
    const item = this.items.get(itemId);
    if (!item) return false;

    if (item.quantity > quantity) {
      item.quantity -= quantity;
    } else {
      // Remove item completely
      this.unequipItem(itemId);
      this.items.delete(itemId);
    }

    return true;
  }

  getItem(itemId: string): InventoryItem | undefined {
    return this.items.get(itemId);
  }

  getAllItems(): InventoryItem[] {
    return Array.from(this.items.values());
  }

  getItemsByType(type: string): InventoryItem[] {
    return this.getAllItems().filter(item => item.type === type);
  }

  hasItem(itemId: string, quantity: number = 1): boolean {
    const item = this.items.get(itemId);
    return item ? item.quantity >= quantity : false;
  }

  getItemQuantity(itemId: string): number {
    const item = this.items.get(itemId);
    return item ? item.quantity : 0;
  }

  // ===== EQUIPMENT =====

  equipItem(itemId: string): boolean {
    const item = this.items.get(itemId);
    if (!item || !item.equipable || !item.slot) {
      return false;
    }

    // Check if slot is already occupied
    const currentlyEquipped = this.equippedItems.get(item.slot);
    if (currentlyEquipped) {
      this.unequipItem(currentlyEquipped);
    }

    // Equip the item
    this.equippedItems.set(item.slot, itemId);

    // Apply bonuses
    if (this.bonusManager && item.bonuses) {
      item.bonuses.forEach(bonus => {
        this.bonusManager!.bonuses.addBonus(`equipment:${itemId}`, bonus);
      });
    }

    return true;
  }

  unequipItem(itemId: string): boolean {
    const item = this.items.get(itemId);
    if (!item || !item.slot) return false;

    // Remove from equipped slots
    const equipped = this.equippedItems.get(item.slot);
    if (equipped === itemId) {
      this.equippedItems.delete(item.slot);

      // Remove bonuses
      if (this.bonusManager) {
        this.bonusManager.bonuses.removeBonus(`equipment:${itemId}`);
      }

      return true;
    }

    return false;
  }

  isEquipped(itemId: string): boolean {
    return Array.from(this.equippedItems.values()).includes(itemId);
  }

  getEquippedItem(slot: string): InventoryItem | undefined {
    const itemId = this.equippedItems.get(slot);
    return itemId ? this.items.get(itemId) : undefined;
  }

  getAllEquippedItems(): InventoryItem[] {
    return Array.from(this.equippedItems.values())
      .map(itemId => this.items.get(itemId))
      .filter(item => item !== undefined) as InventoryItem[];
  }

  // ===== CURRENCY =====

  getCurrency(): number {
    return this.currency;
  }

  setCurrency(amount: number): void {
    this.currency = Math.max(0, amount);
  }

  addCurrency(amount: number): void {
    this.currency += amount;
  }

  removeCurrency(amount: number): boolean {
    if (this.currency >= amount) {
      this.currency -= amount;
      return true;
    }
    return false;
  }

  canAfford(price: number): boolean {
    return this.currency >= price;
  }

  // Currency conversion for display
  convertToMixedDenominations(marks: number): CurrencyConversion {
    // Convert marks to chips/marks/broams using diamond rates
    // Diamond: 1 mark = 5 chips, 4 marks = 1 broam
    const broams = Math.floor(marks / 4);
    const remainingMarks = marks % 4;
    const chips = 0; // We'll keep it simple and not convert to chips automatically

    return {
      chips,
      marks: remainingMarks,
      broams
    };
  }

  convertFromMixedDenominations(conversion: CurrencyConversion): number {
    // Convert everything to marks
    return (conversion.broams * 4) + conversion.marks + (conversion.chips * 0.2);
  }

  // ===== TRANSACTIONS =====

  purchaseItem(itemId: string, price: number, quantity: number = 1): boolean {
    const totalCost = price * quantity;
    
    if (!this.canAfford(totalCost)) {
      return false;
    }

    if (this.addItem(itemId, quantity)) {
      this.removeCurrency(totalCost);
      return true;
    }

    return false;
  }

  sellItem(itemId: string, price: number, quantity: number = 1): boolean {
    if (!this.hasItem(itemId, quantity)) {
      return false;
    }

    // Sell for half price
    const sellPrice = Math.floor(price * 0.5);
    
    if (this.removeItem(itemId, quantity)) {
      this.addCurrency(sellPrice * quantity);
      return true;
    }

    return false;
  }

  // ===== WEIGHT & CAPACITY =====

  getTotalWeight(): number {
    let total = 0;
    for (const item of this.items.values()) {
      total += item.weight * item.quantity;
    }
    return total;
  }

  getCarryingCapacity(strengthScore: number): number {
    // Base carrying capacity formula (can be adjusted)
    return strengthScore * 50; // 50 lbs per point of Strength
  }

  isOverencumbered(strengthScore: number): boolean {
    return this.getTotalWeight() > this.getCarryingCapacity(strengthScore);
  }

  // ===== SERIALIZATION =====

  serialize(): any {
    return {
      items: Array.from(this.items.entries()).map(([id, item]) => ({
        id,
        quantity: item.quantity,
        customData: {
          fabrialCharges: item.fabrialProperties?.currentCharges,
          properties: item.properties
        }
      })),
      equippedItems: Array.from(this.equippedItems.entries()),
      currency: this.currency
    };
  }

  deserialize(data: any): void {
    this.items.clear();
    this.equippedItems.clear();

    if (data.items) {
      data.items.forEach((itemData: any) => {
        const itemDef = getItemById(itemData.id.split('-')[0]); // Handle unique IDs
        if (itemDef) {
          const item = { ...itemDef, id: itemData.id, quantity: itemData.quantity };
          
          // Restore fabrial charges
          if (item.fabrialProperties && itemData.customData?.fabrialCharges !== undefined) {
            item.fabrialProperties.currentCharges = itemData.customData.fabrialCharges;
          }

          // Restore custom properties
          if (itemData.customData?.properties) {
            item.properties = { ...item.properties, ...itemData.customData.properties };
          }

          this.items.set(itemData.id, item);
        }
      });
    }

    if (data.equippedItems) {
      data.equippedItems.forEach(([slot, itemId]: [string, string]) => {
        this.equippedItems.set(slot, itemId);
      });
    }

    if (data.currency !== undefined) {
      this.currency = data.currency;
    }
  }
}
