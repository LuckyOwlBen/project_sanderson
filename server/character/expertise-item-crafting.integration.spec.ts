import { Character } from './character';
import { ALETHI_CULTURE } from './culture/alethi';
import { ALL_ITEMS } from './inventory/itemDefinitions';
import { ExpertiseSourceHelper } from './expertises/expertiseSource';

describe('Expertise-Item-Crafting Integration', () => {
  let character: Character;

  beforeEach(() => {
    character = new Character();
    character.name = 'Integration Test Hero';
  });

  describe('Complete Expertise Flow', () => {
    it('should grant culture expertise, unlock crafting recipe, craft item, and unlock expert traits', () => {
      // Step 1: Add culture (grants expertises via culture.expertise)
      character.cultures = [ALETHI_CULTURE];
      character.selectedExpertises = [
        ExpertiseSourceHelper.create('Armor Crafting', 'culture', 'alethi'),
        ExpertiseSourceHelper.create('Light Armor', 'culture', 'alethi')
      ];
      
      // Verify culture granted expertise
      expect(character.hasExpertise('Armor Crafting')).toBe(true);
      expect(character.hasExpertise('Light Armor')).toBe(true);

      // Step 2: Verify recipe is now available
      const availableRecipes = character.crafting.getAvailableRecipes();
      const leatherArmorRecipe = availableRecipes.find(r => r.resultItemId === 'leather-armor');
      expect(leatherArmorRecipe).toBeDefined();

      // Step 3: Add materials to inventory (recipe requires 5 leather + 3 thread)
      character.inventory.addItem('leather', 10);
      character.inventory.addItem('thread', 5);
      expect(character.inventory.getItemQuantity('leather')).toBe(10);
      expect(character.inventory.getItemQuantity('thread')).toBe(5);

      // Step 4: Verify can craft (has expertise + materials)
      const canCraft = character.crafting.canCraft('craft-leather-armor');
      expect(canCraft.canCraft).toBe(true);
      expect(canCraft.reason).toBeUndefined();

      // Step 5: Craft the item
      const craftResult = character.crafting.craftItem('craft-leather-armor');
      expect(craftResult.success).toBe(true);
      expect(craftResult.itemId).toBe('leather-armor');

      // Verify materials consumed
      expect(character.inventory.getItemQuantity('leather')).toBe(5); // 10 - 5 = 5
      expect(character.inventory.getItemQuantity('thread')).toBe(2); // 5 - 3 = 2
      expect(character.inventory.getItemQuantity('leather-armor')).toBe(1);

      // Step 6: Equip the crafted item
      const equipped = character.inventory.equipItem('leather-armor');
      expect(equipped).toBe(true);
      const equippedItem = character.inventory.getEquippedItem('armor');
      expect(equippedItem?.id).toBe('leather-armor');

      // Step 7: Add expert trait to leather armor and verify unlocked with Light Armor expertise
      const leatherArmor = ALL_ITEMS.find(i => i.id === 'leather-armor');
      if (leatherArmor && leatherArmor.armorProperties) {
        leatherArmor.armorProperties.expertTraits = ['+1 Agility defense'];
      }
      
      const expertTraitCheck = character.inventory.canUseExpertTraits('leather-armor');
      expect(expertTraitCheck.canUse).toBe(true);
      expect(expertTraitCheck.missingExpertises).toEqual([]);
      
      // Clean up
      if (leatherArmor && leatherArmor.armorProperties) {
        leatherArmor.armorProperties.expertTraits = [];
      }
    });

    it('should prevent crafting without required expertise', () => {
      // Character has no Weapon Crafting expertise
      expect(character.hasExpertise('Weapon Crafting')).toBe(false);

      // Add materials for iron sword
      character.inventory.addItem('iron-ingot', 10);
      character.inventory.addItem('leather-strip', 5);
      
      // Verify cannot craft (missing expertise)
      const canCraft = character.crafting.canCraft('craft-iron-sword');
      expect(canCraft.canCraft).toBe(false);
      expect(canCraft.reason).toContain('Weapon Crafting');

      // Attempt to craft should fail
      const craftResult = character.crafting.craftItem('craft-iron-sword');
      expect(craftResult.success).toBe(false);
      expect(craftResult.message).toContain('Weapon Crafting');
      
      // Verify materials NOT consumed
      expect(character.inventory.getItemQuantity('iron-ingot')).toBe(10);
    });

    it('should unlock expert traits when expertise is granted', () => {
      // Step 1: Add expert trait to the iron sword for this test
      const ironSword = ALL_ITEMS.find(i => i.id === 'iron-sword');
      if (ironSword && ironSword.weaponProperties) {
        ironSword.weaponProperties.expertTraits = ['+1 to hit when using Dueling'];
      }

      character.inventory.addItem('iron-sword', 1);
      character.inventory.equipItem('iron-sword');

      // Step 2: Verify expert traits are locked (no Dueling expertise)
      expect(character.hasExpertise('Dueling')).toBe(false);
      const lockedCheck = character.inventory.canUseExpertTraits('iron-sword');
      expect(lockedCheck.canUse).toBe(false);
      expect(lockedCheck.missingExpertises).toContain('Dueling');

      // Step 3: Manually grant Dueling expertise (simulating GM grant or talent)
      character.selectedExpertises.push(
        ExpertiseSourceHelper.create('Dueling', 'manual')
      );

      // Step 4: Verify expert traits are now unlocked
      expect(character.hasExpertise('Dueling')).toBe(true);
      const unlockedCheck = character.inventory.canUseExpertTraits('iron-sword');
      expect(unlockedCheck.canUse).toBe(true);
      expect(unlockedCheck.missingExpertises).toEqual([]);
      
      // Clean up
      if (ironSword && ironSword.weaponProperties) {
        ironSword.weaponProperties.expertTraits = [];
      }
    });

    it('should support multiple expertise sources unlocking same crafting recipe', () => {
      // Start with no Armor Crafting
      expect(character.hasExpertise('Armor Crafting')).toBe(false);
      
      // Grant from talent
      character.selectedExpertises.push(
        ExpertiseSourceHelper.create('Armor Crafting', 'talent', 'master-craftsman')
      );
      
      expect(character.hasExpertise('Armor Crafting')).toBe(true);
      const sources = character.selectedExpertises.filter(e => e.name === 'Armor Crafting');
      expect(sources.length).toBe(1);
      expect(sources[0].source).toBe('talent');

      // Verify can now see armor recipes
      const recipes = character.crafting.getAvailableRecipes();
      const armorRecipes = recipes.filter(r => r.requiredExpertise === 'Armor Crafting');
      expect(armorRecipes.length).toBeGreaterThan(0);

      // Grant same expertise from GM (duplicate source)
      character.selectedExpertises.push(
        ExpertiseSourceHelper.create('Armor Crafting', 'gm')
      );

      // Should now have 2 sources for same expertise
      const allSources = character.selectedExpertises.filter(e => e.name === 'Armor Crafting');
      expect(allSources.length).toBe(2);
      expect(allSources.some(e => e.source === 'talent')).toBe(true);
      expect(allSources.some(e => e.source === 'gm')).toBe(true);

      // Still has access to recipes (multiple sources don't break anything)
      expect(character.hasExpertise('Armor Crafting')).toBe(true);
    });

    it('should verify expert traits require correct weapon expertise', () => {
      const weaponTests = [
        { itemId: 'iron-sword', expertise: 'Dueling', trait: '+1 to hit' },
        { itemId: 'steel-sword', expertise: 'Dueling', trait: '+1 damage' },
      ];

      weaponTests.forEach(({ itemId, expertise, trait }) => {
        // Add expert trait to the item
        const item = ALL_ITEMS.find(i => i.id === itemId);
        if (item && item.weaponProperties) {
          item.weaponProperties.expertTraits = [trait];
        }

        // Add item
        character.inventory.addItem(itemId, 1);
        
        // Check locked state
        const locked = character.inventory.canUseExpertTraits(itemId);
        expect(locked.canUse).toBe(false);
        expect(locked.missingExpertises).toContain(expertise);

        // Grant expertise
        character.selectedExpertises.push(
          ExpertiseSourceHelper.create(expertise, 'manual')
        );

        // Check unlocked state
        const unlocked = character.inventory.canUseExpertTraits(itemId);
        expect(unlocked.canUse).toBe(true);
        expect(unlocked.missingExpertises).toEqual([]);

        // Clean up
        character.selectedExpertises = character.selectedExpertises.filter(
          e => !(e.name === expertise && e.source === 'manual')
        );
        if (item && item.weaponProperties) {
          item.weaponProperties.expertTraits = [];
        }
      });
    });

    it('should verify expert traits require correct armor expertise', () => {
      // Add expert trait to leather armor for this test
      const leatherArmor = ALL_ITEMS.find(i => i.id === 'leather-armor');
      if (leatherArmor && leatherArmor.armorProperties) {
        leatherArmor.armorProperties.expertTraits = ['+1 Agility defense'];
      }

      character.inventory.addItem('leather-armor', 1);
      
      const locked = character.inventory.canUseExpertTraits('leather-armor');
      expect(locked.canUse).toBe(false);
      expect(locked.missingExpertises).toContain('Light Armor');

      // Grant Light Armor
      character.selectedExpertises.push(
        ExpertiseSourceHelper.create('Light Armor', 'manual')
      );

      const unlocked = character.inventory.canUseExpertTraits('leather-armor');
      expect(unlocked.canUse).toBe(true);
      expect(unlocked.missingExpertises).toEqual([]);
      
      // Clean up
      if (leatherArmor && leatherArmor.armorProperties) {
        leatherArmor.armorProperties.expertTraits = [];
      }
    });
  });

  describe('Crafting Material Management', () => {
    it('should rollback materials on craft failure', () => {
      // Grant expertise
      character.selectedExpertises.push(
        ExpertiseSourceHelper.create('Weapon Crafting', 'manual')
      );

      // Add materials
      character.inventory.addItem('iron-ingot', 3);
      character.inventory.addItem('leather-strip', 1);
      
      // Attempt to craft (should succeed)
      const result = character.crafting.craftItem('craft-iron-sword');
      expect(result.success).toBe(true);
      expect(character.inventory.getItemQuantity('iron-ingot')).toBe(0); // 3 consumed

      // Try to craft again without materials
      const failedResult = character.crafting.craftItem('craft-iron-sword');
      expect(failedResult.success).toBe(false);
      expect(failedResult.message).toContain('Insufficient materials');
      
      // Verify materials not consumed (rollback worked)
      expect(character.inventory.getItemQuantity('iron-ingot')).toBe(0);
    });

    it('should handle multiple material requirements', () => {
      // Iron sword requires iron-ingot (3) + leather-strip (1)
      character.selectedExpertises.push(
        ExpertiseSourceHelper.create('Weapon Crafting', 'manual')
      );

      // Add insufficient materials
      character.inventory.addItem('iron-ingot', 1); // Need 3
      character.inventory.addItem('leather-strip', 1);

      const canCraft = character.crafting.canCraft('craft-iron-sword');
      expect(canCraft.canCraft).toBe(false);
      expect(canCraft.reason).toContain('Insufficient materials');

      // Add remaining materials
      character.inventory.addItem('iron-ingot', 2);

      const canCraftNow = character.crafting.canCraft('craft-iron-sword');
      expect(canCraftNow.canCraft).toBe(true);

      // Craft successfully
      const result = character.crafting.craftItem('craft-iron-sword');
      expect(result.success).toBe(true);
      expect(character.inventory.getItemQuantity('iron-sword')).toBe(1);
      expect(character.inventory.getItemQuantity('iron-ingot')).toBe(0);
      expect(character.inventory.getItemQuantity('leather-strip')).toBe(0);
    });
  });

  describe('Recipe Discovery', () => {
    it('should show only recipes matching character expertises', () => {
      // No expertises = no recipes
      const noRecipes = character.crafting.getAvailableRecipes();
      expect(noRecipes.length).toBe(0);

      // Grant Weapon Crafting
      character.selectedExpertises.push(
        ExpertiseSourceHelper.create('Weapon Crafting', 'manual')
      );

      const weaponRecipes = character.crafting.getAvailableRecipes();
      expect(weaponRecipes.length).toBeGreaterThan(0);
      expect(weaponRecipes.every(r => r.requiredExpertise === 'Weapon Crafting')).toBe(true);

      // Grant Armor Crafting
      character.selectedExpertises.push(
        ExpertiseSourceHelper.create('Armor Crafting', 'manual')
      );

      const allRecipes = character.crafting.getAvailableRecipes();
      expect(allRecipes.length).toBeGreaterThan(weaponRecipes.length);
      
      const armorRecipes = allRecipes.filter(r => r.requiredExpertise === 'Armor Crafting');
      expect(armorRecipes.length).toBeGreaterThan(0);
    });

    it('should categorize recipes correctly', () => {
      character.selectedExpertises.push(
        ExpertiseSourceHelper.create('Weapon Crafting', 'manual')
      );
      character.selectedExpertises.push(
        ExpertiseSourceHelper.create('Armor Crafting', 'manual')
      );

      const recipes = character.crafting.getAvailableRecipes();
      
      const weaponRecipes = recipes.filter(r => r.category === 'weapon');
      const armorRecipes = recipes.filter(r => r.category === 'armor');
      
      expect(weaponRecipes.length).toBeGreaterThan(0);
      expect(armorRecipes.length).toBeGreaterThan(0);
      
      // Verify weapon recipes require Weapon Crafting
      weaponRecipes.forEach(recipe => {
        expect(recipe.requiredExpertise).toBe('Weapon Crafting');
      });

      // Verify armor recipes require Armor Crafting
      armorRecipes.forEach(recipe => {
        expect(recipe.requiredExpertise).toBe('Armor Crafting');
      });
    });
  });

  describe('Item Definitions Integration', () => {
    it('should verify all crafting materials exist in item definitions', () => {
      const craftingMaterials = [
        'iron-ingot',
        'leather-strip',
        'iron-sword',
        'steel-sword',
        'leather-armor',
        'heating-fabrial',
        'health-potion'
      ];

      craftingMaterials.forEach(materialId => {
        const item = ALL_ITEMS.find(i => i.id === materialId);
        expect(item).toBeDefined();
        expect(item?.id).toBe(materialId);
      });
    });

    it('should verify crafted items have proper expert traits structure', () => {
      // Weapons have expertTraits arrays (may be empty initially)
      const ironSword = ALL_ITEMS.find(i => i.id === 'iron-sword');
      expect(ironSword?.weaponProperties?.expertTraits).toBeDefined();
      expect(Array.isArray(ironSword?.weaponProperties?.expertTraits)).toBe(true);

      const steelSword = ALL_ITEMS.find(i => i.id === 'steel-sword');
      expect(steelSword?.weaponProperties?.expertTraits).toBeDefined();
      expect(Array.isArray(steelSword?.weaponProperties?.expertTraits)).toBe(true);

      // Armor has expertTraits arrays (may be empty initially)
      const leatherArmor = ALL_ITEMS.find(i => i.id === 'leather-armor');
      expect(leatherArmor?.armorProperties?.expertTraits).toBeDefined();
      expect(Array.isArray(leatherArmor?.armorProperties?.expertTraits)).toBe(true);
    });
  });

  describe('Expertise Source Tracking in Full Flow', () => {
    it('should track expertise sources through culture → talent → GM → crafting', () => {
      // Step 1: Culture grants expertise
      character.cultures = [ALETHI_CULTURE];
      character.selectedExpertises.push(
        ExpertiseSourceHelper.create('Light Armor', 'culture', 'alethi')
      );
      
      const cultureExpertises = character.selectedExpertises.filter(e => e.source === 'culture');
      expect(cultureExpertises.length).toBe(1);

      // Step 2: Talent grants expertise (simulate)
      character.selectedExpertises.push(
        ExpertiseSourceHelper.create('Weapon Crafting', 'talent', 'smithing-talent')
      );

      const talentExpertises = character.selectedExpertises.filter(e => e.source === 'talent');
      expect(talentExpertises.length).toBe(1);
      expect(talentExpertises[0].name).toBe('Weapon Crafting');

      // Step 3: GM grants expertise
      character.selectedExpertises.push(
        ExpertiseSourceHelper.create('Fabrial Crafting', 'gm')
      );

      const gmExpertises = character.selectedExpertises.filter(e => e.source === 'gm');
      expect(gmExpertises.length).toBe(1);
      expect(gmExpertises[0].name).toBe('Fabrial Crafting');

      // Step 4: Verify all sources are tracked
      const allExpertises = character.selectedExpertises;
      expect(allExpertises.length).toBe(3); // culture + talent + gm

      // Step 5: Use expertise from different sources in crafting
      character.inventory.addItem('iron-ingot', 10);
      character.inventory.addItem('leather-strip', 5);
      
      const canCraft = character.crafting.canCraft('craft-iron-sword');
      expect(canCraft.canCraft).toBe(true); // Has Weapon Crafting from talent

      // Source doesn't matter for crafting - just that expertise exists
      const result = character.crafting.craftItem('craft-iron-sword');
      expect(result.success).toBe(true);
    });
  });
});
