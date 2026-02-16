import { InventoryItem } from './inventoryItem';
import { PetStatBlock, PetCompanion } from '../companions/petCompanion';
import { PetAbility } from '../companions/petAbility';

export interface PetProperties {
  species: string;
  behavior: string;
  intelligence: 'animal' | 'sapient';
  flyingSpeed?: number;
  movementSpeed?: number;
  specialAbilities?: string[];
}

// ===== INVENTORY ITEMS (for display in inventory UI) =====

export const PET_ITEMS: InventoryItem[] = [
  {
    id: 'chickenhawk',
    name: 'Chickenhawk',
    type: 'pet',
    quantity: 1,
    weight: 8,
    price: 0,
    rarity: 'reward-only',
    description:
      'A fierce avian companion, a cross between a chicken and a hawk. Loyal and protective.',
    equipable: true,
    stackable: false,
    slot: 'accessory',
    properties: {
      species: 'Chickenhawk',
      behavior: 'Protective and loyal',
      intelligence: 'animal',
      flyingSpeed: 40,
      specialAbilities: ['Swift Strike', 'Aerial Reconnaissance'],
    } as PetProperties,
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
      specialAbilities: ['Protective Stance', 'Pack Tactics'],
    } as PetProperties,
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
      specialAbilities: ['Spell Resonance', 'Ethereal Form'],
    } as PetProperties,
  },
  {
    id: 'storm-drake',
    name: 'Storm Drake',
    type: 'pet',
    quantity: 1,
    weight: 45,
    price: 0,
    rarity: 'reward-only',
    description:
      'A small dragon-like creature attuned to the storms. A rare and powerful companion.',
    equipable: true,
    stackable: false,
    slot: 'accessory',
    properties: {
      species: 'Drake',
      behavior: 'Fierce and storm-aligned',
      intelligence: 'sapient',
      flyingSpeed: 60,
      specialAbilities: ['Storm Breath', 'Lightning Aura'],
    } as PetProperties,
  },
  {
    id: 'demo-companion',
    name: 'Demo Companion',
    type: 'pet',
    quantity: 1,
    weight: 12,
    price: 0,
    rarity: 'reward-only',
    description:
      'A friendly demonstration companion. Perfect for testing and learning how pets work.',
    equipable: true,
    stackable: false,
    slot: 'accessory',
    properties: {
      species: 'Training Creature',
      behavior: 'Friendly and eager to help',
      intelligence: 'animal',
      movementSpeed: 30,
      specialAbilities: ['Learn Quickly', 'Demo Mode'],
    } as PetProperties,
  },
  {
    id: 'larkin',
    name: 'Larkin',
    type: 'pet',
    quantity: 1,
    weight: 15,
    price: 0,
    rarity: 'reward-only',
    description:
      'A small insectoid companion that can drain Investiture. Found in high places acting as a scout and warrior.',
    equipable: true,
    stackable: false,
    slot: 'accessory',
    properties: {
      species: 'Larkin',
      behavior: 'Alert and efficient',
      intelligence: 'animal',
      flyingSpeed: 20,
      movementSpeed: 30,
      specialAbilities: ['Bite', 'Drain Light', 'Invested Healing'],
    } as PetProperties,
  },
];

// ===== STAT BLOCKS (for combat and mechanics) =====

