import { InventoryItem, ItemType, ItemRarity, StartingKit } from './inventoryItem';
import { BonusType } from '../bonuses/bonusModule';
import { PET_ITEMS } from './petDefinitions';

// ===== WEAPONS =====

export const LIGHT_WEAPONS: InventoryItem[] = [
  {
    id: 'javelin',
    name: 'Javelin',
    type: 'weapon',
    quantity: 1,
    weight: 2,
    price: 20,
    rarity: 'common',
    description: 'A light throwing spear effective at range.',
    equipable: true,
    stackable: false,
    slot: 'mainHand',
    weaponProperties: {
      skill: 'light-weaponry',
      damage: '1d6',
      damageType: 'keen',
      range: 'Melee',
      traits: ['Thrown[30/120]'],
      expertTraits: ['Indirect']
    }
  },
  {
    id: 'knife',
    name: 'Knife',
    type: 'weapon',
    quantity: 1,
    weight: 1,
    price: 8,
    rarity: 'common',
    description: 'A small, easily concealed blade.',
    equipable: true,
    stackable: false,
    slot: 'mainHand',
    weaponProperties: {
      skill: 'light-weaponry',
      damage: '1d4',
      damageType: 'keen',
      range: 'Melee',
      traits: ['Discreet'],
      expertTraits: ['Offhand', 'Thrown[20/60]']
    }
  },
  {
    id: 'mace',
    name: 'Mace',
    type: 'weapon',
    quantity: 1,
    weight: 3,
    price: 20,
    rarity: 'common',
    description: 'A weighted club for crushing blows.',
    equipable: true,
    stackable: false,
    slot: 'mainHand',
    weaponProperties: {
      skill: 'light-weaponry',
      damage: '1d6',
      damageType: 'impact',
      range: 'Melee',
      traits: [],
      expertTraits: ['Momentum']
    }
  },
  {
    id: 'rapier',
    name: 'Rapier',
    type: 'weapon',
    quantity: 1,
    weight: 2,
    price: 100,
    rarity: 'common',
    description: 'An elegant thrusting sword favored by duelists.',
    equipable: true,
    stackable: false,
    slot: 'mainHand',
    weaponProperties: {
      skill: 'light-weaponry',
      damage: '1d6',
      damageType: 'keen',
      range: 'Melee',
      traits: ['Quickdraw'],
      expertTraits: ['Defensive']
    }
  },
  {
    id: 'shortspear',
    name: 'Shortspear',
    type: 'weapon',
    quantity: 1,
    weight: 3,
    price: 10,
    rarity: 'common',
    description: 'A versatile spear that can be wielded one or two-handed.',
    equipable: true,
    stackable: false,
    slot: 'mainHand',
    weaponProperties: {
      skill: 'light-weaponry',
      damage: '1d8',
      damageType: 'keen',
      range: 'Melee',
      traits: ['Two-Handed'],
      expertTraits: ['Unique: loses Two-Handed trait']
    }
  },
  {
    id: 'sidesword',
    name: 'Sidesword',
    type: 'weapon',
    quantity: 1,
    weight: 2,
    price: 40,
    rarity: 'common',
    description: 'A balanced cutting sword, quick to draw.',
    equipable: true,
    stackable: false,
    slot: 'mainHand',
    weaponProperties: {
      skill: 'light-weaponry',
      damage: '1d6',
      damageType: 'keen',
      range: 'Melee',
      traits: ['Quickdraw'],
      expertTraits: ['Offhand']
    }
  },
  {
    id: 'staff',
    name: 'Staff',
    type: 'weapon',
    quantity: 1,
    weight: 4,
    price: 1,
    rarity: 'common',
    description: 'A long wooden pole, easily disguised as a walking stick.',
    equipable: true,
    stackable: false,
    slot: 'mainHand',
    weaponProperties: {
      skill: 'light-weaponry',
      damage: '1d6',
      damageType: 'impact',
      range: 'Melee',
      traits: ['Discreet', 'Two-Handed'],
      expertTraits: ['Defensive']
    }
  },
  {
    id: 'shortbow',
    name: 'Shortbow',
    type: 'weapon',
    quantity: 1,
    weight: 2,
    price: 80,
    rarity: 'common',
    description: 'A compact bow suitable for mounted archery.',
    equipable: true,
    stackable: false,
    slot: 'mainHand',
    weaponProperties: {
      skill: 'light-weaponry',
      damage: '1d6',
      damageType: 'keen',
      range: 'Ranged[80/320]',
      traits: ['Two-Handed'],
      expertTraits: ['Quickdraw']
    }
  },
  {
    id: 'sling',
    name: 'Sling',
    type: 'weapon',
    quantity: 1,
    weight: 1,
    price: 2,
    rarity: 'common',
    description: 'A simple leather strap for hurling stones.',
    equipable: true,
    stackable: false,
    slot: 'mainHand',
    weaponProperties: {
      skill: 'light-weaponry',
      damage: '1d4',
      damageType: 'impact',
      range: 'Ranged[30/120]',
      traits: ['Discreet'],
      expertTraits: ['Indirect']
    }
  }
];

