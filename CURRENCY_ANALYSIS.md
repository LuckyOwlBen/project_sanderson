# Starting Kit Currency Flow Analysis

## Summary
Research reveals **two critical bugs** in the starting kit application flow:

1. **Missing weapons/armor items** - Only equipment items are being added
2. **Currency unit mismatch** - Raw marks being added directly instead of converting to chips

---

## 1. STARTING KIT DEFINITIONS

### File: [server/character/inventory/itemDefinitions.ts](server/character/inventory/itemDefinitions.ts#L1221)

**STARTING_KITS array** with all kits defined:

```typescript
export const STARTING_KITS: StartingKit[] = [
  {
    id: 'academic-kit',
    name: 'Academic Kit',
    description: 'Equipment for scholars and researchers.',
    weapons: [
      { itemId: 'knife', quantity: 1 }
    ],
    armor: [
      { itemId: 'uniform', quantity: 1 }
    ],
    equipment: [
      { itemId: 'backpack', quantity: 1 },
      { itemId: 'common-clothing', quantity: 1 },
      // ... more items
    ],
    currency: 18, // 3d12 average - IN MARKS
    additionalExpertise: 'Literature'
  },
  {
    id: 'artisan-kit',
    name: 'Artisan Kit',
    // ... weapons, armor, equipment ...
    currency: 16 // 4d8 average
  },
  {
    id: 'military-kit',
    name: 'Military Kit',
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
      // ... more items ...
    ],
    currency: 7 // 2d6 average
  },
  {
    id: 'courtier-kit',
    name: 'Courtier Kit',
    weapons: [
      { itemId: 'sidesword', quantity: 1 }
    ],
    armor: [],
    equipment: [
      { itemId: 'alcohol-bottle', quantity: 1 },
      { itemId: 'fine-clothing', quantity: 1 }
    ],
    currency: 40, // 4d20 average
    connection: 'Supported by a patron of your noble house.'
  },
  {
    id: 'prisoner-kit',
    name: 'Prisoner Kit',
    weapons: [],
    armor: [],
    equipment: [
      { itemId: 'manacles', quantity: 1 }
    ],
    currency: 0,
    connection: "You've attracted a Radiant spren through your trials."
  },
  {
    id: 'underworld-kit',
    name: 'Underworld Kit',
    weapons: [
      { itemId: 'knife', quantity: 2 }
    ],
    armor: [
      { itemId: 'leather-armor', quantity: 1 }
    ],
    equipment: [
      // ... items ...
    ],
    currency: 10 // 1d20 average
  }
];
```

**Key Points:**
- All currency values are defined in **MARKS** (see comments)
- Each kit has separate `weapons`, `armor`, and `equipment` arrays
- Kit currency ranges: 0-40 marks

---

## 2. STARTING KIT DATA STRUCTURE

### File: [server/character/inventory/inventoryItem.ts](server/character/inventory/inventoryItem.ts#L49)

```typescript
export interface StartingKit {
  id: string;
  name: string;
  description: string;
  weapons: { itemId: string; quantity: number }[];
  armor: { itemId: string; quantity: number }[];
  equipment: { itemId: string; quantity: number }[];
  currency: number; // in marks  ← IMPORTANT: MARKS, not chips
  additionalExpertise?: string;
  connection?: string;
}
```

---

## 3. CURRENCY DENOMINATIONS

### File: [server/inventory-manager.js](server/inventory-manager.js#L222)

```typescript
// Currency conversion logic:
// 1 mark = 5 chips
// 4 marks = 1 broam
// 1 broam = 20 chips

convertToMixedDenominations(marks) {
  const totalChips = Math.round(marks * 5);
  const broams = Math.floor(totalChips / 20);
  const remainingChips = totalChips % 20;
  const remainingMarks = Math.floor(remainingChips / 5);
  const chips = remainingChips % 5;
  return { chips, marks: remainingMarks, broams };
}

convertFromMixedDenominations(conversion) {
  // Convert everything back to marks
  return (conversion.broams * 4) + conversion.marks + (conversion.chips / 5);
}
```

