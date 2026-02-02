/**
 * ResourcesModuleRepository - MODULE 8: RESOURCES
 * Handles Health, Focus, and Investiture pools
 */

import { BaseModuleRepository, SaveResult } from './base-module-repository';

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

export class ResourcesModuleRepository extends BaseModuleRepository {
  /**
   * Save resources module
   * @param characterId - Character ID
   * @param resources - Resources object with health, focus, investiture pools
   */
  async save(characterId: string, resources: ResourcesDTO): Promise<SaveResult> {
    return await this.updateCharacterModule(characterId, { resources });
  }

  /**
   * Load resources module data
   * @param characterId - Character ID
   * @returns Resources data or null
   */
  async load(characterId: string): Promise<ResourcesDTO | null> {
    const char = await this.loadCharacterData(characterId);
    if (!char) return null;
    return char.resources || null;
  }
}