export const HEAVY_WEAPONS: InventoryItem[] = [
  {
    id: 'axe',
    name: 'Axe',
    type: 'weapon',
    quantity: 1,
    weight: 2,
    price: 20,
    rarity: 'common',
    description: 'A balanced hand axe that can be thrown.',
    equipable: true,
    stackable: false,
    slot: 'mainHand',
    weaponProperties: {
      skill: 'heavy-weaponry',
      damage: '1d6',
      damageType: 'keen',
      range: 'Melee',
      traits: ['Thrown[20/60]'],
      expertTraits: ['Offhand']
    }
  },
  {
    id: 'greatsword',
    name: 'Greatsword',
    type: 'weapon',
    quantity: 1,
    weight: 7,
    price: 200,
    rarity: 'common',
    description: 'A massive two-handed blade capable of devastating strikes.',
    equipable: true,
    stackable: false,
    slot: 'mainHand',
    weaponProperties: {
      skill: 'heavy-weaponry',
      damage: '1d10',
      damageType: 'keen',
      range: 'Melee',
      traits: ['Two-Handed'],
      expertTraits: ['Deadly']
    }
  },
  {
    id: 'hammer',
    name: 'Hammer',
    type: 'weapon',
    quantity: 1,
    weight: 8,
    price: 40,
    rarity: 'common',
    description: 'A heavy war hammer built for crushing armor.',
    equipable: true,
    stackable: false,
    slot: 'mainHand',
    weaponProperties: {
      skill: 'heavy-weaponry',
      damage: '1d10',
      damageType: 'impact',
      range: 'Melee',
      traits: ['Two-Handed'],
      expertTraits: ['Momentum']
    }
  },
  {
    id: 'longspear',
    name: 'Longspear',
    type: 'weapon',
    quantity: 1,
    weight: 9,
    price: 15,
    rarity: 'common',
    description: 'A long spear with extended reach.',
    equipable: true,
    stackable: false,
    slot: 'mainHand',
    weaponProperties: {
      skill: 'heavy-weaponry',
      damage: '1d8',
      damageType: 'keen',
      range: 'Melee[+5]',
      traits: ['Two-Handed'],
      expertTraits: ['Defensive']
    }
  },
  {
    id: 'longsword',
    name: 'Longsword',
    type: 'weapon',
    quantity: 1,
    weight: 3,
    price: 60,
    rarity: 'common',
    description: 'A versatile blade that can be wielded one or two-handed.',
    equipable: true,
    stackable: false,
    slot: 'mainHand',
    weaponProperties: {
      skill: 'heavy-weaponry',
      damage: '1d8',
      damageType: 'keen',
      range: 'Melee',
      traits: ['Quickdraw', 'Two-Handed'],
      expertTraits: ['Unique: loses Two-handed Trait']
    }
  },
  {
    id: 'poleaxe',
    name: 'Poleaxe',
    type: 'weapon',
    quantity: 1,
    weight: 5,
    price: 40,
    rarity: 'common',
    description: 'An axe mounted on a long pole for reach.',
    equipable: true,
    stackable: false,
    slot: 'mainHand',
    weaponProperties: {
      skill: 'heavy-weaponry',
      damage: '1d10',
      damageType: 'keen',
      range: 'Melee',
      traits: ['Two-Handed'],
      expertTraits: ['Unique: Melee[+5]']
    }
  },
  {
    id: 'shield',
    name: 'Shield',
    type: 'weapon',
    quantity: 1,
    weight: 2,
    price: 10,
    rarity: 'common',
    description: 'A defensive shield that can also be used to bash.',
    equipable: true,
    stackable: false,
    slot: 'offHand',
    weaponProperties: {
      skill: 'heavy-weaponry',
      damage: '1d4',
      damageType: 'impact',
      range: 'Melee',
      traits: ['Defensive'],
      expertTraits: ['Offhand']
    }
  },
  {
    id: 'crossbow',
    name: 'Crossbow',
    type: 'weapon',
    quantity: 1,
    weight: 7,
    price: 200,
    rarity: 'common',
    description: 'A mechanical bow with devastating power.',
    equipable: true,
    stackable: false,
    slot: 'mainHand',
    weaponProperties: {
      skill: 'heavy-weaponry',
      damage: '1d8',
      damageType: 'keen',
      range: 'Ranged[100/400]',
      traits: ['Loaded[1]', 'Two-Handed'],
      expertTraits: ['Deadly']
    }
  },
  {
    id: 'longbow',
    name: 'Longbow',
    type: 'weapon',
    quantity: 1,
    weight: 3,
    price: 100,
    rarity: 'common',
    description: 'A powerful bow with impressive range.',
    equipable: true,
    stackable: false,
    slot: 'mainHand',
    weaponProperties: {
      skill: 'heavy-weaponry',
      damage: '1d6',
      damageType: 'keen',
      range: 'Ranged[150/600]',
      traits: ['Two-Handed'],
      expertTraits: ['Indirect']
    }
  }
];