const LARKIN_ABILITIES: PetAbility[] = [
  {
    id: 'larkin-bite',
    name: 'Bite',
    type: 'attack',
    actionCost: '1-action',
    range: '5 ft.',
    description: 'Melee attack with keen damage.',
    detailedEffect:
      'Attack +5, reach 5 ft., one target. Graze: 2 (1d4) keen damage. Hit: 7 (1d4 + 5) keen damage, and the larkin can spend 2 focus to use their Drain Light (no action required) on that target or an effect infusing them. The larkin automatically succeeds on their Agility test to do so.',
    attack: {
      bonus: 5,
      reach: '5 ft.',
      target: 'one target',
      onGraze: [{ statistic: 'keen', dice: '1d4', description: '2 (1d4) keen damage' }],
      onHit: [{ statistic: 'keen', bonus: 5, dice: '1d4', description: '7 (1d4 + 5) keen damage' }],
    },
  },
  {
    id: 'larkin-drain-light',
    name: 'Drain Light',
    type: 'utility',
    actionCost: '2-actions',
    range: '5 ft.',
    description: 'Drain Investiture, charges, or Stormlight from a target.',
    detailedEffect:
      "If the larkin isn't at full Investiture, they choose one of the following targets within 5 feet of them, draining the chosen target of power:\n• Object with Charges: A fabrial or other object with charges loses 2 (1d4) charges.\n• Group of Spheres: Up to 2 (1d4) infused marks or broams within range lose the Stormlight or other Light infused in them.\n• Infused Object or Character: The target (or effect infused in the target) loses 2 (1d4) Investiture.\n\nIf the target is a character, or if it is an object worn or held by a character, the larkin must succeed on an Agility test against that character's Spiritual defense or the target isn't drained. The larkin regains the same amount of Investiture as they drained from the target. A character wearing Invested Shardplate can't have their Investiture drained in this way, but the Shardplate itself can be drained of charges.",
    utility: {
      target: 'one object or character within 5 ft.',
      effect: 'Drain 2 (1d4) Investiture, charges, or Stormlight. Larkin regains drained amount.',
      check: {
        statistic: 'Agility',
        against: 'Spiritual defense',
      },
    },
    cost: {
      focus: 0, // Can use 2 focus to trigger after Bite, or 2 actions standalone
    },
  },
  {
    id: 'larkin-invested-healing',
    name: 'Invested Healing',
    type: 'utility',
    actionCost: 'free',
    range: 'self',
    description: 'Spend 1 Investiture to recover 5 (1d6 + 2) health.',
    utility: {
      target: 'self',
      effect: 'Recover 5 (1d6 + 2) health',
    },
    cost: {
      investiture: 1,
    },
  },
  {
    id: 'larkin-weak-wings',
    name: 'Weak Wings',
    type: 'passive',
    actionCost: 'free',
    range: 'self',
    description:
      "The larkin can't fly further than their flying rate on a turn, even if they use the Move action again.",
    passive: {
      description: 'Flight limitation',
      effects: ['Can fly max 20 ft. per turn'],
    },
  },
];

