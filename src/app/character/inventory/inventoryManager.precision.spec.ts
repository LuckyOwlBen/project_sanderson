import { InventoryManager } from './inventoryManager';

describe('InventoryManager - Currency Precision', () => {
  let inventoryManager: InventoryManager;

  beforeEach(() => {
    inventoryManager = new InventoryManager();
  });

  describe('floating-point precision with chip-based currency', () => {
    it('should handle decimal prices without accumulating floating-point errors', () => {
      // Start with some marks
      inventoryManager.setCurrency(100);
      expect(inventoryManager.getCurrency()).toBe(100);

      // Remove currency at decimal amounts (simulating purchases at 0.2 marks each)
      for (let i = 0; i < 9; i++) {
        inventoryManager.removeCurrency(0.2);
      }

      // Should have spent 1.8 marks
      const remaining = inventoryManager.getCurrency();
      expect(remaining).toBeCloseTo(98.2, 2); // Allow 2 decimal places
      // More importantly, should not have weird floating-point garbage
      expect(String(remaining)).not.toMatch(/e-\d+/); // No scientific notation
    });

    it('should handle selling with decimal prices precisely', () => {
      inventoryManager.setCurrency(50);

      // Sell at 0.4 marks per item (when item price is 0.8, sell at half)
      // 0.4 * 5 = 2 chips exactly per item
      // For 5 items: 5 * 2 = 10 chips = 2 marks
      inventoryManager.addCurrency(0.4 * 5);

      // Should have 50 + (0.4 * 5) = 50 + 2 = 52 marks
      const currency = inventoryManager.getCurrency();
      expect(currency).toBe(52);
    });

    it('should maintain precision through multiple decimal transactions', () => {
      inventoryManager.setCurrency(10);

      // A series of transactions with decimals that are chip-friendly
      // 0.2 * 5 = 1 chip exactly
      inventoryManager.removeCurrency(0.2 * 3); // -0.6 (3 chips)
      inventoryManager.addCurrency(0.4 * 5); // +2 marks (10 chips, simulating sell)
      inventoryManager.removeCurrency(0.2 * 2); // -0.4 (2 chips)

      // 10 - 0.6 - 0.4 + 2 = 11
      const currency = inventoryManager.getCurrency();
      expect(currency).toBe(11);
    });

    it('should not have 1.7e-15 type errors', () => {
      inventoryManager.setCurrency(5);

      // Remove currency at decimal amounts repeatedly
      for (let i = 0; i < 25; i++) {
        inventoryManager.removeCurrency(0.2);
      }

      // Should have exactly 0 marks (5 - 25*0.2 = 0)
      const currency = inventoryManager.getCurrency();
      expect(currency).toBe(0);
      // Should not be a tiny floating-point error like 1.7763568394002505e-15
      expect(String(currency)).not.toMatch(/e-\d+/);
    });

    it('should round correctly when converting marks to chips', () => {
      inventoryManager.setCurrency(0);

      // Add 0.33 marks (2 chips rounded from 1.65)
      inventoryManager.addCurrency(0.33);
      // Add 0.33 marks again (2 chips rounded from 1.65)
      inventoryManager.addCurrency(0.33);
      // Add 0.34 marks (2 chips rounded from 1.7)
      inventoryManager.addCurrency(0.34);

      // Total chips: 2 + 2 + 2 = 6 chips = 1.2 marks
      const currency = inventoryManager.getCurrency();
      expect(currency).toBe(1.2);
    });

    it('should handle purchase affordability checks with decimal amounts', () => {
      inventoryManager.setCurrency(1);

      // Try to buy waterskin at 1 mark
      const canBuy = inventoryManager.canAfford(1);
      expect(canBuy).toBe(true);

      // Purchase should succeed
      const purchased = inventoryManager.purchaseItem('waterskin', 1, 1);
      expect(purchased).toBe(true);

      // Now should have 0 marks
      expect(inventoryManager.getCurrency()).toBe(0);

      // Try to buy another at 1 mark
      const cantBuy = inventoryManager.canAfford(1);
      expect(cantBuy).toBe(false);
    });
  });
});