export const SPECIAL_WEAPONS: InventoryItem[] = [
  {
    id: 'half-shard',
    name: 'Half-Shard',
    type: 'weapon',
    quantity: 1,
    weight: 10,
    price: 2000,
    rarity: 'common',
    description: 'A diamond-shaped kite shield with a fabrial that can resist Shardblades.',
    equipable: true,
    stackable: false,
    slot: 'offHand',
    weaponProperties: {
      skill: 'heavy-weaponry',
      damage: '2d4',
      damageType: 'impact',
      range: 'Melee',
      traits: ['Defensive', 'Two-Handed', 'Unique'],
      expertTraits: ['Momentum']
    },
    fabrialProperties: {
      charges: 1,
      currentCharges: 1,
      effect: 'Can expend a charge to increase deflect by 10 against one attack'
    }
  },
  {
    id: 'shardblade',
    name: 'Shardblade',
    type: 'weapon',
    quantity: 1,
    weight: 4,
    price: 0,
    rarity: 'reward-only',
    description: 'A priceless blade that cuts through soul rather than flesh. Can be summoned from thin air.',
    equipable: true,
    stackable: false,
    slot: 'mainHand',
    weaponProperties: {
      skill: 'heavy-weaponry',
      damage: '2d8',
      damageType: 'spirit',
      range: 'Melee',
      traits: ['Dangerous', 'Deadly', 'Unique'],
      expertTraits: ['Unique: loses Dangerous Trait']
    }
  },
  {
    id: 'shardblade-radiant',
    name: 'Shardblade (Radiant)',
    type: 'weapon',
    quantity: 1,
    weight: 0,
    price: 0,
    rarity: 'talent-only',
    description: 'A living Shardblade formed from a bonded spren. Can be instantly summoned and reshaped.',
    equipable: true,
    stackable: false,
    slot: 'mainHand',
    weaponProperties: {
      skill: 'heavy-weaponry',
      damage: '2d8',
      damageType: 'spirit',
      range: 'Melee',
      traits: ['Deadly', 'Unique'],
      expertTraits: []
    }
  },
  {
    id: 'warhammer',
    name: 'Warhammer',
    type: 'weapon',
    quantity: 1,
    weight: 150,
    price: 400,
    rarity: 'common',
    description: 'A massive hammer typically wielded only by those in Shardplate.',
    equipable: true,
    stackable: false,
    slot: 'mainHand',
    weaponProperties: {
      skill: 'heavy-weaponry',
      damage: '2d10',
      damageType: 'impact',
      range: 'Melee',
      traits: ['Cumbersome[5]', 'Two-Handed'],
      expertTraits: ['Unique']
    }
  },
  {
    id: 'grandbow',
    name: 'Grandbow',
    type: 'weapon',
    quantity: 1,
    weight: 20,
    price: 1000,
    rarity: 'common',
    description: 'An enormous bow of tremendous power and range.',
    equipable: true,
    stackable: false,
    slot: 'mainHand',
    weaponProperties: {
      skill: 'heavy-weaponry',
      damage: '2d6',
      damageType: 'keen',
      range: 'Ranged[200/800]',
      traits: ['Cumbersome[5]', 'Two-Handed'],
      expertTraits: ['Pierce']
    }
  }
];

// ===== ARMOR =====

