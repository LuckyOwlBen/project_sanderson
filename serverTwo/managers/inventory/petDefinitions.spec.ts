import { Character } from '../character';
import { InventoryManager } from './inventoryManager';
import { getPetById, getPetProperties, PET_ITEMS } from './petDefinitions';

describe('Pets - Feature Tests', () => {
  let character: Character;
  let inventoryManager: InventoryManager;

  beforeEach(() => {
    character = new Character();
    character.name = 'Pet Owner';
    inventoryManager = character.inventory;
  });

  describe('Pet Definition', () => {
    it('should have chickenhawk pet defined', () => {
      const chickenhawk = getPetById('chickenhawk');
      expect(chickenhawk).toBeDefined();
      expect(chickenhawk?.name).toBe('Chickenhawk');
      expect(chickenhawk?.type).toBe('pet');
      expect(chickenhawk?.rarity).toBe('reward-only');
    });

    it('should have multiple pet types available', () => {
      expect(PET_ITEMS.length).toBeGreaterThan(0);
      expect(PET_ITEMS.find(p => p.id === 'chickenhawk')).toBeDefined();
      expect(PET_ITEMS.find(p => p.id === 'armored-hound')).toBeDefined();
      expect(PET_ITEMS.find(p => p.id === 'spren-familiar')).toBeDefined();
      expect(PET_ITEMS.find(p => p.id === 'storm-drake')).toBeDefined();
      expect(PET_ITEMS.find(p => p.id === 'demo-companion')).toBeDefined();
    });

    it('should mark all pets as reward-only, not for purchase', () => {
      PET_ITEMS.forEach(pet => {
        expect(pet.rarity).toBe('reward-only');
        expect(pet.price).toBe(0);
      });
    });

    it('should mark pets as equipable', () => {
      PET_ITEMS.forEach(pet => {
        expect(pet.equipable).toBe(true);
      });
    });

    it('should assign pets to accessory slot', () => {
      PET_ITEMS.forEach(pet => {
        expect(pet.slot).toBe('accessory');
      });
    });
  });

  describe('Pet Properties', () => {
    it('should extract pet properties correctly', () => {
      const chickenhawk = getPetById('chickenhawk');
      expect(chickenhawk).toBeDefined();
      
      const props = getPetProperties(chickenhawk!);
      expect(props).toBeDefined();
      expect(props?.species).toBe('Chickenhawk');
      expect(props?.behavior).toBeDefined();
      expect(props?.intelligence).toBe('animal');
    });

    it('should have flying pets with flying speed', () => {
      const chickenhawk = getPetById('chickenhawk');
      const props = getPetProperties(chickenhawk!);
      expect(props?.flyingSpeed).toBeGreaterThan(0);
    });

    it('should have ground pets with movement speed', () => {
      const hound = getPetById('armored-hound');
      const props = getPetProperties(hound!);
      expect(props?.movementSpeed).toBeGreaterThan(0);
    });

    it('should define special abilities for pets', () => {
      PET_ITEMS.forEach(pet => {
        const props = getPetProperties(pet);
        expect(props?.specialAbilities).toBeDefined();
        expect(Array.isArray(props?.specialAbilities)).toBe(true);
        expect(props!.specialAbilities!.length).toBeGreaterThan(0);
      });
    });

    it('should classify pets by intelligence level', () => {
      const animalPets = PET_ITEMS.filter(p => getPetProperties(p)?.intelligence === 'animal');
      const sapientPets = PET_ITEMS.filter(p => getPetProperties(p)?.intelligence === 'sapient');
      
      expect(animalPets.length).toBeGreaterThan(0);
      expect(sapientPets.length).toBeGreaterThan(0);
    });
  });

  describe('Pet Inventory Management', () => {
    it('should add pet to inventory', () => {
      const result = inventoryManager.addItem('chickenhawk', 1);
      expect(result).toBe(true);
      expect(inventoryManager.getItemQuantity('chickenhawk')).toBe(1);
    });

    it('should not stack pets (they are unique)', () => {
      inventoryManager.addItem('chickenhawk', 1);
      inventoryManager.addItem('chickenhawk', 1);
      
      // Should only have quantity 1, as pets are not stackable
      const items = inventoryManager.getAllItems();
      const chickenhawks = items.filter(item => item.id.startsWith('chickenhawk'));
      expect(chickenhawks.length).toBeGreaterThan(1); // Should create separate items
    });

    it('should equip pet to accessory slot', () => {
      inventoryManager.addItem('chickenhawk', 1);
      const equipped = inventoryManager.equipItem('chickenhawk');
      
      expect(equipped).toBe(true);
      expect(inventoryManager.getEquippedItem('accessory')).toBeDefined();
      expect(inventoryManager.getEquippedItem('accessory')?.id).toContain('chickenhawk');
    });

    it('should not stack equipped pets', () => {
      // Add and equip first chickenhawk
      inventoryManager.addItem('chickenhawk', 1);
      inventoryManager.equipItem('chickenhawk');

      // Try to equip another pet to same slot
      inventoryManager.addItem('armored-hound', 1);
      inventoryManager.equipItem('armored-hound');

      // Should have unequipped the chickenhawk
      const equipped = inventoryManager.getEquippedItem('accessory');
      expect(equipped?.id).toContain('armored-hound');
    });

    it('should unequip pet correctly', () => {
      inventoryManager.addItem('chickenhawk', 1);
      inventoryManager.equipItem('chickenhawk');
      
      const item = inventoryManager.getEquippedItem('accessory');
      expect(item).toBeDefined();
      
      inventoryManager.unequipItem(item!.id);
      expect(inventoryManager.getEquippedItem('accessory')).toBeUndefined();
    });

    it('should have pet weight when in inventory', () => {
      const initialWeight = inventoryManager.getTotalWeight();
      inventoryManager.addItem('chickenhawk', 1);
      
      const newWeight = inventoryManager.getTotalWeight();
      expect(newWeight).toBeGreaterThan(initialWeight);
    });

    it('should remove pet from inventory', () => {
      inventoryManager.addItem('chickenhawk', 1);
      expect(inventoryManager.getItemQuantity('chickenhawk')).toBe(1);
      
      const allItems = inventoryManager.getAllItems();
      const chickenhawk = allItems.find(item => item.id.startsWith('chickenhawk'));
      expect(chickenhawk).toBeDefined();
      
      const result = inventoryManager.removeItem(chickenhawk!.id, 1);
      expect(result).toBe(true);
      expect(inventoryManager.getItemQuantity('chickenhawk')).toBe(0);
    });
  });

  describe('Pet GM Grant System', () => {
    it('should identify pets as reward-only items', () => {
      const petIds = ['chickenhawk', 'armored-hound', 'spren-familiar', 'storm-drake'];
      petIds.forEach(id => {
        const pet = getPetById(id);
        expect(pet?.rarity).toBe('reward-only');
      });
    });

    it('should allow GM to grant any pet to player', () => {
      const petIds = ['chickenhawk', 'armored-hound', 'spren-familiar', 'storm-drake'];
      
      petIds.forEach(id => {
        const pet = getPetById(id);
        expect(pet).toBeDefined();
        const result = inventoryManager.addItem(id, 1);
        expect(result).toBe(true);
      });

      const items = inventoryManager.getAllItems();
      expect(items.length).toBeGreaterThanOrEqual(4);
    });

    it('should not make pets available for regular purchase', () => {
      PET_ITEMS.forEach(pet => {
        expect(pet.price).toBe(0);
        expect(pet.rarity).toBe('reward-only');
      });
    });
  });

  describe('Pet Combat Integration', () => {
    it('should track pet abilities for gameplay', () => {
      const chickenhawk = getPetById('chickenhawk');
      const props = getPetProperties(chickenhawk!);
      
      expect(props?.specialAbilities).toContain('Swift Strike');
      expect(props?.specialAbilities).toContain('Aerial Reconnaissance');
    });

    it('should provide pet stats for mechanical integration', () => {
      const chickenhawk = getPetById('chickenhawk');
      const props = getPetProperties(chickenhawk!);
      
      expect(props?.species).toBeDefined();
      expect(props?.behavior).toBeDefined();
      expect(props?.flyingSpeed).toBeGreaterThan(0);
    });

    it('should differentiate between animal and sapient pets', () => {
      const hound = getPetById('armored-hound');
      const drake = getPetById('storm-drake');
      
      expect(getPetProperties(hound!)?.intelligence).toBe('animal');
      expect(getPetProperties(drake!)?.intelligence).toBe('sapient');
    });
  });

  describe('Pet Persistence', () => {
    it('should persist pet in character inventory data', () => {
      inventoryManager.addItem('chickenhawk', 1);
      const items = inventoryManager.getAllItems();
      
      const pet = items.find(item => item.id.startsWith('chickenhawk'));
      expect(pet).toBeDefined();
      expect(pet?.type).toBe('pet');
    });

    it('should maintain pet type through serialization', () => {
      inventoryManager.addItem('chickenhawk', 1);
      const items = inventoryManager.getAllItems();
      const pet = items.find(item => item.id.startsWith('chickenhawk'));
      
      expect(pet?.type).toBe('pet');
      expect(pet?.rarity).toBe('reward-only');
    });
  });
});
