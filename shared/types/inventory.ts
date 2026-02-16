/**
 * Inventory System - Shared Type Definitions
 *
 * Types for items, inventory, and equipment
 */

import { BonusEffect } from './bonuses';
import { DamageType } from './attacks';

export type ItemType =
  | 'weapon'
  | 'armor'
  | 'equipment'
  | 'consumable'
  | 'mount'
  | 'vehicle'
  | 'fabrial'
  | 'pet';
export type ItemRarity = 'common' | 'reward-only' | 'talent-only';
export type EquipmentSlot = 'mainHand' | 'offHand' | 'armor' | 'accessory' | 'mount';
export type WeaponSkill = 'light-weaponry' | 'heavy-weaponry' | 'athletics';

export interface WeaponProperties {
  skill: WeaponSkill;
  damage: string;
  damageType: DamageType;
  range: string;
  traits: string[];
  expertTraits: string[];
}

export interface ArmorProperties {
  deflectValue: number;
  traits: string[];
  expertTraits: string[];
}

export interface FabrialProperties {
  charges: number;
  currentCharges: number;
  effect: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: ItemType;
  quantity: number;
  weight: number;
  price: number;
  rarity: ItemRarity;
  description: string;
  equipable: boolean;
  stackable: boolean;
  slot?: EquipmentSlot;
  bonuses?: BonusEffect[];
  weaponProperties?: WeaponProperties;
  armorProperties?: ArmorProperties;
  fabrialProperties?: FabrialProperties;
  properties?: Record<string, any>;
}

export interface InventoryItemDTO {
  itemId: string;
  quantity: number;
  equipped: boolean;
}

export interface InventoryDTO {
  items: InventoryItemDTO[];
  equipped: {
    armor: InventoryItemDTO | null;
    weapons: InventoryItemDTO[];
  };
}

export interface InventoryViewItem extends InventoryItem {
  baseId: string;
  quantity: number;
}

export interface StartingKit {
  id: string;
  name: string;
  description: string;
  weapons: { itemId: string; quantity: number }[];
  armor: { itemId: string; quantity: number }[];
  equipment: { itemId: string; quantity: number }[];
  currency: number; // in marks
  additionalExpertise?: string;
  connection?: string;
}

export interface StartingKitDTO {
  id: string;
  name: string;
  description: string;
  weapons: { itemId: string; quantity: number }[];
  armor: { itemId: string; quantity: number }[];
  equipment: { itemId: string; quantity: number }[];
  currency: number;
  additionalExpertise?: string;
  connection?: string;
}

export interface CurrencyConversion {
  chips: number;
  marks: number;
  broams: number;
}

export const CURRENCY_RATES = {
  diamond: { chip: 0.2, mark: 1, broam: 4 },
  garnet: { chip: 1, mark: 5, broam: 20 },
  ruby: { chip: 2, mark: 10, broam: 40 },
  amethyst: { chip: 5, mark: 25, broam: 100 },
  emerald: { chip: 10, mark: 50, broam: 200 },
} as const;