export const ARMOR_ITEMS: InventoryItem[] = [
  {
    id: 'uniform',
    name: 'Uniform',
    type: 'armor',
    quantity: 1,
    weight: 5,
    price: 40,
    rarity: 'common',
    description: 'Standard military or professional attire.',
    equipable: true,
    stackable: false,
    slot: 'armor',
    bonuses: [
      { type: BonusType.DEFLECT, target: 'all', value: 0 }
    ],
    armorProperties: {
      deflectValue: 0,
      traits: ['Presentable'],
      expertTraits: []
    }
  },
  {
    id: 'leather-armor',
    name: 'Leather Armor',
    type: 'armor',
    quantity: 1,
    weight: 10,
    price: 60,
    rarity: 'common',
    description: 'Light armor of tanned hide, offering basic protection.',
    equipable: true,
    stackable: false,
    slot: 'armor',
    bonuses: [
      { type: BonusType.DEFLECT, target: 'all', value: 1 }
    ],
    armorProperties: {
      deflectValue: 1,
      traits: [],
      expertTraits: ['Presentable']
    }
  },
  {
    id: 'chain-armor',
    name: 'Chain Armor',
    type: 'armor',
    quantity: 1,
    weight: 25,
    price: 80,
    rarity: 'common',
    description: 'Interlocking metal rings providing solid protection.',
    equipable: true,
    stackable: false,
    slot: 'armor',
    bonuses: [
      { type: BonusType.DEFLECT, target: 'all', value: 2 }
    ],
    armorProperties: {
      deflectValue: 2,
      traits: ['Cumbersome[3]'],
      expertTraits: ['Unique: loses Cumbersome Trait']
    }
  },
  {
    id: 'breastplate',
    name: 'Breastplate',
    type: 'armor',
    quantity: 1,
    weight: 30,
    price: 120,
    rarity: 'common',
    description: 'Metal chest armor with cloth or leather backing.',
    equipable: true,
    stackable: false,
    slot: 'armor',
    bonuses: [
      { type: BonusType.DEFLECT, target: 'all', value: 2 }
    ],
    armorProperties: {
      deflectValue: 2,
      traits: ['Cumbersome[3]'],
      expertTraits: ['Presentable']
    }
  },
  {
    id: 'half-plate',
    name: 'Half Plate',
    type: 'armor',
    quantity: 1,
    weight: 40,
    price: 400,
    rarity: 'common',
    description: 'Heavy armor protecting vital areas.',
    equipable: true,
    stackable: false,
    slot: 'armor',
    bonuses: [
      { type: BonusType.DEFLECT, target: 'all', value: 3 }
    ],
    armorProperties: {
      deflectValue: 3,
      traits: ['Cumbersome[4]'],
      expertTraits: ['Unique: Cumbersome[3] instead of Cumbersome[4]']
    }
  },
  {
    id: 'full-plate',
    name: 'Full Plate',
    type: 'armor',
    quantity: 1,
    weight: 55,
    price: 1600,
    rarity: 'common',
    description: 'Complete suit of heavy metal armor.',
    equipable: true,
    stackable: false,
    slot: 'armor',
    bonuses: [
      { type: BonusType.DEFLECT, target: 'all', value: 4 }
    ],
    armorProperties: {
      deflectValue: 4,
      traits: ['Cumbersome[5]'],
      expertTraits: []
    }
  },
  {
    id: 'shardplate',
    name: 'Shardplate',
    type: 'armor',
    quantity: 1,
    weight: 1400,
    price: 0,
    rarity: 'reward-only',
    description: 'Legendary full-body armor that enhances strength and blocks Shardblades.',
    equipable: true,
    stackable: false,
    slot: 'armor',
    bonuses: [
      { type: BonusType.DEFLECT, target: 'all', value: 5 },
      { type: BonusType.ATTRIBUTE, target: 'strength', value: 2 },
      { type: BonusType.ATTRIBUTE, target: 'speed', value: 2 }
    ],
    armorProperties: {
      deflectValue: 5,
      traits: ['Dangerous', 'Unique'],
      expertTraits: ['Unique: loses Dangerous Trait']
    },
    fabrialProperties: {
      charges: 4,
      currentCharges: 4,
      effect: 'Can expend a charge to increase deflect by 10 against one attack'
    }
  },
  {
    id: 'shardplate-radiant',
    name: 'Shardplate (Radiant)',
    type: 'armor',
    quantity: 1,
    weight: 0,
    price: 0,
    rarity: 'talent-only',
    description: 'Living armor formed from common spren, glowing with luminescent light.',
    equipable: true,
    stackable: false,
    slot: 'armor',
    bonuses: [
      { type: BonusType.DEFLECT, target: 'all', value: 5 },
      { type: BonusType.ATTRIBUTE, target: 'strength', value: 2 },
      { type: BonusType.ATTRIBUTE, target: 'speed', value: 2 }
    ],
    armorProperties: {
      deflectValue: 5,
      traits: ['Unique'],
      expertTraits: []
    },
    fabrialProperties: {
      charges: 4,
      currentCharges: 4,
      effect: 'Can expend a charge to increase deflect by 10. Regains all charges after long rest.'
    }
  }
];

// ===== EQUIPMENT =====

