/**
 * CharacterRepository - Data Access Layer
 * 
 * Orchestrates loading and saving Character instances with the database.
 * Provides:
 * - Conversion between CharacterDTO (persistence) and Character (domain model)
 * - Module-level repositories for individual character aspects
 * - Full character load/save operations
 * 
 * The repository bridges the gap between:
 * - CharacterDTO: Flat serializable structure for persistence
 * - Character: Rich domain model with business logic and managers
 */

import { Character } from '../character/character';
import { CharacterDTO, createEmptyCharacterDTO } from '../data-access/character-dto';
import {
  loadCharacter as dbLoadCharacter,
  saveCharacter as dbSaveCharacter,
  listCharacters,
  deleteCharacter,
  unlockTalent
} from '../database';
import { Attributes } from '../character/attributes/attributes';

// Import all module repositories
import {
  IdentityModuleRepository,
  ProgressionModuleRepository,
  AncestryModuleRepository,
  AttributesModuleRepository,
  SkillsModuleRepository,
  TalentsModuleRepository,
  ExpertisesModuleRepository,
  ResourcesModuleRepository,
  SingerFormsModuleRepository,
  CombatModuleRepository,
  InventoryModuleRepository,
  MetadataModuleRepository,
  RadiantPathModuleRepository
} from './modules';
import { ExpertiseSourceType } from '../character/expertises/expertiseSource';


export class CharacterRepository {
  // ============================================================================
  // MODULE REPOSITORIES - Delegate to specialized module repositories
  // ============================================================================
  readonly identity = new IdentityModuleRepository();
  readonly progression = new ProgressionModuleRepository();
  readonly ancestry = new AncestryModuleRepository();
  readonly attributes = new AttributesModuleRepository();
  readonly skills = new SkillsModuleRepository();
  readonly talents = new TalentsModuleRepository();
  readonly expertises = new ExpertisesModuleRepository();
  readonly resources = new ResourcesModuleRepository();
  readonly singerForms = new SingerFormsModuleRepository();
  readonly combat = new CombatModuleRepository();
  readonly inventory = new InventoryModuleRepository();
  readonly metadata = new MetadataModuleRepository();
  readonly radiantPath = new RadiantPathModuleRepository();

  // ============================================================================
  // FULL CHARACTER OPERATIONS
  // ============================================================================

  /**
   * Load a character by ID and hydrate it to a Character instance
   * @param characterId - The ID of the character to load
   * @returns Character instance or null if not found
   */
  async load(characterId: string): Promise<Character | null> {
    const dto = await dbLoadCharacter(characterId);
    if (!dto) return null;
    return this.fromDTO(dto as unknown as CharacterDTO);
  }

