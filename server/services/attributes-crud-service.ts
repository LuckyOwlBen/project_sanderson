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
  
  // Get character level to determine correct point allocation
  const level = await getCharacterLevel(characterId);
  console.log(`[Attributes] Character level: ${level}`);
  
  const totalPoints = pointAllocationService.getTotalAttributePointsAvailable(level);
  console.log(`[Attributes] Total points available for level ${level}: ${totalPoints}`);

  // Load or create attributes record from database
  let attributesRecord = await getAttributesRecord(characterId);
  console.log(`[Attributes] Loaded attributes record:`, attributesRecord);

  // If no record exists, create one with defaults
  if (!attributesRecord) {
    console.log(`[Attributes] No record found, creating with totalPoints: ${totalPoints}`);
    attributesRecord = await createAttributesRecord({
      characterId,
      totalPoints,
      pointsSpent: 0,
      pointsRemaining: totalPoints,
      strength: 0,
      speed: 0,
      intellect: 0,
      willpower: 0,
      awareness: 0,
      presence: 0,
      finalized: false
    });
    console.log(`[Attributes] Created attributes record:`, attributesRecord);
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

  // Get character level to determine correct point allocation
  const level = await getCharacterLevel(characterId);
  const totalPoints = pointAllocationService.getTotalAttributePointsAvailable(level);

  // Load or create attribute record
  let attributesRecord = await getAttributesRecord(characterId);
  if (!attributesRecord) {
    attributesRecord = await createAttributesRecord({
      characterId,
      totalPoints,
      pointsSpent: 0,
      pointsRemaining: totalPoints,
      strength: 0,
      speed: 0,
      intellect: 0,
      willpower: 0,
      awareness: 0,
      presence: 0,
      finalized: false
    });
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

  if (pointsSpent > attributesRecord.totalPoints) {
    throw new Error(
      `Attribute allocation exceeded. Total points: ${attributesRecord.totalPoints}, attempted ${pointsSpent}.`
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
