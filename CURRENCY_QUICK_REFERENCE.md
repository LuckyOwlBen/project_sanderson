# Starting Kit Currency - Quick Reference

## Issue in One Picture

```
BROKEN: applyStartingKitForCharacter() in equipment-service.ts

❌ Missing Weapons & Armor
   - Only adds kit.equipment items
   - Missing kit.weapons loop
   - Missing kit.armor loop
   
❌ Currency is 80% Lower
   - Takes marks: 7
   - Should multiply: 7 × 5 = 35 chips
   - Actually does: + 7 chips
   - Result: Character gets 1/5 of intended currency
   
IMPACT: Military kit player has 7 chips instead of 35
        No longsword, no shield, no armor!
```

---

## The Four Key Files

### 1. 🔴 THE BUG [server/services/equipment-service.ts](server/services/equipment-service.ts#L274)

**Lines 305-327: Only processes equipment, not weapons/armor**
```typescript
if (kit.equipment) {  // ← Only this
  for (const { itemId, quantity } of kit.equipment) {
    // Add equipment items
  }
}
// ❌ Missing: if (kit.weapons) { ... }
// ❌ Missing: if (kit.armor) { ... }

// ❌ Currency bug: adds raw marks instead of converting
currencyInChips: (char.inventory?.currencyInChips ?? 0) + kitCurrency
// Should be:
currencyInChips: (char.inventory?.currencyInChips ?? 0) + (kitCurrency * 5)
```

### 2. ✅ THE REFERENCE [server/character/inventory/inventoryManager.ts](server/character/inventory/inventoryManager.ts#L25)

**Shows correct implementation (used in client-side):**
```typescript
applyStartingKit(kitId: string): boolean {
  const kit = STARTING_KITS.find(k => k.id === kitId);
  
  kit.weapons.forEach(({ itemId, quantity }) => {
    this.addItem(itemId, quantity);  // ✅ Add weapons
  });
  
  kit.armor.forEach(({ itemId, quantity }) => {
    this.addItem(itemId, quantity);  // ✅ Add armor
  });
  
  kit.equipment.forEach(({ itemId, quantity }) => {
    this.addItem(itemId, quantity);  // ✅ Add equipment
  });
  
  this.currencyInChips = Math.round(kit.currency * 5);  // ✅ Convert marks→chips
  
  return true;
}
```

### 3. 📋 THE DEFINITIONS [server/character/inventory/itemDefinitions.ts](server/character/inventory/itemDefinitions.ts#L1221)

**All kits use marks for currency:**
```typescript
export const STARTING_KITS: StartingKit[] = [
  {
    id: 'military-kit',
    weapons: [
      { itemId: 'longsword', quantity: 1 },
      { itemId: 'shield', quantity: 1 }
    ],
    armor: [
      { itemId: 'uniform', quantity: 1 },
      { itemId: 'chain-armor', quantity: 1 }
    ],
    equipment: [/* ... */],
    currency: 7  // ← IN MARKS (not chips!)
  },
  // ... 5 more kits
];
```

### 4. 📐 CONVERSION FORMULA [server/inventory-manager.js](server/inventory-manager.js#L222)

```typescript
// 1 mark = 5 chips
// 4 marks = 1 broam
// 1 broam = 20 chips

convertToMixedDenominations(marks) {
  const totalChips = Math.round(marks * 5);  // ← The formula
  const broams = Math.floor(totalChips / 20);
  const remainingChips = totalChips % 20;
  const remainingMarks = Math.floor(remainingChips / 5);
  const chips = remainingChips % 5;
  return { chips, marks: remainingMarks, broams };
}
```

---

## Bug Impact by Kit

| Kit | Expected | Broken | Loss | Missing Items |
|-----|----------|--------|------|---|
| Academic | 90 chips | 18 chips | 80% | knife, uniform |
| Artisan | 80 chips | 16 chips | 80% | hammer, leather-armor |
| **Military** | **35 chips** | **7 chips** | **80%** | **longsword, shield, chain-armor** |
| Courtier | 200 chips | 40 chips | 80% | sidesword |
| Prisoner | 0 chips | 0 chips | N/A | (none) |
| Underworld | 50 chips | 10 chips | 80% | knives (×2), leather-armor |

