# Starting Kit Currency Fix - Implementation Guide

## Bug Summary
Two critical bugs in `applyStartingKitForCharacter()` cause:
1. **Weapons and armor items are not added to character inventory**
2. **Starting currency is 80% lower than intended** (marks not converted to chips)

---

## Bug Details with Examples

### Example Case: Military Kit

**Kit Definition** (lines 1277-1298 in itemDefinitions.ts):
```typescript
{
  id: 'military-kit',
  name: 'Military Kit',
  description: 'Standard equipment for soldiers.',
  weapons: [
    { itemId: 'longsword', quantity: 1 },
    { itemId: 'shield', quantity: 1 }
  ],
  armor: [
    { itemId: 'uniform', quantity: 1 },
    { itemId: 'chain-armor', quantity: 1 }
  ],
  equipment: [
    { itemId: 'backpack', quantity: 1 },
    { itemId: 'common-clothing', quantity: 1 },
    { itemId: 'waterskin', quantity: 1 },
    { itemId: 'flint-steel', quantity: 1 },
    { itemId: 'whetstone', quantity: 1 },
    { itemId: 'blanket', quantity: 1 },
    { itemId: 'food-ration', quantity: 10 }
  ],
  currency: 7 // IN MARKS
}
```

**Current (Broken) Flow:**
```
applyStartingKitForCharacter() in equipment-service.ts
├── Load character from DB
├── Process kit
│   ├── MISSING: Add weapons (longsword, shield)
│   ├── MISSING: Add armor (uniform, chain-armor)  
│   ├── ✓ Add equipment (backpack, clothing, etc.)
│   └── BUG: currencyInChips: 0 + 7  [raw marks, not converted]
└── Save to DB
    └── Result:
        ❌ Missing longsword
        ❌ Missing shield
        ❌ Missing uniform
        ❌ Missing chain-armor
        ✓ Has backpack, clothing
        ❌ Has 7 chips instead of 35 chips
```

**Correct Flow Should Be:**
```
applyStartingKitForCharacter() 
├── Load character from DB
├── Process kit
│   ├── ✓ Add weapons (longsword, shield)
│   ├── ✓ Add armor (uniform, chain-armor)
│   ├── ✓ Add equipment (backpack, clothing, etc.)
│   └── ✓ currencyInChips: 0 + (7 * 5) = 35
└── Save to DB
    └── Result:
        ✓ Has longsword
        ✓ Has shield
        ✓ Has uniform
        ✓ Has chain-armor
        ✓ Has backpack, clothing
        ✓ Has 35 chips (7 marks display)
```

---

## The Broken Code

