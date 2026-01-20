import { InventoryItem, StartingKit, CurrencyConversion } from './inventoryItem';
import { getItemById, STARTING_KITS } from './itemDefinitions';
import { BonusManager } from '../bonuses/bonusManager';
import type { Character } from '../character';

export class InventoryManager {
  private items: Map<string, InventoryItem> = new Map();
  private equippedItems: Map<string, string> = new Map(); // slot -> itemId
  private currencyInChips: number = 0; // stored in chips (5 chips = 1 mark)
  private bonusManager: BonusManager | null = null;
  private character: Character | null = null;

  constructor() {}

  // ===== INITIALIZATION =====

  setBonusManager(bonusManager: BonusManager): void {
    this.bonusManager = bonusManager;
  }

  setCharacter(character: Character): void {
    this.character = character;
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

    // Set currency (convert marks to chips: 1 mark = 5 chips)
    this.currencyInChips = Math.round(kit.currency * 5);

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

  /**
   * Check if character can use expert traits on an item
   * Expert traits are unlocked by having specific expertises
   */
  canUseExpertTraits(itemId: string): { canUse: boolean; missingExpertises: string[] } {
    const item = this.items.get(itemId);
    if (!item || !this.character) {
      return { canUse: true, missingExpertises: [] };
    }

    const missingExpertises: string[] = [];

    // Check weapon expert traits
    if (item.weaponProperties?.expertTraits && item.weaponProperties.expertTraits.length > 0) {
      const weaponExpertise = this.getWeaponExpertise(item.id, item.name);
      if (weaponExpertise && !this.character.hasExpertise(weaponExpertise)) {
        missingExpertises.push(weaponExpertise);
      }
    }

    // Check armor expert traits
    if (item.armorProperties?.expertTraits && item.armorProperties.expertTraits.length > 0) {
      const armorExpertise = this.getArmorExpertise(item.id, item.name);
      if (armorExpertise && !this.character.hasExpertise(armorExpertise)) {
        missingExpertises.push(armorExpertise);
      }
    }

    return {
      canUse: missingExpertises.length === 0,
      missingExpertises
    };
  }

  /**
   * Get required expertise for weapon based on item ID or name
   */
  private getWeaponExpertise(itemId: string, itemName: string): string | null {
    // Map common weapon types to expertises
    const weaponMap: Record<string, string> = {
      'sword': 'Dueling',
      'axe': 'Axe Fighting',
      'mace': 'Bludgeoning Weapons',
      'spear': 'Spear Fighting',
      'bow': 'Archery',
      'dagger': 'Knife Fighting',
      'staff': 'Staff Fighting',
      'hammer': 'Hammer Fighting',
      'lance': 'Mounted Combat'
    };

    const lowerName = itemName.toLowerCase();
    const lowerId = itemId.toLowerCase();

    for (const [weaponType, expertise] of Object.entries(weaponMap)) {
      if (lowerName.includes(weaponType) || lowerId.includes(weaponType)) {
        return expertise;
      }
    }

    return null;
  }

  /**
   * Get required expertise for armor based on item ID or name
   */
  private getArmorExpertise(itemId: string, itemName: string): string | null {
    // Map armor types to expertises
    const armorMap: Record<string, string> = {
      'plate': 'Armor Mastery',
      'mail': 'Armor Mastery',
      'leather': 'Light Armor',
      'hide': 'Light Armor'
    };

    const lowerName = itemName.toLowerCase();
    const lowerId = itemId.toLowerCase();

    for (const [armorType, expertise] of Object.entries(armorMap)) {
      if (lowerName.includes(armorType) || lowerId.includes(armorType)) {
        return expertise;
      }
    }

    return null;
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

  /**
   * Get currency in marks (for display)
   * Internally stored as chips to avoid floating-point errors
   */
  getCurrency(): number {
    return this.currencyInChips / 5;
  }

  /**
   * Get raw currency in chips (for calculations)
   */
  getCurrencyInChips(): number {
    return this.currencyInChips;
  }

  setCurrency(amount: number): void {
    // Input is in marks, convert to chips for internal storage
    this.currencyInChips = Math.round(amount * 5);
  }

  addCurrency(amount: number): void {
    // Input is in marks, convert to chips
    this.currencyInChips += Math.round(amount * 5);
  }

  removeCurrency(amount: number): boolean {
    // Input is in marks, convert to chips
    const chipsNeeded = Math.round(amount * 5);
    if (this.currencyInChips >= chipsNeeded) {
      this.currencyInChips -= chipsNeeded;
      return true;
    }
    return false;
  }

  removeCurrencyInChips(chipsAmount: number): boolean {
    if (this.currencyInChips >= chipsAmount) {
      this.currencyInChips -= chipsAmount;
      return true;
    }
    return false;
  }

  canAfford(price: number): boolean {
    // Price is in marks, convert to chips for comparison
    const priceInChips = Math.round(price * 5);
    return this.currencyInChips >= priceInChips;
  }

  canAffordInChips(priceInChips: number): boolean {
    return this.currencyInChips >= priceInChips;
  }

  // Currency conversion for display
  convertToMixedDenominations(marks: number): CurrencyConversion {
    // Convert marks to chips/marks/broams using diamond rates
    // Diamond: 1 mark = 5 chips, 4 marks = 1 broam
    // Work with chips internally to avoid floating-point issues
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

  convertFromMixedDenominations(conversion: CurrencyConversion): number {
    // Convert everything to marks
    return (conversion.broams * 4) + conversion.marks + (conversion.chips / 5);
  }

  // ===== TRANSACTIONS =====

  purchaseItem(itemId: string, price: number, quantity: number = 1): boolean {
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

  sellItem(itemId: string, price: number, quantity: number = 1): boolean {
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
      currencyInChips: Number.isFinite(this.currencyInChips) ? this.currencyInChips : 0
    };
  }

  deserialize(data: any): void {
    this.items.clear();
    this.equippedItems.clear();
    this.currencyInChips = 0; // Reset to default

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

    // Handle both old (currency in marks) and new (currencyInChips) formats for migration
    if (data.currencyInChips !== undefined && typeof data.currencyInChips === 'number') {
      this.currencyInChips = Math.max(0, Math.round(data.currencyInChips));
    } else if (data.currency !== undefined && typeof data.currency === 'number') {
      // Migration: convert old marks to chips
      this.currencyInChips = Math.max(0, Math.round(data.currency * 5));
    }
  }
}
