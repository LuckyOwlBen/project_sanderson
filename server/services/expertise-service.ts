import {
  loadCharacter,
  getSelectedExpertises,
  replaceSelectedExpertises,
  getExpertiseStateRecord,
  createExpertiseStateRecord,
  updateExpertiseStateRecord,
  ExpertiseRecord
} from '../database';

export interface ExpertiseSelection {
  name: string;
  source?: string; // 'culture' | 'talent' | 'gm' | 'manual'
  sourceId?: string;
  category?: string;
  level?: number;
}

export interface ExpertiseStateDTO {
  characterId: string;
  totalPoints: number;
  pointsSpent: number;
  pointsRemaining: number;
  finalized: boolean;
  expertise: ExpertiseSelection[];
}

export interface ValidationError {
  valid: false;
  error: string;
}

export interface ValidationSuccess {
  valid: true;
}

export type ValidationResult = ValidationSuccess | ValidationError;

export function createEmptyExpertiseDTO(characterId: string): ExpertiseStateDTO {
  return {
    characterId,
    totalPoints: 0,
    pointsSpent: 0,
    pointsRemaining: 0,
    finalized: false,
    expertise: []
  };
}

async function getCharacterLevel(characterId: string): Promise<number> {
  const character = await loadCharacter(characterId);
  return character?.level ?? 1;
}

async function getCharacterIntellect(characterId: string): Promise<number> {
  const character = await loadCharacter(characterId);
  return character?.attributes?.intellect ?? 0;
}

/**
 * Validate that expertise selection doesn't exceed available Intellect points.
 * Non-cultural expertises count toward points spent.
 */
function validateExpertiseSelection(
  totalPoints: number,
  selectedExpertise: ExpertiseSelection[]
): ValidationResult {
  // Count non-cultural expertises (those that consume Intellect points)
  const nonCulturalCount = selectedExpertise.filter(
    exp => exp.source !== 'culture'
  ).length;

  if (nonCulturalCount > totalPoints) {
    return {
      valid: false,
      error: `You have selected ${nonCulturalCount} expertise(s) but only have ${totalPoints} Intellect point(s) available`
    };
  }

  return { valid: true };
}

export async function getExpertiseByCharacterId(characterId: string): Promise<ExpertiseStateDTO> {
  // Expertise points are derived from Intellect attribute
  const totalPoints = await getCharacterIntellect(characterId);

  // Load expertise selections from database
  const dbExpertises = await getSelectedExpertises(characterId);
  const expertise: ExpertiseSelection[] = dbExpertises.map(exp => ({
    name: exp.name,
    source: exp.source,
    sourceId: exp.sourceId
  }));

  // Count non-cultural expertises as pointsSpent
  const pointsSpent = expertise.filter(exp => exp.source !== 'culture').length;
  const pointsRemaining = Math.max(0, totalPoints - pointsSpent);

  // Load or initialize expertise state record
  let stateRecord = await getExpertiseStateRecord(characterId);
  if (!stateRecord) {
    stateRecord = await createExpertiseStateRecord({
      characterId,
      totalPoints,
      pointsSpent,
      pointsRemaining,
      finalized: false
    });
  } else {
    // Update state record with current calculations
    stateRecord = await updateExpertiseStateRecord(characterId, {
      totalPoints,
      pointsSpent,
      pointsRemaining
    });
  }

  return {
    characterId,
    totalPoints,
    pointsSpent,
    pointsRemaining,
    finalized: stateRecord.finalized,
    expertise
  };
}

export async function setExpertiseByCharacterId(
  characterId: string,
  selectedExpertise: ExpertiseSelection[]
): Promise<ExpertiseStateDTO | ValidationError> {
  // Expertise points are derived from Intellect attribute
  const totalPoints = await getCharacterIntellect(characterId);

  // Validate expertise selection against Intellect
  const validation = validateExpertiseSelection(totalPoints, selectedExpertise);
  if (!validation.valid) {
    return validation;
  }

  // Count non-cultural expertises as pointsSpent
  const pointsSpent = selectedExpertise.filter(exp => exp.source !== 'culture').length;
  const pointsRemaining = Math.max(0, totalPoints - pointsSpent);

  // Convert to ExpertiseRecord format for DB
  const dbExpertises: ExpertiseRecord[] = selectedExpertise.map(exp => ({
    name: exp.name,
    source: exp.source || 'manual',
    sourceId: exp.sourceId
  }));

  // Replace expertise selections in database
  await replaceSelectedExpertises(characterId, dbExpertises);

  // Update/create expertise state record
  let stateRecord = await getExpertiseStateRecord(characterId);
  if (!stateRecord) {
    stateRecord = await createExpertiseStateRecord({
      characterId,
      totalPoints,
      pointsSpent,
      pointsRemaining,
      finalized: false
    });
  } else {
    stateRecord = await updateExpertiseStateRecord(characterId, {
      totalPoints,
      pointsSpent,
      pointsRemaining
    });
  }

  return {
    characterId,
    totalPoints,
    pointsSpent,
    pointsRemaining,
    finalized: stateRecord.finalized,
    expertise: selectedExpertise
  };
}

/**
 * Add talent-granted expertises to a character's existing selection.
 * Bypasses point validation since talent grants are free (not drawing from Intellect).
 * Skips any expertise that the character already has (by name).
 */
export async function addTalentGrantedExpertises(
  characterId: string,
  expertiseChoices: Array<{ talentId: string; choices: string[] }>
): Promise<void> {
  const existing = await getSelectedExpertises(characterId);
  const existingNames = new Set(existing.map(e => e.name));

  const toAdd: ExpertiseRecord[] = [];
  for (const { talentId, choices } of expertiseChoices) {
    for (const name of choices) {
      if (!existingNames.has(name)) {
        toAdd.push({ name, source: 'talent', sourceId: `talent:${talentId}` });
        existingNames.add(name);
      }
    }
  }

  if (toAdd.length > 0) {
    await replaceSelectedExpertises(characterId, [...existing, ...toAdd]);
    console.log(`[ExpertiseService] Added talent-granted expertises for character ${characterId}:`, toAdd.map(e => e.name));
  }
}

/**
 * Finalize expertises for a character
 * Validates all points are spent, moves spent points to total, and locks from editing
 * 
 * Called during character creation finalization
 */
export async function finalizeExpertisesForCharacter(characterId: string): Promise<void> {
  const existing = await getExpertiseStateRecord(characterId);
  if (!existing) {
    throw new Error(`Expertise state record not found for character ${characterId}`);
  }

  // Validate all points are spent
  if (existing.pointsRemaining > 0) {
    throw new Error(
      `Cannot finalize expertises: ${existing.pointsRemaining} points remaining. All points must be spent.`
    );
  }

  // Finalize: lock in the allocated values
  // totalPoints stays the same (don't double it), pointsRemaining becomes 0
  await updateExpertiseStateRecord(characterId, {
    pointsRemaining: 0,
    finalized: true
  });

  console.log(
    `[ExpertisesFinalization] Finalized expertises for character: ${characterId} with ${existing.pointsSpent} points allocated`
  );
}