export const PET_STAT_BLOCKS: Record<string, PetStatBlock> = {
  larkin: {
    id: 'larkin',
    name: 'Larkin',
    type: 'Special Companion – Small Animal',
    species: 'Larkin',
    intelligence: 'animal',
    behavior: 'Alert and efficient scout',
    health: {
      current: 14,
      max: 14,
    },
    focus: {
      current: 4,
      max: 4,
    },
    movement: {
      ground: 30,
      flying: 20,
    },
    senses: {
      range: 20,
      types: ['sight'],
    },
    deflect: 2,
    physicalSkills: {
      Agility: 5,
    },
    spiritualSkills: {
      Insight: 4,
      Perception: 5,
      Survival: 4,
    },
    languages: "understands every Rosharan language, but can't speak",
    abilities: LARKIN_ABILITIES,
    specialTraits: ['Weak Wings'],
    description:
      'A small insectoid companion with a carapace. Can drain Investiture and Stormlight. Weak fliers due to wing limitations.',
    source: 'Rosharan Creature Compendium',
  },
  chickenhawk: {
    id: 'chickenhawk',
    name: 'Chickenhawk',
    type: 'Special Companion – Small Animal',
    species: 'Chickenhawk',
    intelligence: 'animal',
    behavior: 'Protective and loyal',
    health: {
      current: 10,
      max: 10,
    },
    focus: {
      current: 2,
      max: 2,
    },
    movement: {
      ground: 20,
      flying: 40,
    },
    senses: {
      range: 30,
      types: ['sight'],
    },
    deflect: 1,
    physicalSkills: {
      Agility: 4,
    },
    abilities: [
      {
        id: 'chickenhawk-peck',
        name: 'Peck',
        type: 'attack',
        actionCost: '1-action',
        range: '5 ft.',
        description: 'Melee attack with sharp talons and beak.',
        attack: {
          bonus: 4,
          reach: '5 ft.',
          target: 'one target',
          onHit: [
            { statistic: 'keen', bonus: 3, dice: '1d6', description: '6 (1d6 + 3) keen damage' },
          ],
        },
      },
      {
        id: 'chickenhawk-swift-strike',
        name: 'Swift Strike',
        type: 'utility',
        actionCost: '1-action',
        range: '5 ft.',
        description: 'Move and attack in quick succession.',
        utility: {
          target: 'one target',
          effect: 'Move up to 30 ft. and make one Peck attack',
        },
      },
      {
        id: 'chickenhawk-aerial-recon',
        name: 'Aerial Reconnaissance',
        type: 'utility',
        actionCost: '1-action',
        range: '100 ft.',
        description: 'Scout from above, seeing what others cannot.',
        utility: {
          target: 'area',
          effect: 'Fly up to 40 ft. and observe enemies within 60 ft.',
        },
      },
    ],
    description:
      'A fierce avian companion, a cross between a chicken and a hawk. Excellent aerial scout.',
    source: 'Sanderson RPG Companions',
  },
  'armored-hound': {
    id: 'armored-hound',
    name: 'Armored Hound',
    type: 'Special Companion – Medium Animal',
    species: 'Hound',
    intelligence: 'animal',
    behavior: 'Loyal and battle-hardened',
    health: {
      current: 20,
      max: 20,
    },
    focus: {
      current: 3,
      max: 3,
    },
    movement: {
      ground: 50,
    },
    senses: {
      range: 40,
      types: ['sight', 'smell'],
    },
    deflect: 3,
    physicalSkills: {
      Agility: 3,
      Athleticism: 4,
    },
    abilities: [
      {
        id: 'hound-bite',
        name: 'Bite',
        type: 'attack',
        actionCost: '1-action',
        range: '5 ft.',
        description: 'Powerful bite attack.',
        attack: {
          bonus: 5,
          reach: '5 ft.',
          target: 'one target',
          onHit: [
            { statistic: 'force', bonus: 4, dice: '1d8', description: '12 (1d8 + 4) force damage' },
          ],
        },
      },
      {
        id: 'hound-protective-stance',
        name: 'Protective Stance',
        type: 'utility',
        actionCost: '1-action',
        range: 'self',
        description: 'Guard a nearby ally, reducing incoming damage.',
        utility: {
          target: 'self',
          effect: 'Grant advantage on defense saves to nearby allies',
        },
      },
      {
        id: 'hound-pack-tactics',
        name: 'Pack Tactics',
        type: 'utility',
        actionCost: '1-action',
        range: '10 ft.',
        description: 'Coordinate with nearby allies for advantage.',
        utility: {
          target: 'self and nearby allies',
          effect: 'Grant advantage on attack rolls if ally is within 10 ft. of target',
        },
      },
    ],
    description:
      'A stalwart canine companion, magically protected and trained for combat. Excellent defense.',
    source: 'Sanderson RPG Companions',
  },
  'spren-familiar': {
    id: 'spren-familiar',
    name: 'Spren Familiar',
    type: 'Special Companion – Tiny Elemental',
    species: 'Spren',
    intelligence: 'sapient',
    behavior: 'Magical and curious',
    health: {
      current: 8,
      max: 8,
    },
    focus: {
      current: 6,
      max: 6,
    },
    movement: {
      flying: 50,
    },
    senses: {
      range: 60,
      types: ['sight', 'magical sense'],
    },
    deflect: 2,
    spiritualSkills: {
      Insight: 5,
      Perception: 5,
      Lore: 4,
    },
    abilities: [
      {
        id: 'spren-spell-resonance',
        name: 'Spell Resonance',
        type: 'utility',
        actionCost: '1-action',
        range: '30 ft.',
        description: 'Amplify magical effects within range.',
        utility: {
          target: 'one spell effect',
          effect: "Increase spell's effect radius or potency",
        },
        cost: {
          focus: 2,
        },
      },
      {
        id: 'spren-ethereal-form',
        name: 'Ethereal Form',
        type: 'utility',
        actionCost: '1-action',
        range: 'self',
        description: 'Become partially ethereal, phasing through obstacles.',
        utility: {
          target: 'self',
          effect: 'Move through solid objects (but not creatures) until end of turn',
        },
        cost: {
          focus: 1,
        },
      },
    ],
    description:
      'A small spren bound to serve as a magical companion. Excellent for magical support.',
    source: 'Sanderson RPG Companions',
  },
  'storm-drake': {
    id: 'storm-drake',
    name: 'Storm Drake',
    type: 'Special Companion – Small Dragon',
    species: 'Drake',
    intelligence: 'sapient',
    behavior: 'Fierce and storm-aligned',
    health: {
      current: 25,
      max: 25,
    },
    focus: {
      current: 5,
      max: 5,
    },
    movement: {
      ground: 30,
      flying: 60,
    },
    senses: {
      range: 50,
      types: ['sight', 'storm sense'],
    },
    deflect: 2,
    physicalSkills: {
      Agility: 5,
      Athleticism: 5,
    },
    abilities: [
      {
        id: 'drake-bite',
        name: 'Bite',
        type: 'attack',
        actionCost: '1-action',
        range: '5 ft.',
        description: 'Dragon bite with electrical damage.',
        attack: {
          bonus: 6,
          reach: '5 ft.',
          target: 'one target',
          onHit: [
            { statistic: 'spark', bonus: 4, dice: '2d6', description: '14 (2d6 + 4) spark damage' },
          ],
        },
      },
      {
        id: 'drake-storm-breath',
        name: 'Storm Breath',
        type: 'utility',
        actionCost: '2-actions',
        range: '30 ft.',
        description: 'Unleash a cone of lightning and storm energy.',
        utility: {
          target: 'cone 30 ft.',
          effect:
            'All creatures in area take 12 (3d6) spark damage, or half on successful Agility save',
        },
        cost: {
          focus: 2,
        },
      },
      {
        id: 'drake-lightning-aura',
        name: 'Lightning Aura',
        type: 'passive',
        actionCost: 'free',
        range: '5 ft.',
        description: 'Ambient electricity surrounds the drake, hurting those who strike it.',
        passive: {
          description: 'Electrical aura',
          effects: ['Creatures that hit the drake with melee attacks take 3 (1d6) spark damage'],
        },
      },
    ],
    description:
      'A small dragon-like creature attuned to the storms. A rare and powerful companion.',
    source: 'Sanderson RPG Companions',
  },
  'demo-companion': {
    id: 'demo-companion',
    name: 'Demo Companion',
    type: 'Special Companion – Training Creature',
    species: 'Training Creature',
    intelligence: 'animal',
    behavior: 'Friendly and eager to help',
    health: {
      current: 12,
      max: 12,
    },
    focus: {
      current: 3,
      max: 3,
    },
    movement: {
      ground: 30,
    },
    senses: {
      range: 30,
      types: ['sight'],
    },
    deflect: 1,
    abilities: [
      {
        id: 'demo-friendly-swat',
        name: 'Friendly Swat',
        type: 'attack',
        actionCost: '1-action',
        range: '5 ft.',
        description: 'A gentle tap to show the mechanics.',
        attack: {
          bonus: 3,
          reach: '5 ft.',
          target: 'one target',
          onHit: [
            { statistic: 'force', bonus: 1, dice: '1d4', description: '3 (1d4 + 1) force damage' },
          ],
        },
      },
      {
        id: 'demo-learn-quickly',
        name: 'Learn Quickly',
        type: 'passive',
        actionCost: 'free',
        range: 'self',
        description: 'Perfect for testing new companion features.',
        passive: {
          description: 'Testing aid',
          effects: ['Can be used to test all companion mechanics safely'],
        },
      },
    ],
    description:
      'A friendly demonstration companion. Perfect for testing and learning how pets work.',
    source: 'Sanderson RPG Companions',
  },
};

// ===== HELPER FUNCTIONS =====

export function getPetById(id: string): InventoryItem | undefined {
  return PET_ITEMS.find((pet) => pet.id === id);
}

export function getPetProperties(pet: InventoryItem): PetProperties | undefined {
  return pet.properties as PetProperties | undefined;
}

export function getPetStatBlock(id: string): PetStatBlock | undefined {
  return PET_STAT_BLOCKS[id];
}

export function createPetCompanion(id: string): PetCompanion | undefined {
  const statBlock = getPetStatBlock(id);
  if (!statBlock) return undefined;
  return new PetCompanion(statBlock);
}