**System uses 3 denominations:**
- **Chips** (smallest): 5 chips = 1 mark
- **Marks** (medium): 4 marks = 1 broam
- **Broams** (largest): 20 chips = 1 broam

**Internal storage:** Always in chips to avoid floating-point errors

---

## 4. BROKEN: applyStartingKitForCharacter() - THE MAIN BUG

### File: [server/services/equipment-service.ts](server/services/equipment-service.ts#L274)

```typescript
export async function applyStartingKitForCharacter(
  characterId: string,
  kitId: string
): Promise<{...}> {
  try {
    const kit = STARTING_KITS.find(k => k.id === kitId);
    if (!kit) {
      return { success: false, error: 'Starting kit not found' };
    }

    const char = await loadCharacter(characterId);
    if (!char) {
      return { success: false, error: 'Character not found' };
    }

    // ❌ BUG #1: ONLY ADDING EQUIPMENT, NOT WEAPONS/ARMOR
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
    // Missing: kit.weapons and kit.armor loops!

    // ❌ BUG #2: CURRENCY UNIT MISMATCH
    const kitCurrency = kit.currency ?? 0;  // This is in MARKS
    
    char.inventory = {
      ...char.inventory,
      items: newItems,
      currencyInChips: (char.inventory?.currencyInChips ?? 0) + kitCurrency
      // ^^^ Adding MARKS directly to CHIPS field, no conversion!
    };

    await saveCharacter(char);
    const result = await getEquipmentByCharacterId(characterId);
    return {
      success: true,
      inventory: char.inventory,
      inventoryItems: result.inventoryItems,
      currency: char.inventory.currencyInChips,  // Returns raw chips value
      message: `Applied ${kit.name}`
    };
  } catch (error) {
    console.error('[Equipment] Error applying kit:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
```

**BUG #1 - Missing Weapons and Armor:**
- Function ONLY loops through `kit.equipment`
- Never adds `kit.weapons` array items
- Never adds `kit.armor` array items
- Characters are missing starting weapons and armor!

**BUG #2 - Currency Unit Mismatch:**
- `kit.currency` is in MARKS (documented in interface)
- Code adds it directly to `currencyInChips` field
- Missing conversion: should multiply by 5
- Example: Military kit with 7 marks becomes 7 chips instead of 35 chips
  - **Off by 500%** (5x too low)

---

## 5. CORRECT IMPLEMENTATION: InventoryManager.applyStartingKit()

### File: [server/character/inventory/inventoryManager.ts](server/character/inventory/inventoryManager.ts#L25)

This shows the correct approach from InventoryManager (used in client-side):

```typescript
applyStartingKit(kitId: string): boolean {
  const kit = STARTING_KITS.find(k => k.id === kitId);
  if (!kit) return false;

  this.items.clear();
  this.equippedItems.clear();

  // ✅ CORRECT: Adding all three item types
  kit.weapons.forEach(({ itemId, quantity }) => {
    this.addItem(itemId, quantity);
  });

  kit.armor.forEach(({ itemId, quantity }) => {
    this.addItem(itemId, quantity);
  });

  kit.equipment.forEach(({ itemId, quantity }) => {
    this.addItem(itemId, quantity);
  });

  // ✅ CORRECT: Converting marks to chips with multiplication by 5
  this.currencyInChips = Math.round(kit.currency * 5);

  return true;
}
```

**What it does correctly:**
1. Adds all weapons
2. Adds all armor  
3. Adds all equipment
4. **Multiplies marks by 5** to convert to chips

---

## 6. CHARACTER CURRENCY INITIALIZATION

### File: [server/data-access/character-dto.ts](server/data-access/character-dto.ts#L235)

```typescript
export function createEmptyCharacterDTO(id: string, name: string = ''): CharacterDTO {
  return {
    // ... other modules ...
    
    // MODULE 11: INVENTORY
    inventory: {
      items: [],
      equipped: {
        armor: null,
        weapons: []
      }
    },
    
    // ... more modules ...
    // NOTE: currencyInChips is NOT initialized in createEmptyCharacterDTO
  };
}
```

**Issue:** `currencyInChips` is not explicitly initialized (defaults to `undefined`). Code handles this with `?? 0` fallback.

