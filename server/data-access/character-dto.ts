/**
 * CharacterDTO - Data Transfer Object for Character persistence
 * 
 * Mirrors the 15 modules of the Character class for serialization and deserialization.
 * This DTO is used when saving/loading from database and file system.
 * 
 * Module-aligned structure:
 * - MODULE 1: IDENTITY
 * - MODULE 2: PROGRESSION
 * - MODULE 3: ANCESTRY/CULTURE
 * - MODULE 4: ATTRIBUTES
 * - MODULE 5: SKILLS
 * - MODULE 6: TALENTS
 * - MODULE 7: EXPERTISES
 * - MODULE 8: RESOURCES
 * - MODULE 9: SINGER FORMS
 * - MODULE 10: COMBAT
 * - MODULE 11: INVENTORY
 * - MODULE 12: BONUSES
 * - MODULE 13: RADIANT PATH
 * - MODULE 14: CRAFTING
 * - MODULE 15: METADATA
 */

export interface AttributesDTO {
  strength: number;
  speed: number;
  intellect: number;
  willpower: number;
  awareness: number;
  presence: number;
}

export interface SkillDTO {
  [skillName: string]: number;
}

export interface ExpertiseSourceDTO {
  name: string;
  source: string;
  sourceId?: string;
}

export interface ResourcePoolDTO {
  current: number;
  max: number;
}

export interface InvestitureResourceDTO extends ResourcePoolDTO {
  isActive: boolean;
}

export interface ResourcesDTO {
  health: ResourcePoolDTO;
  focus: ResourcePoolDTO;
  investiture: InvestitureResourceDTO;
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

export interface BonusEffectDTO {
  type: string;
  target: string;
  value: number;
}

export interface RadiantPathDTO {
  currentIdeal: number;
  currentOath: string | null;
  hasSpren: boolean;
}

export interface CraftingStateDTO {
  inProgress: boolean;
  currentProject?: {
    itemId: string;
    progress: number;
    materials: Record<string, number>;
  };
}

// ============================================================================
// MAIN CHARACTER DTO
// ============================================================================

export interface CharacterDTO {
  // ============================================================================
  // MODULE 1: IDENTITY - Character identification
  // ============================================================================
  id: string;
  name: string;

  // ============================================================================
  // MODULE 2: PROGRESSION - Experience and level tracking
  // ============================================================================
  level: number;
  pendingLevelPoints: number;

  // ============================================================================
  // MODULE 3: ANCESTRY/CULTURE - Character background and heritage
  // ============================================================================
  ancestry: string | null; // Store ancestry ID/name instead of object
  cultures: string[]; // Store culture names/IDs instead of objects
  paths: string[];

  // ============================================================================
  // MODULE 4: ATTRIBUTES - Core character statistics
  // ============================================================================
  attributes: AttributesDTO;

  // ============================================================================
  // MODULE 5: SKILLS - Skill rankings and management
  // ============================================================================
  skills: SkillDTO;

  // ============================================================================
  // MODULE 6: TALENTS - Talent selection and tracking
  // ============================================================================
  unlockedTalents: string[]; // Convert Set to array for JSON
  baselineUnlockedTalents?: string[]; // Convert Set to array for JSON

  // ============================================================================
  // MODULE 7: EXPERTISES - Specialized knowledge domains
  // ============================================================================
  selectedExpertises: ExpertiseSourceDTO[];

  // ============================================================================
  // MODULE 8: RESOURCES - Health, Focus, and Investiture pools
  // ============================================================================
  resources: ResourcesDTO;

  // ============================================================================
  // MODULE 9: SINGER FORMS - Symbiotic form tracking and activation
  // ============================================================================
  unlockedSingerForms: string[];
  activeForm?: string;

  // ============================================================================
  // MODULE 10: COMBAT - Combat stance and attack system
  // ============================================================================
  activeStanceId: string | null;

  // ============================================================================
  // MODULE 11: INVENTORY - Items and equipment management
  // ============================================================================
  inventory: InventoryDTO;

  // ============================================================================
  // MODULE 12: BONUSES - Bonus tracking and application
  // ============================================================================
  // Note: Bonuses are typically calculated/transient and not persisted
  // Include if persistent bonuses are needed
  bonuses?: BonusEffectDTO[];

  // ============================================================================
  // MODULE 13: RADIANT PATH - Oath and ideal tracking for Radians
  // ============================================================================
  radiantPath: RadiantPathDTO;

  // ============================================================================
  // MODULE 14: CRAFTING - Item creation and customization
  // ============================================================================
  crafting?: CraftingStateDTO;

  // ============================================================================
  // MODULE 15: METADATA - Session and modification tracking
  // ============================================================================
  sessionNotes: string;
  lastModified: string;
}

/**
 * Create an empty/default CharacterDTO for a new character
 */
export function createEmptyCharacterDTO(id: string, name: string = ''): CharacterDTO {
  return {
    // MODULE 1: IDENTITY
    id,
    name,

    // MODULE 2: PROGRESSION
    level: 1,
    pendingLevelPoints: 0,

    // MODULE 3: ANCESTRY/CULTURE
    ancestry: null,
    cultures: [],
    paths: [],

    // MODULE 4: ATTRIBUTES
    attributes: {
      strength: 0,
      speed: 0,
      intellect: 0,
      willpower: 0,
      awareness: 0,
      presence: 0
    },

    // MODULE 5: SKILLS
    skills: {},

    // MODULE 6: TALENTS
    unlockedTalents: [],
    baselineUnlockedTalents: [],

    // MODULE 7: EXPERTISES
    selectedExpertises: [],

    // MODULE 8: RESOURCES
    resources: {
      health: { current: 0, max: 0 },
      focus: { current: 0, max: 0 },
      investiture: { current: 0, max: 0, isActive: false }
    },

    // MODULE 9: SINGER FORMS
    unlockedSingerForms: [],
    activeForm: undefined,

    // MODULE 10: COMBAT
    activeStanceId: null,

    // MODULE 11: INVENTORY
    inventory: {
      items: [],
      equipped: {
        armor: null,
        weapons: []
      }
    },

    // MODULE 12: BONUSES
    bonuses: [],

    // MODULE 13: RADIANT PATH
    radiantPath: {
      currentIdeal: 1,
      currentOath: null,
      hasSpren: false
    },

    // MODULE 14: CRAFTING
    crafting: {
      inProgress: false
    },

    // MODULE 15: METADATA
    sessionNotes: '',
    lastModified: new Date().toISOString()
  };
}