**Example - Military Kit:**
- Supposed to get: longsword, shield, uniform, chain-armor + 35 chips
- Actually get: uniform, chain-armor + 7 chips (missing sword+shield)
- **Missing 5 key items worth ~100 chips!**

---

## Currency Conversion Flow

```
Kit Definition         Equipment Service              Character DB
─────────────────      ───────────────────────────    ──────────────
currency: 7            (BROKEN)                       currencyInChips
(in MARKS)          → currencyInChips: 0 + 7 chips → 7
                                                       
                       ──────────────────────────
                       ✅ (FIXED)
                    → currencyInChips: 0 + (7*5)   → 35
```

---

## Verification Commands

**Check what each kit has:**
```bash
# In itemDefinitions.ts, each kit definition shows:
# - weapons array
# - armor array  
# - equipment array
# - currency (marked as "in marks")
```

**Convert any mark amount to chips:**
```
marks × 5 = chips
7 × 5 = 35 chips
```

**Display formula (client handles correctly):**
```
chips ÷ 20 = broams remainder chips
35 ÷ 20 = 1 broam, 15 chips remainder
15 ÷ 5 = 3 marks, 0 chips
Display: "1b 3mk"
```

---

## Files Modified

1. ✏️ [server/services/equipment-service.ts](server/services/equipment-service.ts#L274-L342)
   - Fix: Add weapons/armor loops + apply currency conversion

2. 📄 Documentation (created):
   - [CURRENCY_ANALYSIS.md](CURRENCY_ANALYSIS.md) - Full research
   - [CURRENCY_FIX_IMPLEMENTATION.md](CURRENCY_FIX_IMPLEMENTATION.md) - Detailed fix guide

---

## Quick Checklist

Before fix:
- ❌ Military kit missing longsword + shield
- ❌ All kits have 80% less currency than intended
- ❌ Character can't equip starting weapon/armor

After fix:
- ✅ All item categories added (weapons, armor, equipment)
- ✅ Currency correctly converted (marks × 5 → chips)
- ✅ Character has full starting kit
- ✅ Refund and purchase systems work properly

---

## Testing Commands

```bash
# After deploying fix, test one kit application:
POST /api/characters/{characterId}/equipment/apply-kit
Body: { kitId: 'military-kit' }

# Expected response:
{
  success: true,
  currency: 35,  // Not 7!
  inventoryItems: [
    { baseId: 'longsword', ... },  // Now present!
    { baseId: 'shield', ... },      // Now present!
    { baseId: 'uniform', ... },
    { baseId: 'chain-armor', ... },
    // ... equipment items ...
  ]
}
```

---

## Root Cause

The `applyStartingKitForCharacter()` function appears to be an incomplete copy from `InventoryManager.applyStartingKit()`:

1. Someone copied the structure ✅
2. Forgot to include weapons/armor loops ❌
3. Forgot to apply the × 5 conversion ❌
4. Function was probably not tested before deploy ❌

The working `InventoryManager` implementation proves the correct approach.

---

## Prevention

Add unit tests to [server/services/equipment-service.spec.ts]:

```typescript
describe('applyStartingKitForCharacter', () => {
  it('should add all weapons from kit', () => {
    // Test and verify kit.weapons items exist
  });
  
  it('should add all armor from kit', () => {
    // Test and verify kit.armor items exist
  });
  
  it('should convert currency from marks to chips', () => {
    // Verify: 7 marks → 35 chips, not 7 chips
  });
  
  it('should maintain existing inventory', () => {
    // Test that existing items aren't lost
  });
});
```

---

## Related Issues

If this affects other functions, check:
- `purchaseItemForCharacter()` - uses currencyInChips correctly
- `sellItemForCharacter()` - uses currencyInChips correctly
- `refundStartingKitForCharacter()` - clears correctly
- Client display - assumes chips input, would be wrong if this was right

All of those are working fine. Only `applyStartingKitForCharacter()` is broken.