export const EQUIPMENT_ITEMS: InventoryItem[] = [
  {
    id: 'backpack',
    name: 'Backpack',
    type: 'equipment',
    quantity: 1,
    weight: 5,
    price: 8,
    rarity: 'common',
    description: 'A sturdy pack for carrying supplies.',
    equipable: false,
    stackable: false
  },
  {
    id: 'rope',
    name: 'Rope (50 feet)',
    type: 'equipment',
    quantity: 1,
    weight: 5,
    price: 30,
    rarity: 'common',
    description: 'Seasilk rope, strong and reliable.',
    equipable: false,
    stackable: true
  },
  {
    id: 'blanket',
    name: 'Blanket',
    type: 'equipment',
    quantity: 1,
    weight: 2,
    price: 2,
    rarity: 'common',
    description: 'A wool blanket for warmth.',
    equipable: false,
    stackable: true
  },
  {
    id: 'waterskin',
    name: 'Waterskin',
    type: 'equipment',
    quantity: 1,
    weight: 1,
    price: 1,
    rarity: 'common',
    description: 'A leather bag for carrying water.',
    equipable: false,
    stackable: true
  },
  {
    id: 'flint-steel',
    name: 'Flint and Steel',
    type: 'equipment',
    quantity: 1,
    weight: 1.5,
    price: 4,
    rarity: 'common',
    description: 'For starting fires.',
    equipable: false,
    stackable: false
  },
  {
    id: 'whetstone',
    name: 'Whetstone',
    type: 'equipment',
    quantity: 1,
    weight: 1,
    price: 0.2,
    rarity: 'common',
    description: 'For sharpening blades.',
    equipable: false,
    stackable: false
  },
  {
    id: 'food-ration',
    name: 'Food Ration (1 day)',
    type: 'consumable',
    quantity: 1,
    weight: 0.5,
    price: 0.2,
    rarity: 'common',
    description: 'Preserved food for travel.',
    equipable: false,
    stackable: true
  },
  {
    id: 'food-street',
    name: 'Street Food (1 day)',
    type: 'consumable',
    quantity: 1,
    weight: 1.5,
    price: 3,
    rarity: 'common',
    description: 'Fresh street food from vendors.',
    equipable: false,
    stackable: true
  },
  {
    id: 'ink-pen',
    name: 'Ink Pen',
    type: 'equipment',
    quantity: 1,
    weight: 0.1,
    price: 0.1,
    rarity: 'common',
    description: 'A writing implement.',
    equipable: false,
    stackable: true
  },
  {
    id: 'ink-bottle',
    name: 'Bottle of Ink',
    type: 'equipment',
    quantity: 1,
    weight: 0.2,
    price: 40,
    rarity: 'common',
    description: 'One ounce of ink.',
    equipable: false,
    stackable: true
  },
  {
    id: 'paper',
    name: 'Paper (1 sheet)',
    type: 'equipment',
    quantity: 1,
    weight: 0.1,
    price: 0.5,
    rarity: 'common',
    description: 'A single sheet of paper.',
    equipable: false,
    stackable: true
  },
  {
    id: 'vial-empty',
    name: 'Empty Vial',
    type: 'equipment',
    quantity: 1,
    weight: 0.2,
    price: 4,
    rarity: 'common',
    description: 'A small glass vial.',
    equipable: false,
    stackable: true
  },
  {
    id: 'wax-block',
    name: 'Block of Wax',
    type: 'equipment',
    quantity: 1,
    weight: 0.5,
    price: 2,
    rarity: 'common',
    description: 'For sealing letters.',
    equipable: false,
    stackable: true
  },
  {
    id: 'reference-book',
    name: 'Reference Book',
    type: 'equipment',
    quantity: 1,
    weight: 3,
    price: 100,
    rarity: 'common',
    description: 'A book on a specific topic.',
    equipable: false,
    stackable: true
  },
  {
    id: 'poison-weak',
    name: 'Weak Poison (1 dose)',
    type: 'consumable',
    quantity: 1,
    weight: 0.2,
    price: 20,
    rarity: 'common',
    description: 'Causes 1d6 vital damage on DC 12 Athletics test.',
    equipable: false,
    stackable: true
  },
  {
    id: 'common-clothing',
    name: 'Common Clothing',
    type: 'equipment',
    quantity: 1,
    weight: 3,
    price: 2,
    rarity: 'common',
    description: 'Plain, everyday clothes.',
    equipable: false,
    stackable: true
  },
  {
    id: 'fine-clothing',
    name: 'Fine Clothing',
    type: 'equipment',
    quantity: 1,
    weight: 6,
    price: 100,
    rarity: 'common',
    description: 'High-quality clothing for formal occasions.',
    equipable: false,
    stackable: false
  },
  {
    id: 'surgical-supplies',
    name: 'Surgical Supplies',
    type: 'equipment',
    quantity: 1,
    weight: 3,
    price: 20,
    rarity: 'common',
    description: 'Bandages, salves, and splints. Can be used 10 times.',
    equipable: false,
    stackable: false,
    properties: { uses: 10 }
  },
  {
    id: 'antiseptic-weak',
    name: 'Weak Antiseptic (5 doses)',
    type: 'consumable',
    quantity: 1,
    weight: 1,
    price: 25,
    rarity: 'common',
    description: 'Restores 1d6 health after a short rest.',
    equipable: false,
    stackable: true,
    properties: { doses: 5 }
  },
  {
    id: 'antiseptic-potent',
    name: 'Potent Antiseptic (5 doses)',
    type: 'consumable',
    quantity: 1,
    weight: 1,
    price: 50,
    rarity: 'common',
    description: 'Restores 2d6 health after a short rest.',
    equipable: false,
    stackable: true,
    properties: { doses: 5 }
  },
  {
    id: 'candle',
    name: 'Candle',
    type: 'equipment',
    quantity: 1,
    weight: 0.2,
    price: 0.2,
    rarity: 'common',
    description: 'Burns for 6 hours, sheds light in 15-foot radius.',
    equipable: false,
    stackable: true
  },
  {
    id: 'oil-lantern',
    name: 'Oil Lantern',
    type: 'equipment',
    quantity: 1,
    weight: 2,
    price: 20,
    rarity: 'common',
    description: 'Sheds light in 30-foot radius for 6 hours per pint of oil.',
    equipable: false,
    stackable: false
  },
  {
    id: 'oil-flask',
    name: 'Flask of Oil',
    type: 'consumable',
    quantity: 1,
    weight: 1,
    price: 1,
    rarity: 'common',
    description: 'One pint of oil for lanterns or improvised weapons.',
    equipable: false,
    stackable: true
  },
  {
    id: 'crowbar',
    name: 'Crowbar',
    type: 'equipment',
    quantity: 1,
    weight: 3,
    price: 10,
    rarity: 'common',
    description: 'Grants advantage on Athletics tests for leverage.',
    equipable: false,
    stackable: false
  },
  {
    id: 'lockpick',
    name: 'Lockpick',
    type: 'equipment',
    quantity: 1,
    weight: 0.5,
    price: 5,
    rarity: 'common',
    description: 'Grants advantage on Thievery tests to pick locks.',
    equipable: false,
    stackable: true
  },
  {
    id: 'manacles',
    name: 'Manacles',
    type: 'equipment',
    quantity: 1,
    weight: 6,
    price: 10,
    rarity: 'common',
    description: 'Metal restraints with a key.',
    equipable: false,
    stackable: false
  },
  {
    id: 'musical-instrument',
    name: 'Musical Instrument',
    type: 'equipment',
    quantity: 1,
    weight: 5,
    price: 20,
    rarity: 'common',
    description: 'A typical musical instrument.',
    equipable: false,
    stackable: false
  },
  {
    id: 'scale',
    name: 'Scale',
    type: 'equipment',
    quantity: 1,
    weight: 3,
    price: 20,
    rarity: 'common',
    description: 'For weighing objects up to 2 pounds.',
    equipable: false,
    stackable: false
  },
  {
    id: 'tuning-fork',
    name: 'Tuning Fork',
    type: 'equipment',
    quantity: 1,
    weight: 0.5,
    price: 50,
    rarity: 'common',
    description: 'Can transfer Stormlight between gems.',
    equipable: false,
    stackable: false
  },
  {
    id: 'unencased-gem',
    name: 'Unencased Gem (infused)',
    type: 'consumable',
    quantity: 1,
    weight: 0.01,
    price: 2,
    rarity: 'common',
    description: 'Can recharge fabrials or provide Stormlight to Radiants.',
    equipable: false,
    stackable: true
  },
  {
    id: 'alcohol-bottle',
    name: 'Bottle of Wine',
    type: 'consumable',
    quantity: 1,
    weight: 3,
    price: 10,
    rarity: 'common',
    description: 'A bottle of Vorin wine.',
    equipable: false,
    stackable: true
  },
  {
    id: 'grappling-hook',
    name: 'Grappling Hook',
    type: 'equipment',
    quantity: 1,
    weight: 4,
    price: 10,
    rarity: 'common',
    description: 'Grants advantage on climbing tests when anchored.',
    equipable: false,
    stackable: false
  }
];

