import { Character } from '../character';
import { CraftingManager, Recipe, CraftingResult } from './craftingManager';
import { ExpertiseSourceHelper } from '../expertises/expertiseSource';

describe('CraftingManager', () => {
  let character: Character;
  let craftingManager: CraftingManager;

  beforeEach(() => {
    character = new Character();
    character.name = 'Test Crafter';
    craftingManager = character.crafting;
  });

  describe('Recipe Management', () => {
    it('should initialize with default recipes', () => {
      const recipes = craftingManager.getAllRecipes();
      expect(recipes.length).toBeGreaterThan(0);
    });

    it('should get all recipes', () => {
      const recipes = craftingManager.getAllRecipes();
      expect(Array.isArray(recipes)).toBe(true);
    });

    it('should get recipes by category', () => {
      const weaponRecipes = craftingManager.getRecipesByCategory('weapon');
      expect(weaponRecipes.every(r => r.category === 'weapon')).toBe(true);
    });

    it('should get specific recipe by ID', () => {
      const recipe = craftingManager.getRecipe('craft-iron-sword');
      expect(recipe).toBeDefined();
      expect(recipe?.name).toBe('Iron Sword');
    });

    it('should add custom recipe', () => {
      const customRecipe: Recipe = {
        id: 'custom-recipe',
        name: 'Custom Item',
        description: 'A custom crafted item',
        requiredExpertise: 'Weapon Crafting',
        materials: [{ itemId: 'iron-ingot', quantity: 1 }],
        resultItemId: 'custom-item',
        resultQuantity: 1,
        difficulty: 'easy',
        category: 'weapon'
      };

      craftingManager.addRecipe(customRecipe);
      const retrieved = craftingManager.getRecipe('custom-recipe');
      expect(retrieved).toEqual(customRecipe);
    });
  });

  describe('Available Recipes (Expertise-based)', () => {
    it('should return no available recipes when character has no expertises', () => {
      const available = craftingManager.getAvailableRecipes();
      expect(available.length).toBe(0);
    });

    it('should return recipes matching character expertises', () => {
      character.selectedExpertises = [
        ExpertiseSourceHelper.create('Weapon Crafting', 'culture')
      ];

      const available = craftingManager.getAvailableRecipes();
      expect(available.length).toBeGreaterThan(0);
      expect(available.every(r => r.requiredExpertise === 'Weapon Crafting')).toBe(true);
    });

    it('should return multiple recipe types when character has multiple expertises', () => {
      character.selectedExpertises = [
        ExpertiseSourceHelper.create('Weapon Crafting', 'culture'),
        ExpertiseSourceHelper.create('Armor Crafting', 'talent', 'talent-1')
      ];

      const available = craftingManager.getAvailableRecipes();
      const hasWeaponRecipes = available.some(r => r.requiredExpertise === 'Weapon Crafting');
      const hasArmorRecipes = available.some(r => r.requiredExpertise === 'Armor Crafting');
      
      expect(hasWeaponRecipes).toBe(true);
      expect(hasArmorRecipes).toBe(true);
    });
  });

  describe('Crafting Validation (canCraft)', () => {
    beforeEach(() => {
      character.selectedExpertises = [
        ExpertiseSourceHelper.create('Weapon Crafting', 'culture')
      ];
    });

    it('should fail when recipe does not exist', () => {
      const result = craftingManager.canCraft('non-existent-recipe');
      expect(result.canCraft).toBe(false);
      expect(result.reason).toBe('Recipe not found');
    });

    it('should fail when character lacks required expertise', () => {
      character.selectedExpertises = []; // Remove expertise
      const result = craftingManager.canCraft('craft-iron-sword');
      
      expect(result.canCraft).toBe(false);
      expect(result.reason).toContain('Requires');
      expect(result.reason).toContain('Weapon Crafting');
    });

    it('should fail when character lacks materials', () => {
      const result = craftingManager.canCraft('craft-iron-sword');
      
      expect(result.canCraft).toBe(false);
      expect(result.reason).toContain('Insufficient materials');
    });

    it('should succeed when character has expertise and materials', () => {
      // Add required materials
      character.inventory.addItem('iron-ingot', 3);
      character.inventory.addItem('leather-strip', 1);
      
      const result = craftingManager.canCraft('craft-iron-sword');
      
      expect(result.canCraft).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should fail when materials are insufficient even if some exist', () => {
      character.inventory.addItem('iron-ingot', 2); // Need 3
      character.inventory.addItem('leather-strip', 1);
      
      const result = craftingManager.canCraft('craft-iron-sword');
      
      expect(result.canCraft).toBe(false);
      expect(result.reason).toContain('Insufficient materials');
      expect(result.reason).toContain('iron-ingot');
    });
  });

  describe('Material Checking', () => {
    it('should correctly identify missing materials', () => {
      character.inventory.addItem('iron-ingot', 1); // Need 3
      
      const missing = craftingManager.getMissingMaterials('craft-iron-sword');
      
      expect(missing.length).toBeGreaterThan(0);
      expect(missing.some(m => m.itemId === 'iron-ingot' && m.quantity === 2)).toBe(true);
    });

    it('should return empty array when all materials are available', () => {
      character.inventory.addItem('iron-ingot', 3);
      character.inventory.addItem('leather-strip', 1);
      
      const missing = craftingManager.getMissingMaterials('craft-iron-sword');
      
      expect(missing.length).toBe(0);
    });

    it('should check if character has all materials', () => {
      expect(craftingManager.hasMaterials('craft-iron-sword')).toBe(false);
      
      character.inventory.addItem('iron-ingot', 3);
      character.inventory.addItem('leather-strip', 1);
      
      expect(craftingManager.hasMaterials('craft-iron-sword')).toBe(true);
    });
  });

  describe('Item Crafting (craftItem)', () => {
    beforeEach(() => {
      character.selectedExpertises = [
        ExpertiseSourceHelper.create('Weapon Crafting', 'culture')
      ];
      character.inventory.addItem('iron-ingot', 3);
      character.inventory.addItem('leather-strip', 1);
    });

    it('should successfully craft item when requirements met', () => {
      const result = craftingManager.craftItem('craft-iron-sword');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Successfully crafted');
      expect(result.itemId).toBe('iron-sword');
      expect(result.quantity).toBe(1);
    });

    it('should consume materials when crafting', () => {
      const ironBefore = character.inventory.getItemQuantity('iron-ingot');
      const leatherBefore = character.inventory.getItemQuantity('leather-strip');
      
      craftingManager.craftItem('craft-iron-sword');
      
      expect(character.inventory.getItemQuantity('iron-ingot')).toBe(ironBefore - 3);
      expect(character.inventory.getItemQuantity('leather-strip')).toBe(leatherBefore - 1);
    });

    it('should add crafted item to inventory', () => {
      const before = character.inventory.getItemQuantity('iron-sword');
      
      craftingManager.craftItem('craft-iron-sword');
      
      expect(character.inventory.getItemQuantity('iron-sword')).toBe(before + 1);
    });

    it('should return consumed materials in result', () => {
      const result = craftingManager.craftItem('craft-iron-sword');
      
      expect(result.materialsConsumed).toBeDefined();
      expect(result.materialsConsumed?.length).toBe(2);
      expect(result.materialsConsumed?.some(m => m.itemId === 'iron-ingot')).toBe(true);
    });

    it('should fail when expertise is missing', () => {
      character.selectedExpertises = [];
      const result = craftingManager.craftItem('craft-iron-sword');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Requires');
    });

    it('should fail when materials are missing', () => {
      character.inventory.removeItem('iron-ingot', 3);
      const result = craftingManager.craftItem('craft-iron-sword');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Insufficient materials');
    });

    it('should not consume any materials on failed craft', () => {
      character.inventory.removeItem('leather-strip', 1); // Remove one material
      
      const ironBefore = character.inventory.getItemQuantity('iron-ingot');
      const leatherBefore = character.inventory.getItemQuantity('leather-strip');
      
      craftingManager.craftItem('craft-iron-sword');
      
      expect(character.inventory.getItemQuantity('iron-ingot')).toBe(ironBefore);
      expect(character.inventory.getItemQuantity('leather-strip')).toBe(leatherBefore);
    });
  });

  describe('Difficulty System', () => {
    it('should return correct DC for difficulty levels', () => {
      expect(craftingManager.getDifficultyDC('trivial')).toBe(5);
      expect(craftingManager.getDifficultyDC('easy')).toBe(10);
      expect(craftingManager.getDifficultyDC('moderate')).toBe(15);
      expect(craftingManager.getDifficultyDC('hard')).toBe(20);
      expect(craftingManager.getDifficultyDC('very-hard')).toBe(25);
      expect(craftingManager.getDifficultyDC('masterwork')).toBe(30);
    });

    it('should include difficulty check in craft result', () => {
      character.selectedExpertises = [
        ExpertiseSourceHelper.create('Weapon Crafting', 'culture')
      ];
      character.inventory.addItem('iron-ingot', 3);
      character.inventory.addItem('leather-strip', 1);
      
      const result = craftingManager.craftItem('craft-iron-sword');
      
      expect(result.difficultyCheck).toBeDefined();
      expect(result.difficultyCheck?.required).toBe('easy');
      expect(result.difficultyCheck?.passed).toBe(true);
    });
  });

  describe('Multiple Crafting Operations', () => {
    it('should allow crafting multiple items if materials available', () => {
      character.selectedExpertises = [
        ExpertiseSourceHelper.create('Weapon Crafting', 'culture')
      ];
      character.inventory.addItem('iron-ingot', 6);
      character.inventory.addItem('leather-strip', 2);
      
      const result1 = craftingManager.craftItem('craft-iron-sword');
      const result2 = craftingManager.craftItem('craft-iron-sword');
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      // Non-stackable items get unique IDs (iron-sword, iron-sword-1)
      expect(character.inventory.getItem('iron-sword')).toBeDefined();
      expect(character.inventory.getItem('iron-sword-1')).toBeDefined();
    });

    it('should fail second craft when materials depleted', () => {
      character.selectedExpertises = [
        ExpertiseSourceHelper.create('Weapon Crafting', 'culture')
      ];
      character.inventory.addItem('iron-ingot', 3);
      character.inventory.addItem('leather-strip', 1);
      
      const result1 = craftingManager.craftItem('craft-iron-sword');
      const result2 = craftingManager.craftItem('craft-iron-sword');
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(false);
      expect(result2.message).toContain('Insufficient materials');
    });
  });

  describe('Different Recipe Categories', () => {
    it('should craft armor with Armor Crafting expertise', () => {
      character.selectedExpertises = [
        ExpertiseSourceHelper.create('Armor Crafting', 'talent', 'talent-1')
      ];
      character.inventory.addItem('leather', 5);
      character.inventory.addItem('thread', 3);
      
      const result = craftingManager.craftItem('craft-leather-armor');
      
      expect(result.success).toBe(true);
      expect(result.itemId).toBe('leather-armor');
    });

    it('should craft fabrials with Fabrial Crafting expertise', () => {
      character.selectedExpertises = [
        ExpertiseSourceHelper.create('Fabrial Crafting', 'gm')
      ];
      character.inventory.addItem('gemstone-ruby', 1);
      character.inventory.addItem('metal-housing', 1);
      character.inventory.addItem('copper-wire', 2);
      
      const result = craftingManager.craftItem('craft-heating-fabrial');
      
      expect(result.success).toBe(true);
      expect(result.itemId).toBe('heating-fabrial');
    });
  });
});
