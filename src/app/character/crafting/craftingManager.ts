import { Character } from '../character';
import { InventoryManager } from '../inventory/inventoryManager';

/**
 * Difficulty levels for crafting recipes
 */
export type CraftingDifficulty = 'trivial' | 'easy' | 'moderate' | 'hard' | 'very-hard' | 'masterwork';

/**
 * Material requirement for a recipe
 */
export interface MaterialRequirement {
  itemId: string;
  quantity: number;
}

/**
 * Recipe for crafting an item
 */
export interface Recipe {
  id: string;
  name: string;
  description: string;
  requiredExpertise: string; // Must have this expertise to craft
  materials: MaterialRequirement[];
  resultItemId: string;
  resultQuantity: number;
  difficulty: CraftingDifficulty;
  craftingTime?: string; // e.g., "1 hour", "2 days"
  category: 'weapon' | 'armor' | 'utility' | 'consumable' | 'fabrial' | 'equipment';
}

/**
 * Result of a crafting attempt
 */
export interface CraftingResult {
  success: boolean;
  message: string;
  itemId?: string;
  quantity?: number;
  materialsConsumed?: MaterialRequirement[];
  expertiseUsed?: string;
  difficultyCheck?: {
    required: CraftingDifficulty;
    passed: boolean;
  };
}

/**
 * Manages crafting recipes and item creation
 * 
 * The CraftingManager handles:
 * - Recipe storage and retrieval
 * - Expertise validation for crafting
 * - Material requirement checking
 * - Item creation with material consumption
 * - Rollback on crafting failures
 * 
 * Flow: Character with expertise + materials → canCraft() check → craftItem() → new item created
 */
export class CraftingManager {
  private recipes: Map<string, Recipe> = new Map();
  private character: Character;

  /**
   * Create a new CraftingManager for a character
   * @param character - The character who will use this crafting manager
   */
  constructor(character: Character) {
    this.character = character;
    this.initializeRecipes();
  }

  /**
   * Initialize default recipes
   */
  private initializeRecipes(): void {
    // Weapon crafting recipes
    this.addRecipe({
      id: 'craft-iron-sword',
      name: 'Iron Sword',
      description: 'A basic iron sword suitable for combat',
      requiredExpertise: 'Weapon Crafting',
      materials: [
        { itemId: 'iron-ingot', quantity: 3 },
        { itemId: 'leather-strip', quantity: 1 }
      ],
      resultItemId: 'iron-sword',
      resultQuantity: 1,
      difficulty: 'easy',
      craftingTime: '4 hours',
      category: 'weapon'
    });

    this.addRecipe({
      id: 'craft-steel-sword',
      name: 'Steel Sword',
      description: 'A well-crafted steel sword',
      requiredExpertise: 'Weapon Crafting',
      materials: [
        { itemId: 'steel-ingot', quantity: 3 },
        { itemId: 'leather-strip', quantity: 2 }
      ],
      resultItemId: 'steel-sword',
      resultQuantity: 1,
      difficulty: 'moderate',
      craftingTime: '6 hours',
      category: 'weapon'
    });

    // Armor crafting recipes
    this.addRecipe({
      id: 'craft-leather-armor',
      name: 'Leather Armor',
      description: 'Basic leather armor for protection',
      requiredExpertise: 'Armor Crafting',
      materials: [
        { itemId: 'leather', quantity: 5 },
        { itemId: 'thread', quantity: 3 }
      ],
      resultItemId: 'leather-armor',
      resultQuantity: 1,
      difficulty: 'easy',
      craftingTime: '8 hours',
      category: 'armor'
    });

    // Fabrial crafting recipes
    this.addRecipe({
      id: 'craft-heating-fabrial',
      name: 'Heating Fabrial',
      description: 'A fabrial that produces warmth',
      requiredExpertise: 'Fabrial Crafting',
      materials: [
        { itemId: 'gemstone-ruby', quantity: 1 },
        { itemId: 'metal-housing', quantity: 1 },
        { itemId: 'copper-wire', quantity: 2 }
      ],
      resultItemId: 'heating-fabrial',
      resultQuantity: 1,
      difficulty: 'hard',
      craftingTime: '12 hours',
      category: 'fabrial'
    });

    // Utility crafting recipes
    this.addRecipe({
      id: 'craft-health-potion',
      name: 'Health Potion',
      description: 'A potion that restores health',
      requiredExpertise: 'Equipment Crafting',
      materials: [
        { itemId: 'medicinal-herbs', quantity: 2 },
        { itemId: 'water-flask', quantity: 1 }
      ],
      resultItemId: 'health-potion',
      resultQuantity: 1,
      difficulty: 'moderate',
      craftingTime: '2 hours',
      category: 'consumable'
    });
  }

  /**
   * Add a recipe to the crafting system
   * @param recipe - The recipe to add to the available recipes
   */
  addRecipe(recipe: Recipe): void {
    this.recipes.set(recipe.id, recipe);
  }

  /**
   * Get all available recipes
   * Note: This returns ALL recipes, not just those the character can craft
   * Use getAvailableRecipes() to get only craftable recipes
   * @returns Array of all recipes in the system
   */
  getAllRecipes(): Recipe[] {
    return Array.from(this.recipes.values());
  }