// ===== FABRIAL ITEMS =====

export const FABRIAL_ITEMS: InventoryItem[] = [
  {
    id: 'spanreed-pair',
    name: 'Spanreed (1 pair)',
    type: 'fabrial',
    quantity: 1,
    weight: 1,
    price: 1000,
    rarity: 'common',
    description: 'A pair of conjoined writing reeds for long-distance communication.',
    equipable: false,
    stackable: false,
    fabrialProperties: {
      charges: 3,
      currentCharges: 3,
      effect: 'Allows written communication over long distances. Expends 1 charge per 5 days.'
    }
  },
  {
    id: 'heatrial',
    name: 'Heatrial',
    type: 'fabrial',
    quantity: 1,
    weight: 5,
    price: 250,
    rarity: 'common',
    description: 'A heating fabrial for warmth or cooking.',
    equipable: false,
    stackable: false,
    fabrialProperties: {
      charges: 5,
      currentCharges: 5,
      effect: 'Generates heat. Expends 1 charge per day for ambient warmth, or per hour for cooking.'
    }
  },
  {
    id: 'soulcaster',
    name: 'Soulcaster',
    type: 'fabrial',
    quantity: 1,
    weight: 5,
    price: 0,
    rarity: 'reward-only',
    description: 'A fabrial that can transform materials into one specific Essence.',
    equipable: true,
    stackable: false,
    slot: 'accessory',
    fabrialProperties: {
      charges: 5,
      currentCharges: 5,
      effect: 'Allows use of Transformation surge to convert materials to one Essence type.'
    }
  }
];

// ===== MOUNTS & VEHICLES =====

