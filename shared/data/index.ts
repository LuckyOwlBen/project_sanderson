/**
 * Shared Data - Main Export
 * 
 * Central export point for all shared data definitions (talents, cultures, expertises, etc.)
 * Import from 'shared/data' instead of individual folders
 */

// Talent Trees and Paths
export * from './talents/talentTrees';

// Cultures
export * from './cultures/allCultures';
export * from './cultures/culturalInterface';

// Expertises
export * from './expertises/allExpertises';

// Skills
export * from './skills/skillTypes';
export * from './skills/skillManager';
export * from './skills/skillAssociationTable';

// Items
// Note: item-definitions.js is Node.js specific, export as needed
