# Expertise, Crafting, and Item Integration System

## Overview

This document describes the complete integration between the expertise system, crafting mechanics, and item expert traits. The system enables character progression through expertise-gated crafting recipes and equipment bonuses.

## System Architecture

```
┌─────────────┐
│  Character  │
│  Expertise  │───┐
└─────────────┘   │
                  ├──> Unlocks Recipes
┌─────────────┐   │
│  Crafting   │<──┘
│  Recipes    │
└─────────────┘
       │
       │ Consumes Materials
       ├──> Creates Items
       │
       v
┌─────────────┐
│  Inventory  │
│    Items    │
└─────────────┘
       │
       │ Expert Traits
       ├──> Requires Expertise
       │
       v
┌─────────────┐
│  Enhanced   │
│   Bonuses   │
└─────────────┘
```

## Expertise System

### Expertise Sources

Expertises can be granted from multiple sources, tracked with `ExpertiseSource` interface:

```typescript
interface ExpertiseSource {
  name: string;                    // Expertise name (e.g., "Weapon Crafting")
  source: 'culture' | 'talent' | 'gm' | 'manual';
  sourceId?: string;               // Optional ID for tracking origin
}
```

**Sources:**
- **Culture**: Granted automatically when culture is selected
- **Talent**: Granted when specific talents are unlocked
- **GM**: Granted by game master via websocket
- **Manual**: Granted through UI or other means

### Performance Optimization

The Character class uses **cached expertise lookups** for O(1) performance:

```typescript
// In Character class
private expertiseCache: Set<string> | null = null;

hasExpertise(expertiseName: string): boolean {
  if (!this.expertiseCache) {
    this.rebuildExpertiseCache(); // Lazy initialization
  }
  return this.expertiseCache!.has(expertiseName); // O(1) lookup
}
```

**Cache Management:**
- Cache is built lazily on first `hasExpertise()` call
- Call `character.invalidateExpertiseCache()` when modifying `selectedExpertises` array
- Cache automatically rebuilds on next lookup

## Crafting System

### CraftingManager

The `CraftingManager` handles recipe storage, validation, and item creation.

#### Recipe Structure

```typescript
interface Recipe {
  id: string;                      // Unique recipe identifier
  name: string;                    // Display name
  description: string;             // Recipe description
  requiredExpertise: string;       // Expertise needed to craft
  materials: MaterialRequirement[]; // Items consumed
  resultItemId: string;            // Item created
  resultQuantity: number;          // Number created
  difficulty: CraftingDifficulty;  // Difficulty tier
  craftingTime?: string;           // Estimated time
  category: RecipeCategory;        // Category for filtering
}

interface MaterialRequirement {
  itemId: string;
  quantity: number;
}

type CraftingDifficulty = 'trivial' | 'easy' | 'moderate' | 'hard' | 'very-hard' | 'masterwork';
type RecipeCategory = 'weapon' | 'armor' | 'utility' | 'consumable' | 'fabrial' | 'equipment';
```

#### Crafting Flow

1. **Check Prerequisites**: `canCraft(recipeId)` validates expertise and materials
2. **Craft Item**: `craftItem(recipeId)` executes the crafting process
3. **Material Consumption**: Materials are removed from inventory
4. **Item Creation**: Resulting item is added to inventory
5. **Rollback on Failure**: If any step fails, materials are restored

```typescript
// Example usage
const canCraft = character.crafting.canCraft('craft-iron-sword');
if (canCraft.canCraft) {
  const result = character.crafting.craftItem('craft-iron-sword');
  if (result.success) {
    console.log(`Crafted ${result.itemId}!`);
  }
} else {
  console.log(`Cannot craft: ${canCraft.reason}`);
}
```

#### Default Recipes

