export interface ExpertiseCategoryList {
  categories: Record<string, string[]>;
}

export class ExpertiseListManager {
  getAvailableExpertise(): ExpertiseCategoryList {
    // TODO: Load expertise definitions from database or configuration
    return {
      categories: {
        combat: [],
        crafting: [],
        magic: [],
        social: [],
        survival: []
      }
    };
  }
}

export const expertiseListManager = new ExpertiseListManager();
