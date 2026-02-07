import { AttributesModuleRepository } from '../repositories/modules/attributes-repository';
import {
  getAttributesRecord,
  createAttributesRecord,
  updateAttributesRecord,
  loadCharacter
} from '../database';
import { attributesService } from './attributes-service';
import { attributesFinalizationService } from './attributes-finalization';
import { pointAllocationService } from './point-allocation-service';

export interface AttributesStateDTO {
  characterId: string;
  totalPoints: number;
  pointsSpent: number;
  pointsRemaining: number;
  strength: number;
  speed: number;
  awareness: number;
  intellect: number;
  willpower: number;
  presence: number;
  finalized: boolean;
  derived: {
    health: number;
    focus: number;
    movement: number;
    recovery: string;
  };
}

const attributesRepository = new AttributesModuleRepository();

/**
 * Get character level, defaulting to 1 if not found
 */
async function getCharacterLevel(characterId: string): Promise<number> {
  const character = await loadCharacter(characterId);
  return character?.level ?? 1;
}

export function createEmptyAttributesDTO(characterId: string): AttributesStateDTO {
  return {
    characterId,
    totalPoints: 12,
    pointsSpent: 0,
    pointsRemaining: 12,
    strength: 0,
    speed: 0,
    awareness: 0,
    intellect: 0,
    willpower: 0,
    presence: 0,
    finalized: false,
    derived: {
      health: 10,
      focus: 0,
      movement: 0,
      recovery: '1d6'
    }
  };
}

export async function getAttributesByCharacterId(characterId: string): Promise<AttributesStateDTO> {
  console.log(`[Attributes] Getting attributes for character: ${characterId}`);
  
  // Load attributes record from database (created during character creation)
  let attributesRecord = await getAttributesRecord(characterId);
  console.log(`[Attributes] Loaded attributes record:`, attributesRecord);

  // Record must exist (created during character creation at level 1)
  // Trust the database values - levelup-manager has already set pointsRemaining correctly
  if (!attributesRecord) {
    throw new Error(`Attributes record not found for character ${characterId}. Character may not have completed creation flow.`);
  }

  // Calculate derived attributes
  const derived = attributesService.calculateDerivedAttributes({
    strength: attributesRecord.strength,
    speed: attributesRecord.speed,
    awareness: attributesRecord.awareness,
    intellect: attributesRecord.intellect,
    willpower: attributesRecord.willpower,
    presence: attributesRecord.presence
  });

  const result = {
    characterId,
    totalPoints: attributesRecord.totalPoints,
    pointsSpent: attributesRecord.pointsSpent,
    pointsRemaining: attributesRecord.pointsRemaining,
    strength: attributesRecord.strength,
    speed: attributesRecord.speed,
    awareness: attributesRecord.awareness,
    intellect: attributesRecord.intellect,
    willpower: attributesRecord.willpower,
    presence: attributesRecord.presence,
    finalized: attributesRecord.finalized,
    derived: {
      health: derived.health,
      focus: derived.focus,
      movement: derived.movement,
      recovery: derived.recovery
    }
  };
  
  console.log(`[Attributes] Returning attributes response:`, result);
  return result;
}

export async function setAttributesByCharacterId(
  characterId: string,
  attributes: {
    strength: number;
    speed: number;
    awareness: number;
    intellect: number;
    willpower: number;
    presence: number;
  }
): Promise<AttributesStateDTO> {
  // Validate attributes structure
  const validation = attributesService.validateAttributeAllocation(attributes);
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }

  // Load attribute record (must exist from character creation)
  let attributesRecord = await getAttributesRecord(characterId);
  if (!attributesRecord) {
    throw new Error(`Attributes record not found for character ${characterId}`);
  }

  // Check if finalized
  if (attributesRecord.finalized) {
    throw new Error('Attributes are finalized and cannot be modified');
  }

  // Calculate points spent
  const pointsSpent =
    Number(attributes.strength) +
    Number(attributes.speed) +
    Number(attributes.intellect) +
    Number(attributes.willpower) +
    Number(attributes.awareness) +
    Number(attributes.presence);

  if (pointsSpent > attributesRecord.pointsRemaining) {
    throw new Error(
      `Attribute allocation exceeded. Available points: ${attributesRecord.pointsRemaining}, attempted ${pointsSpent}.`
    );
  }

  const pointsRemaining = attributesService.calculateRemainingPoints(
    attributesRecord.totalPoints,
    pointsSpent
  );

  // Update database record
  attributesRecord = await updateAttributesRecord(characterId, {
    strength: Number(attributes.strength),
    speed: Number(attributes.speed),
    intellect: Number(attributes.intellect),
    willpower: Number(attributes.willpower),
    awareness: Number(attributes.awareness),
    presence: Number(attributes.presence),
    pointsSpent,
    pointsRemaining
  });

  // Save to character JSON file via repository
  await attributesRepository.save(characterId, {
    strength: attributesRecord.strength,
    speed: attributesRecord.speed,
    intellect: attributesRecord.intellect,
    willpower: attributesRecord.willpower,
    awareness: attributesRecord.awareness,
    presence: attributesRecord.presence
  });

  // Calculate derived attributes
  const derived = attributesService.calculateDerivedAttributes({
    strength: attributesRecord.strength,
    speed: attributesRecord.speed,
    awareness: attributesRecord.awareness,
    intellect: attributesRecord.intellect,
    willpower: attributesRecord.willpower,
    presence: attributesRecord.presence
  });

  return {
    characterId,
    totalPoints: attributesRecord.totalPoints,
    pointsSpent: attributesRecord.pointsSpent,
    pointsRemaining: attributesRecord.pointsRemaining,
    strength: attributesRecord.strength,
    speed: attributesRecord.speed,
    awareness: attributesRecord.awareness,
    intellect: attributesRecord.intellect,
    willpower: attributesRecord.willpower,
    presence: attributesRecord.presence,
    finalized: attributesRecord.finalized,
    derived: {
      health: derived.health,
      focus: derived.focus,
      movement: derived.movement,
      recovery: derived.recovery
    }
  };
}

export async function finalizeAttributesByCharacterId(characterId: string): Promise<{ characterId: string; finalized: boolean }> {
  const attributesRecord = await getAttributesRecord(characterId);

  if (!attributesRecord) {
    throw new Error('Attributes record not found');
  }

  if (attributesRecord.pointsRemaining > 0) {
    throw new Error(
      `Attributes cannot be finalized with ${attributesRecord.pointsRemaining} points remaining`
    );
  }

  await attributesFinalizationService.finalizeAttributesForCharacter(characterId);

  return {
    characterId,
    finalized: true
  };
}