  /**
   * Get recipes the character can craft (has required expertise)
   * Does NOT check materials - only expertise
   * @returns Array of recipes the character has expertise to craft
   */
  getAvailableRecipes(): Recipe[] {
    return this.getAllRecipes().filter(recipe => 
      this.character.hasExpertise(recipe.requiredExpertise)
    );
  }

  /**
   * Get recipes by category
   * @param category - The category to filter by (weapon, armor, utility, etc.)
   * @returns Array of recipes matching the specified category
   */
  getRecipesByCategory(category: Recipe['category']): Recipe[] {
    return this.getAllRecipes().filter(recipe => recipe.category === category);
  }

  /**
   * Get a specific recipe by ID
   * @param recipeId - The unique identifier for the recipe
   * @returns The recipe if found, undefined otherwise
   */
  getRecipe(recipeId: string): Recipe | undefined {
    return this.recipes.get(recipeId);
  }

  /**
   * Check if character can craft a recipe
   */
  canCraft(recipeId: string): { canCraft: boolean; reason?: string } {
    const recipe = this.recipes.get(recipeId);
    
    if (!recipe) {
      return { canCraft: false, reason: 'Recipe not found' };
    }

    // Check expertise requirement
    if (!this.character.hasExpertise(recipe.requiredExpertise)) {
      return { 
        canCraft: false, 
        reason: `Requires ${recipe.requiredExpertise} expertise` 
      };
    }

    // Check material availability
    for (const material of recipe.materials) {
      const available = this.character.inventory.getItemQuantity(material.itemId);
      if (available < material.quantity) {
        return { 
          canCraft: false, 
          reason: `Insufficient materials: need ${material.quantity} ${material.itemId}, have ${available}` 
        };
      }
    }

    return { canCraft: true };
  }

  /**
   * Craft an item from a recipe
   * 
   * Process:
   * 1. Validates recipe exists
   * 2. Checks expertise and materials via canCraft()
   * 3. Consumes materials from inventory
   * 4. Adds crafted item to inventory
   * 5. Rolls back materials if any step fails
   * 
   * @param recipeId - The ID of the recipe to craft
   * @returns CraftingResult with success status, message, and crafted item details
   * @example
   * const result = craftingManager.craftItem('craft-iron-sword');
   * if (result.success) {
   *   console.log(`Crafted ${result.quantity}x ${result.itemId}`);
   * }
   */
  craftItem(recipeId: string): CraftingResult {
    const recipe = this.recipes.get(recipeId);
    
    if (!recipe) {
      return {
        success: false,
        message: 'Recipe not found'
      };
    }

    // Validate crafting ability
    const validation = this.canCraft(recipeId);
    if (!validation.canCraft) {
      return {
        success: false,
        message: validation.reason || 'Cannot craft this item'
      };
    }

    // Consume materials
    const consumedMaterials: MaterialRequirement[] = [];
    for (const material of recipe.materials) {
      const removed = this.character.inventory.removeItem(material.itemId, material.quantity);
      if (removed) {
        consumedMaterials.push(material);
      } else {
        // Rollback consumed materials if any step fails
        for (const consumed of consumedMaterials) {
          this.character.inventory.addItem(consumed.itemId, consumed.quantity);
        }
        return {
          success: false,
          message: `Failed to consume ${material.itemId}`
        };
      }
    }

    // Add crafted item to inventory
    this.character.inventory.addItem(recipe.resultItemId, recipe.resultQuantity);

    return {
      success: true,
      message: `Successfully crafted ${recipe.name}!`,
      itemId: recipe.resultItemId,
      quantity: recipe.resultQuantity,
      materialsConsumed: consumedMaterials,
      expertiseUsed: recipe.requiredExpertise,
      difficultyCheck: {
        required: recipe.difficulty,
        passed: true
      }
    };
  }

  /**
   * Get difficulty check DC (for future skill check integration)
   */
  getDifficultyDC(difficulty: CraftingDifficulty): number {
    const dcMap: Record<CraftingDifficulty, number> = {
      'trivial': 5,
      'easy': 10,
      'moderate': 15,
      'hard': 20,
      'very-hard': 25,
      'masterwork': 30
    };
    return dcMap[difficulty];
  }

  /**
   * Check if character has materials for a recipe
   */
  hasMaterials(recipeId: string): boolean {
    const recipe = this.recipes.get(recipeId);
    if (!recipe) return false;

    for (const material of recipe.materials) {
      const available = this.character.inventory.getItemQuantity(material.itemId);
      if (available < material.quantity) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get missing materials for a recipe
   */
  getMissingMaterials(recipeId: string): MaterialRequirement[] {
    const recipe = this.recipes.get(recipeId);
    if (!recipe) return [];

    const missing: MaterialRequirement[] = [];
    for (const material of recipe.materials) {
      const available = this.character.inventory.getItemQuantity(material.itemId);
      if (available < material.quantity) {
        missing.push({
          itemId: material.itemId,
          quantity: material.quantity - available
        });
      }
    }

    return missing;
  }
}