### Database Schema:

[Prisma schema](prisma/migrations/20260204054808_add_currency_in_chips/migration.sql):

```sql
CREATE TABLE "new_Character" (
    "currencyInChips" REAL NOT NULL DEFAULT 0,
    -- other fields...
);
```

**Good:** Database defaults to 0, but code should be explicit.

---

## 7. CURRENCY DISPLAY TO USER

### Client Component: [src/app/components/starting-equipment/starting-equipment.ts](src/app/components/starting-equipment/starting-equipment.ts#L364)

```typescript
getCurrencyDisplay(): string {
  const converted = this.convertToMixedDenominations(this.currentCurrency);
  
  const parts: string[] = [];
  if (converted.broams > 0) parts.push(`${converted.broams}b`);
  if (converted.marks > 0) parts.push(`${converted.marks}mk`);
  if (converted.chips > 0) parts.push(`${converted.chips}c`);
  
  return parts.length > 0 ? parts.join(' ') : '0 broams';
}

private convertToMixedDenominations(marks: number): { chips: number; marks: number; broams: number } {
  const totalChips = Math.round(marks * 5);
  const broams = Math.floor(totalChips / 20);
  const remainingChips = totalChips % 20;
  const remainingMarks = Math.floor(remainingChips / 5);
  const chips = remainingChips % 5;

  return {
    chips,
    marks: remainingMarks,
    broams
  };
}
```

**Problem:** 
- Assumes input is in MARKS (see parameter name)
- But `this.currentCurrency` is actually in CHIPS (from `char.inventory?.currencyInChips`)
- So when bug #2 occurs, user sees 5x too little currency anyway!

---

## 8. ApplyStartingKit IN HTML

### File: [src/app/components/starting-equipment/starting-equipment.html](src/app/components/starting-equipment/starting-equipment.html#L144)

```html
<div class="kit-currency" *ngIf="startingKit">
  <mat-icon>paid</mat-icon>
  <span>Starting Currency: {{ startingKit.currency }} marks</span>
</div>
```

**Correct:** Shows currency in marks as defined in the kit.

---

## 9. REFUND FLOW

### File: [server/services/equipment-service.ts](server/services/equipment-service.ts#L355)

```typescript
export async function refundStartingKitForCharacter(
  characterId: string
): Promise<{...}> {
  try {
    const char = await loadCharacter(characterId);
    if (!char) {
      return { success: false, error: 'Character not found' };
    }

    // Completely clear inventory including currency
    char.inventory = {
      items: [],
      equippedItems: [],
      currencyInChips: 0  // ← Reset to 0
    };

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
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
```

**Behavior:** Wipes all items and resets currency to 0 (this works correctly).

---

## 10. CURRENCY AND ITEM PURCHASE

### File: [server/services/equipment-service.ts](server/services/equipment-service.ts#L100)

```typescript
export async function purchaseItemForCharacter(
  characterId: string,
  itemId: string,
  quantity: number = 1
): Promise<{...}> {
  try {
    const item = getItemById(itemId);
    if (!item) {
      return { success: false, error: 'Item not found' };
    }

    const char = await loadCharacter(characterId);
    if (!char) {
      return { success: false, error: 'Character not found' };
    }

    const currentCurrency = char.inventory?.currencyInChips ?? 0;
    const cost = (item.price ?? 0) * quantity;  // ← Expects price in chips

    if (currentCurrency < cost) {
      return { success: false, error: 'Cannot afford item' };
    }

    const newCurrency = currentCurrency - cost;
    // ... add item, save, etc ...
    
    char.inventory = {
      ...char.inventory,
      items: newItems,
      currencyInChips: newCurrency
    };

    await saveCharacter(char);
    // ...
  } catch (error) {
    console.error('[Equipment] Error purchasing item:', error);
    // ...
  }
}
```

**Correct:** 
- Uses currencyInChips directly
- Item prices stored in chips
- Calculation is: `(item.price in chips) * quantity`

### Item Price Examples from definitions:

