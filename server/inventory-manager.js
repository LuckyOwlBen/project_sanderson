const { getItemById, STARTING_KITS } = require('./item-definitions');

class InventoryManager {
  constructor() {
    this.items = new Map();
    this.equippedItems = new Map(); // slot -> itemId
    this.currencyInChips = 0; // stored in chips (5 chips = 1 mark)
  }

  // ===== INITIALIZATION =====

  applyStartingKit(kitId) {
    const kit = STARTING_KITS.find(k => k.id === kitId);
    if (!kit) return false;

    // Clear existing inventory
    this.items.clear();
    this.equippedItems.clear();

    // Add weapons
    if (kit.weapons) {
      kit.weapons.forEach(({ itemId, quantity }) => {
        this.addItem(itemId, quantity);
      });
    }

    // Add armor
    if (kit.armor) {
      kit.armor.forEach(({ itemId, quantity }) => {
        this.addItem(itemId, quantity);
      });
    }

    // Add equipment
    if (kit.equipment) {
      kit.equipment.forEach(({ itemId, quantity }) => {
        this.addItem(itemId, quantity);
      });
    }

    // Set currency (convert marks to chips: 1 mark = 5 chips)
    this.currencyInChips = Math.round(kit.currency * 5);

    return true;
  }

  // ===== ITEM MANAGEMENT =====

  addItem(itemId, quantity = 1) {
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

  removeItem(itemId, quantity = 1) {
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

  getItem(itemId) {
    return this.items.get(itemId);
  }

  getAllItems() {
    return Array.from(this.items.values());
  }

  getItemsByType(type) {
    return this.getAllItems().filter(item => item.type === type);
  }

  hasItem(itemId, quantity = 1) {
    const item = this.items.get(itemId);
    return item ? item.quantity >= quantity : false;
  }

  getItemQuantity(itemId) {
    const item = this.items.get(itemId);
    return item ? item.quantity : 0;
  }

  // ===== EQUIPMENT =====

  equipItem(itemId) {
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
    return true;
  }

  unequipItem(itemId) {
    const item = this.items.get(itemId);
    if (!item || !item.slot) return false;

    // Remove from equipped slots
    const equipped = this.equippedItems.get(item.slot);
    if (equipped === itemId) {
      this.equippedItems.delete(item.slot);
      return true;
    }

    return false;
  }

  isEquipped(itemId) {
    return Array.from(this.equippedItems.values()).includes(itemId);
  }

  getEquippedItem(slot) {
    const itemId = this.equippedItems.get(slot);
    return itemId ? this.items.get(itemId) : undefined;
  }

  getAllEquippedItems() {
    return Array.from(this.equippedItems.values())
      .map(itemId => this.items.get(itemId))
      .filter(item => item !== undefined);
  }

  // ===== CURRENCY =====

  /**
   * Get currency in marks (for display)
   * Internally stored as chips to avoid floating-point errors
   */
  getCurrency() {
    return this.currencyInChips / 5;
  }

  /**
   * Get raw currency in chips (for calculations)
   */
  getCurrencyInChips() {
    return this.currencyInChips;
  }

  setCurrency(amount) {
    // Input is in marks, convert to chips for internal storage
    this.currencyInChips = Math.round(amount * 5);
  }

  addCurrency(amount) {
    // Input is in marks, convert to chips
    this.currencyInChips += Math.round(amount * 5);
  }

  removeCurrency(amount) {
    // Input is in marks, convert to chips
    const chipsNeeded = Math.round(amount * 5);
    if (this.currencyInChips >= chipsNeeded) {
      this.currencyInChips -= chipsNeeded;
      return true;
    }
    return false;
  }

  removeCurrencyInChips(chipsAmount) {
    if (this.currencyInChips >= chipsAmount) {
      this.currencyInChips -= chipsAmount;
      return true;
    }
    return false;
  }

  canAfford(price) {
    // Price is in marks, convert to chips for comparison
    const priceInChips = Math.round(price * 5);
    return this.currencyInChips >= priceInChips;
  }

  canAffordInChips(priceInChips) {
    return this.currencyInChips >= priceInChips;
  }

  // Currency conversion for display
  convertToMixedDenominations(marks) {
    // Convert marks to chips/marks/broams
    // 1 mark = 5 chips, 4 marks = 1 broam
    const totalChips = Math.round(marks * 5);
    const broams = Math.floor(totalChips / 20); // 4 marks = 20 chips
    const remainingChips = totalChips % 20;
    const remainingMarks = Math.floor(remainingChips / 5);
    const chips = remainingChips % 5;

    return {
      chips,
      marks: remainingMarks,
      broams
    };
  }

  convertFromMixedDenominations(conversion) {
    // Convert everything to marks
    return (conversion.broams * 4) + conversion.marks + (conversion.chips / 5);
  }

  // ===== TRANSACTIONS =====

  purchaseItem(itemId, price, quantity = 1) {
    const totalCostInMarks = price * quantity;
    const totalCostInChips = Math.round(totalCostInMarks * 5);
    
    if (!this.canAffordInChips(totalCostInChips)) {
      return false;
    }

    if (this.addItem(itemId, quantity)) {
      this.removeCurrencyInChips(totalCostInChips);
      return true;
    }

    return false;
  }

  sellItem(itemId, price, quantity = 1) {
    if (!this.hasItem(itemId, quantity)) {
      return false;
    }

    // Sell for half price
    const sellPriceInMarks = (price * 0.5);
    const sellPriceInChips = Math.round(sellPriceInMarks * quantity * 5);
    
    if (this.removeItem(itemId, quantity)) {
      this.currencyInChips += sellPriceInChips;
      return true;
    }

    return false;
  }

  // ===== WEIGHT & CAPACITY =====

  getTotalWeight() {
    let total = 0;
    for (const item of this.items.values()) {
      total += item.weight * item.quantity;
    }
    return total;
  }

  getCarryingCapacity(strengthScore) {
    // Base carrying capacity formula
    return strengthScore * 50; // 50 lbs per point of Strength
  }

  isOverencumbered(strengthScore) {
    return this.getTotalWeight() > this.getCarryingCapacity(strengthScore);
  }

  // ===== SERIALIZATION =====

  serialize() {
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
      currencyInChips: Number.isFinite(this.currencyInChips) ? this.currencyInChips : 0
    };
  }

  deserialize(data) {
    this.items.clear();
    this.equippedItems.clear();
    this.currencyInChips = 0; // Reset to default

    if (data.items) {
      data.items.forEach((itemData) => {
        // Handle unique IDs by extracting base item ID
        const baseItemId = itemData.id.split('-')[0];
        const itemDef = getItemById(baseItemId);
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
      data.equippedItems.forEach(([slot, itemId]) => {
        this.equippedItems.set(slot, itemId);
      });
    }

    // Handle both old (currency in marks) and new (currencyInChips) formats
    if (data.currencyInChips !== undefined && typeof data.currencyInChips === 'number') {
      this.currencyInChips = Math.max(0, Math.round(data.currencyInChips));
    } else if (data.currency !== undefined && typeof data.currency === 'number') {
      // Migration: convert old marks to chips
      this.currencyInChips = Math.max(0, Math.round(data.currency * 5));
    }
  }
}

module.exports = InventoryManager;
