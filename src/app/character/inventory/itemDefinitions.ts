// Minimal item definitions for testing purposes
// The authoritative item data is now on the backend in server/item-definitions.js
// This file exists only to satisfy test dependencies

import { InventoryItem, StartingKit } from './inventoryItem';

export const ALL_ITEMS: InventoryItem[] = [
  {
    id: 'iron-sword',
    name: 'Iron Sword',
    type: 'weapon',
    description: 'A standard iron sword',
    rarity: 'common',
    price: 50, // price in chips
    weight: 3,
    quantity: 0,
    stackable: false,
    equipable: true,
    slot: 'mainHand',
    properties: { damage: '1d6' },
    weaponProperties: {
      skill: 'heavy-weaponry',
      damage: '1d6',
      damageType: 'keen',
      range: 'Melee',
      traits: [],
      expertTraits: []
    }
  },
  {
    id: 'steel-sword',
    name: 'Steel Sword',
    type: 'weapon',
    description: 'A superior steel sword',
    rarity: 'common',
    price: 100, // price in chips
    weight: 3,
    quantity: 0,
    stackable: false,
    equipable: true,
    slot: 'mainHand',
    properties: { damage: '1d8' },
    weaponProperties: {
      skill: 'heavy-weaponry',
      damage: '1d8',
      damageType: 'keen',
      range: 'Melee',
      traits: [],
      expertTraits: []
    }
  },
  {
    id: 'knife',
    name: 'Knife',
    type: 'weapon',
    description: 'A basic knife',
    rarity: 'common',
    price: 20, // price in chips
    weight: 1,
    quantity: 0,
    stackable: false,
    equipable: true,
    slot: 'mainHand',
    properties: { damage: '1d4' },
    weaponProperties: {
      skill: 'light-weaponry',
      damage: '1d4',
      damageType: 'keen',
      range: 'Melee',
      traits: ['Discreet'],
      expertTraits: []
    }
  },
  {
    id: 'rapier',
    name: 'Rapier',
    type: 'weapon',
    description: 'A finesse weapon',
    rarity: 'common',
    price: 75, // price in chips
    weight: 2,
    quantity: 0,
    stackable: false,
    equipable: true,
    slot: 'mainHand',
    properties: { damage: '1d6' },
    weaponProperties: {
      skill: 'light-weaponry',
      damage: '1d6',
      damageType: 'keen',
      range: 'Melee',
      traits: ['Discreet'],
      expertTraits: []
    }
  },
  {
    id: 'leather-armor',
    name: 'Leather Armor',
    type: 'armor',
    description: 'Basic leather protection',
    rarity: 'common',
    price: 80, // price in chips
    weight: 10,
    quantity: 0,
    stackable: false,
    equipable: true,
    slot: 'armor',
    properties: { defense: 1 },
    armorProperties: {
      deflectValue: 1,
      traits: [],
      expertTraits: []
    }
  },
  {
    id: 'military-kit',
    name: 'Military Kit',
    type: 'equipment',
    description: 'Starting equipment for military background',
    rarity: 'common',
    price: 0,
    weight: 20,
    quantity: 0,
    stackable: false,
    equipable: false,
    properties: {}
  },
  {
    id: 'waterskin',
    name: 'Waterskin',
    type: 'equipment',
    description: 'A water-tight leather waterskin',
    rarity: 'common',
    price: 5, // price in chips
    weight: 0.5,
    quantity: 0,
    stackable: true,
    equipable: false,
    properties: {}
  },
  {
    id: 'iron-ingot',
    name: 'Iron Ingot',
    type: 'equipment',
    description: 'Raw iron for crafting',
    rarity: 'common',
    price: 10, // price in chips
    weight: 1,
    quantity: 0,
    stackable: true,
    equipable: false,
    properties: {}
  },
  {
    id: 'health-potion',
    name: 'Health Potion',
    type: 'consumable',
    description: 'A potion that restores health',
    rarity: 'common',
    price: 25, // price in chips
    weight: 0.25,
    quantity: 0,
    stackable: true,
    equipable: false,
    properties: { healing: 10 }
  },
  {
    id: 'chickenhawk',
    name: 'Chickenhawk',
    type: 'pet',
    description: 'A fierce avian companion, a cross between a chicken and a hawk. Loyal and protective.',
    rarity: 'reward-only',
    price: 0, // Cannot be purchased
    weight: 8,
    quantity: 0,
    stackable: false,
    equipable: true,
    slot: 'accessory',
    properties: { species: 'Chickenhawk', behavior: 'Protective', intelligence: 'animal', flyingSpeed: 40 }
  },
  {
    id: 'armored-hound',
    name: 'Armored Hound',
    type: 'pet',
    description: 'A stalwart canine companion, magically protected and trained for combat.',
    rarity: 'reward-only',
    price: 0, // Cannot be purchased
    weight: 120,
    quantity: 0,
    stackable: false,
    equipable: true,
    slot: 'accessory',
    properties: { species: 'Hound', behavior: 'Battle-hardened', intelligence: 'animal', movementSpeed: 50 }
  },
  {
    id: 'spren-familiar',
    name: 'Spren Familiar',
    type: 'pet',
    description: 'A small spren bound to serve as a magical companion.',
    rarity: 'reward-only',
    price: 0, // Cannot be purchased
    weight: 0,
    quantity: 0,
    stackable: false,
    equipable: true,
    slot: 'accessory',
    properties: { species: 'Spren', behavior: 'Magical', intelligence: 'sapient' }
  },
  {
    id: 'storm-drake',
    name: 'Storm Drake',
    type: 'pet',
    description: 'A small dragon-like creature attuned to the storms. A rare and powerful companion.',
    rarity: 'reward-only',
    price: 0, // Cannot be purchased
    weight: 45,
    quantity: 0,
    stackable: false,
    equipable: true,
    slot: 'accessory',
    properties: { species: 'Drake', behavior: 'Fierce', intelligence: 'sapient', flyingSpeed: 60 }
  },
  {
    id: 'demo-companion',
    name: 'Demo Companion',
    type: 'pet',
    description: 'A friendly demonstration companion. Perfect for testing and learning how pets work.',
    rarity: 'reward-only',
    price: 0, // Cannot be purchased
    weight: 12,
    quantity: 0,
    stackable: false,
    equipable: true,
    slot: 'accessory',
    properties: { species: 'Training Creature', behavior: 'Friendly', intelligence: 'animal', movementSpeed: 30 }
  },
  {
    id: 'leather',
    name: 'Leather',
    type: 'equipment',
    description: 'Raw leather for crafting',
    rarity: 'common',
    price: 5, // price in chips
    weight: 0.5,
    quantity: 0,
    stackable: true,
    equipable: false,
    properties: {}
  },
  {
    id: 'thread',
    name: 'Thread',
    type: 'equipment',
    description: 'Thread for sewing and crafting',
    rarity: 'common',
    price: 2, // price in chips
    weight: 0.1,
    quantity: 0,
    stackable: true,
    equipable: false,
    properties: {}
  },
  {
    id: 'leather-strip',
    name: 'Leather Strip',
    type: 'equipment',
    description: 'A strip of leather for handles and bindings',
    rarity: 'common',
    price: 8, // price in chips
    weight: 0.25,
    quantity: 0,
    stackable: true,
    equipable: false,
    properties: {}
  },
  {
    id: 'steel-ingot',
    name: 'Steel Ingot',
    type: 'equipment',
    description: 'Refined steel for crafting',
    rarity: 'common',
    price: 20, // price in chips
    weight: 1.5,
    quantity: 0,
    stackable: true,
    equipable: false,
    properties: {}
  },
  {
    id: 'gemstone-ruby',
    name: 'Gemstone Ruby',
    type: 'equipment',
    description: 'A ruby gemstone for fabrials',
    rarity: 'common',
    price: 100, // price in chips
    weight: 0.5,
    quantity: 0,
    stackable: true,
    equipable: false,
    properties: {}
  },
  {
    id: 'metal-housing',
    name: 'Metal Housing',
    type: 'equipment',
    description: 'Metal casing for fabrial construction',
    rarity: 'common',
    price: 50, // price in chips
    weight: 2,
    quantity: 0,
    stackable: true,
    equipable: false,
    properties: {}
  },
  {
    id: 'copper-wire',
    name: 'Copper Wire',
    type: 'equipment',
    description: 'Copper wire for conducting power',
    rarity: 'common',
    price: 15, // price in chips
    weight: 0.25,
    quantity: 0,
    stackable: true,
    equipable: false,
    properties: {}
  },
  {
    id: 'heating-fabrial',
    name: 'Heating Fabrial',
    type: 'fabrial',
    description: 'A fabrial that produces warmth',
    rarity: 'common',
    price: 200, // price in chips
    weight: 1,
    quantity: 0,
    stackable: false,
    equipable: false,
    properties: { heating: 50 }
  }
];

export const STARTING_KITS: StartingKit[] = [
  {
    id: 'military-kit',
    name: 'Military Kit',
    description: 'Starting equipment for soldiers',
    weapons: [{ itemId: 'iron-sword', quantity: 1 }],
    armor: [{ itemId: 'leather-armor', quantity: 1 }],
    equipment: [],
    currency: 5 // Starting currency in marks
  }
];

export function getItemById(itemId: string): InventoryItem | undefined {
  return ALL_ITEMS.find(item => item.id === itemId);
}

export function getItemsByType(type: string): InventoryItem[] {
  return ALL_ITEMS.filter(item => item.type === type);
}

export function getKitById(kitId: string): StartingKit | undefined {
  return STARTING_KITS.find(kit => kit.id === kitId);
}