| Recipe ID | Name | Expertise | Materials | Result |
|-----------|------|-----------|-----------|--------|
| craft-iron-sword | Iron Sword | Weapon Crafting | 3x iron-ingot, 1x leather-strip | iron-sword |
| craft-steel-sword | Steel Sword | Weapon Crafting | 3x steel-ingot, 2x leather-strip | steel-sword |
| craft-leather-armor | Leather Armor | Armor Crafting | 5x leather, 3x thread | leather-armor |
| craft-heating-fabrial | Heating Fabrial | Fabrial Crafting | 1x gemstone-ruby, 1x metal-housing, 2x copper-wire | heating-fabrial |
| craft-health-potion | Health Potion | Equipment Crafting | 2x medicinal-herbs, 1x water-flask | health-potion |

### Recipe Discovery

```typescript
// Get ALL recipes (including ones character can't craft)
const allRecipes = character.crafting.getAllRecipes();

// Get only recipes character has expertise for
const availableRecipes = character.crafting.getAvailableRecipes();

// Filter by category
const weaponRecipes = character.crafting.getRecipesByCategory('weapon');
```

## Item Expert Traits

### What Are Expert Traits?

Expert traits are special bonuses on items that require specific expertises to use. Items without the required expertise are still usable, but their expert traits remain locked.

### Expertise Mapping

**Weapon Expertises:**
- Sword → Dueling
- Axe → Axe Fighting
- Spear → Spear Fighting
- Bow → Archery
- Dagger → Knife Fighting
- Mace → Bludgeoning Weapons
- Staff → Staff Fighting
- Hammer → Hammer Fighting
- Lance → Mounted Combat

**Armor Expertises:**
- Leather/Hide → Light Armor
- Chain → Medium Armor
- Plate/Mail → Armor Mastery
- Shield → Shield Mastery

### Checking Expert Traits

```typescript
// Check if character can use expert traits
const result = character.inventory.canUseExpertTraits('iron-sword');

if (!result.canUse) {
  console.log(`Locked! Need: ${result.missingExpertises.join(', ')}`);
} else {
  console.log('Expert traits unlocked!');
}
```

### UI Indicators

The inventory UI displays expertise status with visual indicators:

**Lock Icons:**
- 🔓 Green `lock_open` - Expert traits unlocked
- 🔒 Red `lock` - Expert traits locked

**Tooltips:**
- Unlocked: "Expert traits unlocked"
- Locked: "Requires: Dueling, Light Armor"

**Expert Traits Section:**
- Lists all expert trait bonuses
- Shows locked/unlocked status with color coding
- Displays required expertises when locked

## Complete Integration Flow

### Example: Crafting and Using an Item

```typescript
// 1. Character gains expertise from culture
character.cultures = [ALETHI_CULTURE];
character.selectedExpertises = [
  { name: 'Armor Crafting', source: 'culture', sourceId: 'alethi' },
  { name: 'Light Armor', source: 'culture', sourceId: 'alethi' }
];

// 2. Check available recipes (now includes armor recipes)
const recipes = character.crafting.getAvailableRecipes();
// Returns recipes with requiredExpertise === 'Armor Crafting'

// 3. Add materials
character.inventory.addItem('leather', 5);
character.inventory.addItem('thread', 3);

// 4. Craft the item
const result = character.crafting.craftItem('craft-leather-armor');
// Materials consumed: -5 leather, -3 thread
// Item created: +1 leather-armor

// 5. Equip the item
character.inventory.equipItem('leather-armor');

// 6. Check expert traits (unlocked because character has Light Armor expertise)
const traits = character.inventory.canUseExpertTraits('leather-armor');
// traits.canUse === true (has Light Armor expertise)
```

## Testing

### Test Coverage

**253 total tests** across the system:

**Integration Tests (13 tests):**
- ✅ Complete expertise → crafting → item flow
- ✅ Expertise requirement validation
- ✅ Multiple expertise sources
- ✅ Material management and rollback
- ✅ Recipe discovery
- ✅ Expert trait unlocking

**CraftingManager Tests (29 tests):**
- Recipe management
- Expertise validation
- Material checking
- Crafting execution
- Error handling

**InventoryManager Tests (11 tests):**
- Expert trait validation
- Expertise mapping
- Item equipment

### Running Tests