export const MOUNT_ITEMS: InventoryItem[] = [
  {
    id: 'chull',
    name: 'Chull',
    type: 'mount',
    quantity: 1,
    weight: 0,
    price: 200,
    rarity: 'common',
    description: 'A large crustacean mount. Travel speed: 2mph, Carry capacity: 1,500lb.',
    equipable: false,
    stackable: false,
    properties: {
      travelSpeed: '2mph',
      carryCapacity: 1500
    }
  },
  {
    id: 'horse',
    name: 'Horse',
    type: 'mount',
    quantity: 1,
    weight: 0,
    price: 4000,
    rarity: 'common',
    description: 'An uncommon but swift mount. Travel speed: 4mph, Carry capacity: 500lb.',
    equipable: false,
    stackable: false,
    properties: {
      travelSpeed: '4mph',
      carryCapacity: 500
    }
  },
  {
    id: 'ryshadium',
    name: 'Ryshadium',
    type: 'mount',
    quantity: 1,
    weight: 0,
    price: 0,
    rarity: 'reward-only',
    description: 'A rare, sapient breed of horse that chooses its rider. Travel speed: 6mph, Carry capacity: 1,000lb.',
    equipable: false,
    stackable: false,
    properties: {
      travelSpeed: '6mph',
      carryCapacity: 1000
    }
  }
];

export const VEHICLE_ITEMS: InventoryItem[] = [
  {
    id: 'chull-cart',
    name: 'Chull Cart',
    type: 'vehicle',
    quantity: 1,
    weight: 0,
    price: 500,
    rarity: 'common',
    description: 'A cart pulled by a chull. Travel speed: 2mph.',
    equipable: false,
    stackable: false
  },
  {
    id: 'rowboat',
    name: 'Rowboat',
    type: 'vehicle',
    quantity: 1,
    weight: 0,
    price: 250,
    rarity: 'common',
    description: 'A small boat for water travel. Travel speed: 3mph downstream, 1mph upstream.',
    equipable: false,
    stackable: false
  }
];

// ===== STARTING KITS =====

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
      { itemId: 'ink-pen', quantity: 1 },
      { itemId: 'ink-bottle', quantity: 1 },
      { itemId: 'paper', quantity: 10 },
      { itemId: 'vial-empty', quantity: 3 },
      { itemId: 'wax-block', quantity: 1 },
      { itemId: 'reference-book', quantity: 1 },
      { itemId: 'poison-weak', quantity: 1 }
    ],
    currency: 18, // 3d12 average
    additionalExpertise: 'Literature'
  },
  {
    id: 'artisan-kit',
    name: 'Artisan Kit',
    description: 'Tools for crafters and artisans.',
    weapons: [
      { itemId: 'hammer', quantity: 1 }
    ],
    armor: [
      { itemId: 'leather-armor', quantity: 1 }
    ],
    equipment: [
      { itemId: 'common-clothing', quantity: 1 },
      { itemId: 'surgical-supplies', quantity: 1 },
      { itemId: 'antiseptic-weak', quantity: 1 },
      { itemId: 'ink-pen', quantity: 1 },
      { itemId: 'ink-bottle', quantity: 1 },
      { itemId: 'paper', quantity: 5 },
      { itemId: 'candle', quantity: 5 },
      { itemId: 'flint-steel', quantity: 1 },
      { itemId: 'vial-empty', quantity: 3 },
      { itemId: 'tuning-fork', quantity: 1 },
      { itemId: 'musical-instrument', quantity: 1 },
      { itemId: 'scale', quantity: 1 }
    ],
    currency: 16 // 4d8 average
  },
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
    currency: 7 // 2d6 average
  },
  {
    id: 'courtier-kit',
    name: 'Courtier Kit',
    description: 'Fine attire and accoutrements for nobles.',
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
    description: 'The bare minimum for those who have lost everything.',
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
    description: 'Tools for thieves and rogues.',
    weapons: [
      { itemId: 'knife', quantity: 2 }
    ],
    armor: [
      { itemId: 'leather-armor', quantity: 1 }
    ],
    equipment: [
      { itemId: 'backpack', quantity: 1 },
      { itemId: 'common-clothing', quantity: 1 },
      { itemId: 'alcohol-bottle', quantity: 1 },
      { itemId: 'crowbar', quantity: 1 },
      { itemId: 'lockpick', quantity: 1 },
      { itemId: 'rope', quantity: 1 },
      { itemId: 'flint-steel', quantity: 1 },
      { itemId: 'oil-lantern', quantity: 1 },
      { itemId: 'oil-flask', quantity: 1 },
      { itemId: 'food-street', quantity: 5 }
    ],
    currency: 10 // 1d20 average
  }
];

// ===== CRAFTING MATERIALS =====

