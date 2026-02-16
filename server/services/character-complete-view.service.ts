/**
 * Character Complete View Service
 *
 * Builds a flattened view of a complete character for the review page.
 * Returns display-friendly data without deep nesting.
 */

import { loadCharacter } from '../database';

export interface CompleteCharacterView {
  id: string;
  name: string;
  level: number;
  ancestry: string | null;
  cultures: string[];
  paths: {
    main: string | null;
    specialization: string | null;
  };
  attributes: {
    strength: number;
    speed: number;
    intellect: number;
    willpower: number;
    awareness: number;
    presence: number;
  };
  skills: {
    total: number;
    allocated: number;
  };
  talents: {
    total: number;
    selected: string[];
  };
  expertises: {
    total: number;
    selected: string[];
  };
}

/**
 * Build a flattened view of a complete character
 * @param characterId - Character ID
 * @returns Flattened character data for display
 */
export async function getCompleteCharacterView(
  characterId: string
): Promise<CompleteCharacterView> {
  const character = await loadCharacter(characterId);

  if (!character) {
    throw new Error(`Character not found: ${characterId}`);
  }

  // Get ancestry (simple string)
  const ancestry = character.ancestry || null;

  // Get cultures (array of names)
  const cultures = Array.isArray(character.cultures)
    ? character.cultures.map((c: any) =>
        typeof c === 'string' ? c : c.culture || c.name || String(c)
      )
    : [];

  // Get paths (paths is an array of path names)
  const pathsArray = Array.isArray(character.paths) ? character.paths : [];
  const paths = {
    main: pathsArray.length > 0 ? pathsArray[0] : null,
    specialization: pathsArray.length > 1 ? pathsArray[1] : null,
  };

  // Get attributes (with defaults)
  const attributes = {
    strength: character.attributes?.strength ?? 0,
    speed: character.attributes?.speed ?? 0,
    intellect: character.attributes?.intellect ?? 0,
    willpower: character.attributes?.willpower ?? 0,
    awareness: character.attributes?.awareness ?? 0,
    presence: character.attributes?.presence ?? 0,
  };

  // Get skills summary (skills is an object: { skillName: value })
  const skillsData = character.skills || {};
  const skillEntries = Object.entries(skillsData);
  const skills = {
    total: skillEntries.length,
    allocated: skillEntries.reduce(
      (sum: number, [_, value]: [string, any]) => sum + (Number(value) || 0),
      0
    ),
  };

  // Get talents summary (unlockedTalents is an array of talent IDs)
  const talentsArray = Array.isArray(character.unlockedTalents) ? character.unlockedTalents : [];
  const talents = {
    total: talentsArray.length,
    selected: talentsArray.map((t: any) => (typeof t === 'string' ? t : String(t))),
  };

  // Get expertises summary (selectedExpertises is an array of expertise objects)
  const expertisesArray = Array.isArray(character.selectedExpertises)
    ? character.selectedExpertises
    : [];
  const expertises = {
    total: expertisesArray.length,
    selected: expertisesArray.map((e: any) => (typeof e === 'string' ? e : e.name || String(e))),
  };

  return {
    id: character.id,
    name: character.name,
    level: character.level,
    ancestry,
    cultures,
    paths,
    attributes,
    skills,
    talents,
    expertises,
  };
}