```bash
npm test
```

All tests should pass. The integration test suite validates the complete flow from expertise acquisition through crafting to item usage.

## Performance Considerations

### Optimization Strategies

1. **Expertise Caching**: O(n) → O(1) lookup via Set
2. **Lazy Cache Initialization**: Cache built on first use
3. **Automatic Cache Invalidation**: Call `invalidateExpertiseCache()` when modifying expertises

### When to Invalidate Cache

```typescript
// Adding expertise
character.selectedExpertises.push(newExpertise);
character.invalidateExpertiseCache(); // Important!

// Removing expertise
character.selectedExpertises = character.selectedExpertises.filter(...);
character.invalidateExpertiseCache(); // Important!
```

## Future Extensions

### Potential Enhancements

1. **Difficulty Checks**: Roll against difficulty for success rate
2. **Quality Tiers**: Better rolls create higher quality items
3. **Expertise Levels**: Rank 2+ expertises unlock advanced recipes
4. **Crafting Time**: Real-time crafting with completion timers
5. **Critical Crafting**: Chance for exceptional results
6. **Crafting Failure**: Partial material loss on failed attempts
7. **Recipe Discovery**: Learn recipes through experimentation
8. **Batch Crafting**: Craft multiple items at once

### Extension Points

```typescript
// Add custom recipes
character.crafting.addRecipe({
  id: 'custom-recipe',
  name: 'Custom Item',
  // ... recipe properties
});

// Hook into crafting events
const result = character.crafting.craftItem('recipe-id');
if (result.success) {
  // Trigger animations, sound effects, etc.
}
```

## API Reference

### Character

```typescript
class Character {
  selectedExpertises: ExpertiseSource[];
  
  hasExpertise(expertiseName: string): boolean;
  getExpertiseRank(expertiseName: string): number;
  getExpertiseSkills(): string[];
  invalidateExpertiseCache(): void;
  
  get crafting(): CraftingManager;
  get inventory(): InventoryManager;
}
```

### CraftingManager

```typescript
class CraftingManager {
  addRecipe(recipe: Recipe): void;
  getAllRecipes(): Recipe[];
  getAvailableRecipes(): Recipe[];
  getRecipesByCategory(category: RecipeCategory): Recipe[];
  getRecipe(recipeId: string): Recipe | undefined;
  
  canCraft(recipeId: string): { canCraft: boolean; reason?: string };
  craftItem(recipeId: string): CraftingResult;
  hasMaterials(recipeId: string): boolean;
  getMissingMaterials(recipeId: string): MaterialRequirement[];
}
```

### InventoryManager

```typescript
class InventoryManager {
  addItem(itemId: string, quantity: number): boolean;
  removeItem(itemId: string, quantity: number): boolean;
  getItemQuantity(itemId: string): number;
  equipItem(itemId: string): boolean;
  getEquippedItem(slot: string): InventoryItem | undefined;
  
  canUseExpertTraits(itemId: string): { canUse: boolean; missingExpertises: string[] };
}
```

## Troubleshooting

### Common Issues

**Recipe not showing up:**
- Check character has required expertise
- Verify expertise name matches exactly
- Use `getAllRecipes()` to see all recipes

**Materials not consuming:**
- Check item IDs match exactly (case-sensitive)
- Verify quantity available before crafting
- Check `getMissingMaterials()` for details

**Expert traits always locked:**
- Verify character has the correct expertise
- Check expertise mapping for weapon/armor type
- Ensure item has `expertTraits` array defined

**Cache not updating:**
- Call `invalidateExpertiseCache()` after modifying expertises
- Cache rebuilds automatically on next `hasExpertise()` call

## Contributing

When extending this system:

1. ✅ Add tests for new features
2. ✅ Update JSDoc comments
3. ✅ Document new recipe types
4. ✅ Maintain expertise mappings
5. ✅ Preserve backwards compatibility

---

**Last Updated**: January 2, 2026  
**Version**: 1.0.0  
**Test Coverage**: 253/253 tests passing
