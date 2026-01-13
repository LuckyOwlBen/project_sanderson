import { InventoryItem } from './inventoryItem';

export interface PetProperties {
  species: string;
  behavior: string;
  intelligence: 'animal' | 'sapient';
  flyingSpeed?: number;
  movementSpeed?: number;
  specialAbilities?: string[];
}

// ===== PETS =====

export const PET_ITEMS: InventoryItem[] = [
  {
    id: 'chickenhawk',
    name: 'Chickenhawk',
    type: 'pet',
    quantity: 1,
    weight: 8,
    price: 0, // Pets are not sold
    rarity: 'reward-only',
    description: 'A fierce avian companion, a cross between a chicken and a hawk. Loyal and protective.',
    equipable: true,
    stackable: false,
    slot: 'accessory',
    properties: {
      species: 'Chickenhawk',
      behavior: 'Protective and loyal',
      intelligence: 'animal',
      flyingSpeed: 40,
      specialAbilities: ['Swift Strike', 'Aerial Reconnaissance']
    } as PetProperties
  },
  {
    id: 'armored-hound',
    name: 'Armored Hound',
    type: 'pet',
    quantity: 1,
    weight: 120,
    price: 0,
    rarity: 'reward-only',
    description: 'A stalwart canine companion, magically protected and trained for combat.',
    equipable: true,
    stackable: false,
    slot: 'accessory',
    properties: {
      species: 'Hound',
      behavior: 'Loyal and battle-hardened',
      intelligence: 'animal',
      movementSpeed: 50,
      specialAbilities: ['Protective Stance', 'Pack Tactics']
    } as PetProperties
  },
  {
    id: 'spren-familiar',
    name: 'Spren Familiar',
    type: 'pet',
    quantity: 1,
    weight: 0,
    price: 0,
    rarity: 'reward-only',
    description: 'A small spren bound to serve as a magical companion.',
    equipable: true,
    stackable: false,
    slot: 'accessory',
    properties: {
      species: 'Spren',
      behavior: 'Magical and curious',
      intelligence: 'sapient',
      specialAbilities: ['Spell Resonance', 'Ethereal Form']
    } as PetProperties
  },
  {
    id: 'storm-drake',
    name: 'Storm Drake',
    type: 'pet',
    quantity: 1,
    weight: 45,
    price: 0,
    rarity: 'reward-only',
    description: 'A small dragon-like creature attuned to the storms. A rare and powerful companion.',
    equipable: true,
    stackable: false,
    slot: 'accessory',
    properties: {
      species: 'Drake',
      behavior: 'Fierce and storm-aligned',
      intelligence: 'sapient',
      flyingSpeed: 60,
      specialAbilities: ['Storm Breath', 'Lightning Aura']
    } as PetProperties
  },
  {
    id: 'demo-companion',
    name: 'Demo Companion',
    type: 'pet',
    quantity: 1,
    weight: 12,
    price: 0,
    rarity: 'reward-only',
    description: 'A friendly demonstration companion. Perfect for testing and learning how pets work.',
    equipable: true,
    stackable: false,
    slot: 'accessory',
    properties: {
      species: 'Training Creature',
      behavior: 'Friendly and eager to help',
      intelligence: 'animal',
      movementSpeed: 30,
      specialAbilities: ['Learn Quickly', 'Demo Mode']
    } as PetProperties
  }
];

// ===== HELPER FUNCTIONS =====

export function getPetById(id: string): InventoryItem | undefined {
  return PET_ITEMS.find(pet => pet.id === id);
}

export function getPetProperties(pet: InventoryItem): PetProperties | undefined {
  return pet.properties as PetProperties | undefined;
}