export const CRAFTING_MATERIALS: InventoryItem[] = [
  {
    id: 'iron-ingot',
    name: 'Iron Ingot',
    description: 'A bar of refined iron, used for weapon and armor crafting.',
    weight: 2,
    price: 5,
    type: 'equipment',
    rarity: 'common',
    equipable: false,
    stackable: true,
    quantity: 1
  },
  {
    id: 'leather-strip',
    name: 'Leather Strip',
    description: 'A strip of cured leather for binding and crafting.',
    weight: 0.1,
    price: 1,
    type: 'equipment',
    rarity: 'common',
    equipable: false,
    stackable: true,
    quantity: 1
  },
  {
    id: 'leather',
    name: 'Leather',
    description: 'Tanned leather suitable for armor crafting.',
    weight: 1,
    price: 3,
    type: 'equipment',
    rarity: 'common',
    equipable: false,
    stackable: true,
    quantity: 1
  },
  {
    id: 'thread',
    name: 'Thread',
    description: 'Strong thread for stitching leather and fabric.',
    weight: 0.1,
    price: 1,
    type: 'equipment',
    rarity: 'common',
    equipable: false,
    stackable: true,
    quantity: 1
  },
  {
    id: 'gemstone-ruby',
    name: 'Ruby Gemstone',
    description: 'A polished ruby used in fabrial construction.',
    weight: 0.1,
    price: 50,
    type: 'equipment',
    rarity: 'common',
    equipable: false,
    stackable: true,
    quantity: 1
  },
  {
    id: 'metal-housing',
    name: 'Metal Housing',
    description: 'A precisely crafted metal housing for fabrial components.',
    weight: 0.5,
    price: 10,
    type: 'equipment',
    rarity: 'common',
    equipable: false,
    stackable: true,
    quantity: 1
  },
  {
    id: 'copper-wire',
    name: 'Copper Wire',
    description: 'Fine copper wire used in fabrial circuitry.',
    weight: 0.1,
    price: 2,
    type: 'equipment',
    rarity: 'common',
    equipable: false,
    stackable: true,
    quantity: 1
  },
  {
    id: 'iron-sword',
    name: 'Iron Sword',
    description: 'A simple iron sword, well-balanced and reliable.',
    weight: 3,
    price: 15,
    type: 'weapon',
    rarity: 'common',
    equipable: true,
    stackable: false,
    quantity: 1,
    slot: 'mainHand',
    weaponProperties: {
      skill: 'light-weaponry',
      damage: '1d8',
      damageType: 'keen',
      range: 'melee',
      traits: [],
      expertTraits: []
    }
  },
  {
    id: 'steel-sword',
    name: 'Steel Sword',
    description: 'A superior steel blade with excellent edge retention.',
    weight: 3,
    price: 50,
    type: 'weapon',
    rarity: 'common',
    equipable: true,
    stackable: false,
    quantity: 1,
    slot: 'mainHand',
    weaponProperties: {
      skill: 'light-weaponry',
      damage: '1d8+1',
      damageType: 'keen',
      range: 'melee',
      traits: [],
      expertTraits: []
    }
  },
  {
    id: 'leather-armor',
    name: 'Leather Armor',
    description: 'Supple leather armor that doesn\'t restrict movement.',
    weight: 10,
    price: 10,
    type: 'armor',
    rarity: 'common',
    equipable: true,
    stackable: false,
    quantity: 1,
    slot: 'armor',
    armorProperties: {
      deflectValue: 1,
      traits: [],
      expertTraits: []
    }
  },
  {
    id: 'heating-fabrial',
    name: 'Heating Fabrial',
    description: 'A fabrial device that generates warmth.',
    weight: 1,
    price: 100,
    type: 'fabrial',
    rarity: 'common',
    equipable: false,
    stackable: false,
    quantity: 1,
    fabrialProperties: {
      charges: 10,
      currentCharges: 10,
      effect: 'Generates heat within a 10-foot radius'
    }
  },
  {
    id: 'health-potion',
    name: 'Health Potion',
    description: 'A potion that restores health when consumed.',
    weight: 0.5,
    price: 50,
    type: 'consumable',
    rarity: 'common',
    equipable: false,
    stackable: true,
    quantity: 1
  }
];

// ===== COMBINED EXPORTS =====

export const ALL_ITEMS: InventoryItem[] = [
  ...LIGHT_WEAPONS,
  ...HEAVY_WEAPONS,
  ...SPECIAL_WEAPONS,
  ...ARMOR_ITEMS,
  ...EQUIPMENT_ITEMS,
  ...FABRIAL_ITEMS,
  ...MOUNT_ITEMS,
  ...VEHICLE_ITEMS,
  ...CRAFTING_MATERIALS,
  ...PET_ITEMS
];

export function getItemById(itemId: string): InventoryItem | undefined {
  return ALL_ITEMS.find(item => item.id === itemId);
}

export function getItemsByType(type: ItemType): InventoryItem[] {
  return ALL_ITEMS.filter(item => item.type === type);
}

export function getItemsByRarity(rarity: ItemRarity): InventoryItem[] {
  return ALL_ITEMS.filter(item => item.rarity === rarity);
}

export function getEquipableItems(): InventoryItem[] {
  return ALL_ITEMS.filter(item => item.equipable);
}