**File:** [server/services/equipment-service.ts](server/services/equipment-service.ts#L274)

```typescript
// Lines 274-342
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

    // ❌ BUG: ONLY PROCESSES KIT.EQUIPMENT
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
    // ❌ MISSING: kit.weapons and kit.armor loops

    // ❌ BUG: CURRENCY NOT CONVERTED
    // Add kit currency
    const kitCurrency = kit.currency ?? 0;

    char.inventory = {
      ...char.inventory,
      items: newItems,
      currencyInChips: (char.inventory?.currencyInChips ?? 0) + kitCurrency
      // ❌ BUG: Should be: + (kitCurrency * 5)
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
```

---

## The Fixed Code

Replace the entire function with this corrected version:

```typescript
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
    
    // ✅ FIX #1: Add weapons from kit
    if (kit.weapons) {
      for (const { itemId, quantity } of kit.weapons) {
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
    
    // ✅ FIX #1: Add armor from kit
    if (kit.armor) {
      for (const { itemId, quantity } of kit.armor) {
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
    
    // Add equipment
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

    // ✅ FIX #2: Convert kit currency from marks to chips (1 mark = 5 chips)
    const kitCurrency = kit.currency ?? 0;
    const kitCurrencyInChips = Math.round(kitCurrency * 5);

    char.inventory = {
      ...char.inventory,
      items: newItems,
      currencyInChips: (char.inventory?.currencyInChips ?? 0) + kitCurrencyInChips
    };

    console.log(`[Equipment] Applied kit '${kit.name}' to character ${characterId} with ${kitCurrency} marks (${kitCurrencyInChips} chips)`);

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
```

---

## Refactored & Cleaner Version

If you want to avoid code duplication, use this more elegant approach:

```typescript
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
      return { success: false, error: 'Starting kit not found' };
    }

    // Load character
    const char = await loadCharacter(characterId);
    if (!char) {
      return { success: false, error: 'Character not found' };
    }

    // Apply kit items (weapons, armor, equipment)
    const newItems = [...(char.inventory?.items ?? [])];
    
    const addItemsFromArray = (itemsArray: Array<{ itemId: string; quantity: number }> | undefined) => {
      if (!itemsArray) return;
      
      for (const { itemId, quantity } of itemsArray) {
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
    };

    // Add all item categories
    addItemsFromArray(kit.weapons);
    addItemsFromArray(kit.armor);
    addItemsFromArray(kit.equipment);

    // Convert kit currency from marks to chips (1 mark = 5 chips)
    const kitCurrencyInChips = Math.round((kit.currency ?? 0) * 5);

    char.inventory = {
      ...char.inventory,
      items: newItems,
      currencyInChips: (char.inventory?.currencyInChips ?? 0) + kitCurrencyInChips
    };

    console.log(`[Equipment] Applied kit '${kit.name}' to character ${characterId} (${kit.currency} marks = ${kitCurrencyInChips} chips)`);

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
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
```

---

## Testing the Fix

### Test Case 1: Military Kit Application

```typescript
const characterId = 'test-char-001';
const kitId = 'military-kit';

const result = await applyStartingKitForCharacter(characterId, kitId);

// Expected results:
expect(result.success).toBe(true);

// Check items
const items = result.inventoryItems;
expect(items.find(i => i.baseId === 'longsword')).toBeDefined();
expect(items.find(i => i.baseId === 'shield')).toBeDefined();
expect(items.find(i => i.baseId === 'uniform')).toBeDefined();
expect(items.find(i => i.baseId === 'chain-armor')).toBeDefined();
expect(items.find(i => i.baseId === 'backpack')).toBeDefined();

// Check currency: 7 marks * 5 = 35 chips
expect(result.currency).toBe(35);
```

### Test Case 2: Courtier Kit (High Currency)

```typescript
const result = await applyStartingKitForCharacter(characterId, 'courtier-kit');

// Courtier kit has 40 marks
// 40 marks * 5 = 200 chips
expect(result.currency).toBe(200);

// Check items
const items = result.inventoryItems;
expect(items.find(i => i.baseId === 'sidesword')).toBeDefined();
expect(items.find(i => i.baseId === 'alcohol-bottle')).toBeDefined();
expect(items.find(i => i.baseId === 'fine-clothing')).toBeDefined();
```

### Test Case 3: Prisoner Kit (Zero Currency)

```typescript
const result = await applyStartingKitForCharacter(characterId, 'prisoner-kit');

// Prisoner kit has 0 marks
expect(result.currency).toBe(0);

// Check items
const items = result.inventoryItems;
expect(items.find(i => i.baseId === 'manacles')).toBeDefined();
```

---

## Verification Checklist

After implementing the fix, verify:

- [ ] All 6 starting kits are properly applied with all items
- [ ] Currency conversion is correct for all kits (multiply by 5)
- [ ] Weapons are added to inventory
- [ ] Armor is added to inventory
- [ ] Equipment items are added to inventory
- [ ] Character can equip weapons/armor immediately after kit application
- [ ] Currency display shows correct amount in broams/marks/chips
- [ ] Refund still works (clears all items and currency)
- [ ] Purchase now works with correct currency balance

---

## Related Code Sections to Verify

1. **Client-side apply**: [starting-equipment.ts](src/app/components/starting-equipment/starting-equipment.ts#L172)
   - Should receive correct currency from fixed backend

2. **Currency display**: [starting-equipment.ts](src/app/components/starting-equipment/starting-equipment.ts#L364)
   - Should show correct currency once backend is fixed
   - May need parameter name fix (marks → chips) for clarity

3. **Purchase system**: [equipment-service.ts](server/services/equipment-service.ts#L100)
   - Already correct, but test with new starting currency balance

4. **Tests**: Need to add tests in `equipment-service.spec.ts` or similar

---

## Deployment Impact

✅ **Safe to deploy** - This is a pure bug fix with no breaking changes
- Users with already-applied broken kits: Their inventory is correct from the fix forward
- No migration needed: Characters with broken kits can refund and reapply
- Backward compatible: No API changes

---

## Summary of Changes

**One function:** `applyStartingKitForCharacter()` in [server/services/equipment-service.ts](server/services/equipment-service.ts#L274)

**Two fixes:**
1. Add weapons and armor processing loops
2. Multiply kit.currency by 5 before storing in currencyInChips

**Result:**
- Characters get all starting items (weapons + armor + equipment)
- Characters get correct starting currency (not 80% lower)
- System works as originally designed