```typescript
{
  id: 'knife',
  name: 'Knife',
  price: 3,  // in chips
  // ...
},
{
  id: 'longsword',
  name: 'Longsword',
  price: 20,  // in chips
  // ...
}
```

---

## ISSUES SUMMARY

### ❌ Critical Bug #1: Missing Weapons & Armor Items
**Location:** [equipment-service.ts lines 305-319](server/services/equipment-service.ts#L305)

**Problem:** Only `kit.equipment` array is processed. Weapons and armor are ignored.

**Impact:**
- Military kit missing longsword and shield
- Academic kit missing knife  
- Courtier kit missing sidesword
- Underworld kit missing knives
- All kits with armor lose it

**Example - Military Kit:**
```
Expected: longsword, shield, uniform, chain-armor, backpack, etc.
Actual:   backpack, common-clothing, waterskin, flint-steel, whetstone, blanket, food-rations (missing weapon & armor!)
```

---

### ❌ Critical Bug #2: Currency Unit Mismatch (500% Loss)
**Location:** [equipment-service.ts line 327](server/services/equipment-service.ts#L327)

**Problem:** Raw marks added to chips field without multiplication by 5.

```typescript
// BUG:
currencyInChips: (char.inventory?.currencyInChips ?? 0) + kitCurrency
// Should be:
currencyInChips: (char.inventory?.currencyInChips ?? 0) + (kitCurrency * 5)
```

**Impact:**
| Kit | Expected Chips | Buggy Chips | Loss |
|-----|---|---|---|
| Academic (18 marks) | 90 chips | 18 chips | 80% |
| Artisan (16 marks) | 80 chips | 16 chips | 80% |
| Military (7 marks) | 35 chips | 7 chips | 80% |
| Courtier (40 marks) | 200 chips | 40 chips | 80% |
| Prisoner (0 marks) | 0 chips | 0 chips | N/A |
| Underworld (10 marks) | 50 chips | 10 chips | 80% |

**Example - Courtier Kit:**
- Expected: 40 marks = 200 chips = 10 marks + 0 chips
- Buggy: 40 chips = 8 marks (net: 8 marks instead of 40!)
- **Character is 80% poorer!**

---

### ⚠️ Secondary Issue: Currency Display Logic Confusion
**Location:** [starting-equipment.ts lines 374-386](src/app/components/starting-equipment/starting-equipment.ts#L374)

**Problem:** `convertToMixedDenominations()` parameter name suggests marks input but receives chips.

```typescript
// Parameter name is misleading
private convertToMixedDenominations(marks: number): { chips: number; marks: number; broams: number } {
  const totalChips = Math.round(marks * 5);  // ← Treats input as marks!
  // ...
}

// But called with:
getCurrencyDisplay(): string {
  const converted = this.convertToMixedDenominations(this.currentCurrency);
  // this.currentCurrency is already in chips!
}
```

**Result:** Due to Bug #2, the display accidentally works (garbage-in-garbage-out), but logic is wrong.

---

## COMPARISON: InventoryManager vs Equipment Service

| Aspect | InventoryManager.ts | equipment-service.ts |
|--------|---|---|
| **Add weapons** | ✅ Yes | ❌ No |
| **Add armor** | ✅ Yes | ❌ No |
| **Add equipment** | ✅ Yes | ✅ Yes |
| **Currency conversion** | ✅ `kit.currency * 5` | ❌ `kit.currency` (raw) |
| **Storage** | `currencyInChips` field | `currencyInChips` field |
| **Test status** | Used in client-side | **BROKEN ON SERVER** |

---

## ROOT CAUSE

The `applyStartingKitForCharacter()` function in `equipment-service.ts` appears to be an incomplete refactor:

1. Someone copied the structure from InventoryManager
2. Forgot to include the weapons/armor loops
3. Forgot to apply the `* 5` conversion to currency
4. Function never tested before deployment

The InventoryManager implementation is correct and should be used as the reference.

---

## FIX REQUIRED

Apply changes to [server/services/equipment-service.ts](server/services/equipment-service.ts#L274-L342):

1. **Add weapons and armor loops** (after line 305)
2. **Apply currency conversion** (line 327)  
3. **Add tests** to prevent regression

See next steps for implementation.