  /**
   * Save a character instance to the database
   * @param character - The Character instance to save
   * @returns Success status
   */
  async save(character: Character): Promise<{ success: boolean; error?: string }> {
    try {
      const dto = this.toDTO(character);
      await dbSaveCharacter(dto as any);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * List all characters
   * @returns Array of character DTOs
   */
  async list(): Promise<CharacterDTO[]> {
    const characters = await listCharacters();
    return characters as unknown as CharacterDTO[];
  }

  /**
   * Delete a character by ID
   * @param characterId - Character ID to delete
   * @returns Success status
   */
  async delete(characterId: string): Promise<{ success: boolean; error?: string }> {
    const result = await deleteCharacter(characterId);
    return result;
  }

  // ============================================================================
  // CONVERSION METHODS - Between CharacterDTO and Character
  // ============================================================================

  /**
   * Convert CharacterDTO (persisted data) to Character (domain model)
   * @param dto - CharacterDTO from database
   * @returns Hydrated Character instance
   */
  fromDTO(dto: CharacterDTO): Character {
    const character = new Character();

    // MODULE 1: IDENTITY
    character.id = dto.id;
    character.name = dto.name;

    // MODULE 2: PROGRESSION
    character.level = dto.level;
    character.pendingLevelPoints = dto.pendingLevelPoints;

    // MODULE 3: ANCESTRY/CULTURE
    character.ancestry = dto.ancestry as any; // TODO: Hydrate from ancestry ID if needed
    character.cultures = dto.cultures as any; // TODO: Hydrate from culture names if needed
    character.paths = dto.paths;

    // MODULE 4: ATTRIBUTES
    if (dto.attributes) {
      character.attributes.strength = dto.attributes.strength;
      character.attributes.speed = dto.attributes.speed;
      character.attributes.intellect = dto.attributes.intellect;
      character.attributes.willpower = dto.attributes.willpower;
      character.attributes.awareness = dto.attributes.awareness;
      character.attributes.presence = dto.attributes.presence;
      (character.attributes as any).totalPoints = (dto.attributes as any).totalPoints ?? 0;
      (character.attributes as any).pointsSpent = (dto.attributes as any).pointsSpent ?? 0;
      (character.attributes as any).pointsRemaining = (dto.attributes as any).pointsRemaining ?? 0;
      (character.attributes as any).finalized = (dto.attributes as any).finalized ?? false;
    }

    // MODULE 5: SKILLS - SkillManager handles this internally
    // TODO: Hydrate skills from dto.skills

    // MODULE 6: TALENTS
    character.unlockedTalents = new Set(dto.unlockedTalents || []);
    if (dto.baselineUnlockedTalents) {
      character.baselineUnlockedTalents = new Set(dto.baselineUnlockedTalents);
    }

    // MODULE 7: EXPERTISES
    character.selectedExpertises = (dto.selectedExpertises || []).map((exp: any) => ({
      ...exp,
      source: exp.source as ExpertiseSourceType
    }));

    // MODULE 8: RESOURCES - ResourceManager handles this internally
    // TODO: Hydrate resources into resourceManager

    // MODULE 9: SINGER FORMS
    character.unlockedSingerForms = dto.unlockedSingerForms || [];
    character.activeForm = dto.activeForm;

    // MODULE 10: COMBAT
    character.activeStanceId = dto.activeStanceId;

    // MODULE 11: INVENTORY - InventoryManager handles this internally
    // TODO: Hydrate inventory into inventoryManager

    // MODULE 12: BONUSES - BonusManager handles this internally
    // TODO: Hydrate bonuses if persisted

    // MODULE 13: RADIANT PATH - RadiantPathManager handles this internally
    // TODO: Hydrate radiant path state

    // MODULE 14: CRAFTING - CraftingManager handles this internally
    // TODO: Hydrate crafting state

    // MODULE 15: METADATA
    character.sessionNotes = dto.sessionNotes;
    character.lastModified = dto.lastModified;

    return character;
  }

  /**
   * Convert Character (domain model) to CharacterDTO (persistable form)
   * @param character - Character instance
   * @returns CharacterDTO ready for persistence
   */
  toDTO(character: Character): CharacterDTO {
    return {
      // MODULE 1: IDENTITY
      id: character.id,
      name: character.name,

      // MODULE 2: PROGRESSION
      level: character.level,
      pendingLevelPoints: character.pendingLevelPoints,

      // MODULE 3: ANCESTRY/CULTURE
      ancestry: character.ancestry || null,
      cultures: character.cultures.map(c => c.name),
      paths: character.paths,

      // MODULE 4: ATTRIBUTES
      attributes: {
        strength: character.attributes.strength,
        speed: character.attributes.speed,
        intellect: character.attributes.intellect,
        willpower: character.attributes.willpower,
        awareness: character.attributes.awareness,
        presence: character.attributes.presence
      },

      // MODULE 5: SKILLS
      skills: {}, // TODO: Extract from skillManager

      // MODULE 6: TALENTS
      unlockedTalents: Array.from(character.unlockedTalents),
      baselineUnlockedTalents: character.baselineUnlockedTalents
        ? Array.from(character.baselineUnlockedTalents)
        : undefined,

      // MODULE 7: EXPERTISES
      selectedExpertises: character.selectedExpertises,

      // MODULE 8: RESOURCES
      resources: {
        health: {
          current: character.resources.health.current,
          max: character.resources.health.max
        },
        focus: {
          current: character.resources.focus.current,
          max: character.resources.focus.max
        },
        investiture: {
          current: character.resources.investiture.current,
          max: character.resources.investiture.max,
          isActive: character.resources.investiture.isActive()
        }
      },

      // MODULE 9: SINGER FORMS
      unlockedSingerForms: character.unlockedSingerForms,
      activeForm: character.activeForm,

      // MODULE 10: COMBAT
      activeStanceId: character.activeStanceId,

      // MODULE 11: INVENTORY
      inventory: {
        items: [], // TODO: Extract from inventoryManager
        equipped: {
          armor: null,
          weapons: []
        }
      },

      // MODULE 13: RADIANT PATH
      radiantPath: {
        currentIdeal: 1, // TODO: Extract from radiantPathManager
        currentOath: null,
        hasSpren: false
      },

      // MODULE 15: METADATA
      sessionNotes: character.sessionNotes,
      lastModified: character.lastModified
    };
  }
}

// Export singleton instance
export const characterRepository = new CharacterRepository();
