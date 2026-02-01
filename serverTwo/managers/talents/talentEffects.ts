/**
 * Talent Effects Handler
 * 
 * This module handles special effects that occur when talents are unlocked,
 * such as granting Singer forms or other universal abilities.
 */

import { Character } from '../character';

/**
 * Mapping of talent IDs to the Singer forms they grant
 */
const TALENT_TO_SINGER_FORMS: Record<string, string[]> = {
    'forms_of_finesse': ['nimbleform', 'artform'],
    'forms_of_wisdom': ['meditationform', 'scholarform'],
    'forms_of_resolve': ['warform', 'workform'],
    'forms_of_destruction': ['direform', 'stormform'],
    'forms_of_expansion': ['envoyform', 'relayform'],
    'forms_of_mystery': ['decayform', 'nightform']
};

/**
 * Apply the effects of unlocking a talent
 * This is called when a talent is unlocked and handles special cases
 * like granting Singer forms
 * 
 * @param character - The character unlocking the talent
 * @param talentId - The ID of the talent being unlocked
 */
export function applyTalentEffects(character: Character, talentId: string): void {
    // Check if this talent grants Singer forms
    const formsGranted = TALENT_TO_SINGER_FORMS[talentId];
    if (formsGranted) {
        for (const formId of formsGranted) {
            character.unlockSingerForm(formId);
        }
    }
    
    // Future: Add other special talent effects here
    // - Grant special items
    // - Unlock special abilities
    // - Apply one-time bonuses
    // - etc.
}

/**
 * Check what effects a talent will have when unlocked
 * Useful for previewing what a talent does
 * 
 * @param talentId - The ID of the talent to check
 * @returns Array of effect descriptions
 */
export function getTalentEffectPreview(talentId: string): string[] {
    const effects: string[] = [];
    
    const formsGranted = TALENT_TO_SINGER_FORMS[talentId];
    if (formsGranted) {
        effects.push(`Unlocks Singer forms: ${formsGranted.join(', ')}`);
    }
    
    return effects;
}
