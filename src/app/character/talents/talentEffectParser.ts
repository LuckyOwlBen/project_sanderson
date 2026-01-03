/**
 * Parser for extracting structured effects from talent otherEffects strings.
 * This converts narrative text like "Gain Light Weaponry expertise" into actionable data.
 */

export interface ExpertiseGrant {
  type: 'single' | 'choice';
  expertises: string[];
  choiceCount?: number; // For "choose one" or "choose two"
}

export class TalentEffectParser {
  /**
   * Extract expertise grants from talent otherEffects array
   * 
   * Patterns supported:
   * - "Gain [Name] expertise" → single expertise
   * - "Gain a weapon expertise" → choice from category
   * - "Gain an armor expertise" → choice from category  
   * - "choose one: [A], [B], or [C]" → choice from list
   * - "Gain [A] or [B] expertise" → choice between two
   */
  static parseExpertiseGrants(otherEffects: string[]): ExpertiseGrant[] {
    const grants: ExpertiseGrant[] = [];

    otherEffects.forEach(effect => {
      const lowerEffect = effect.toLowerCase();

      // Pattern 1: "choose one: [A], [B], or [C]" or "(...) (choose one)"
      // Example: "Gain utility expertise in Armor Crafting, Equipment Crafting, or Weapon Crafting (choose one)"
      const chooseOneMatch = effect.match(/(?:gain.*?in\s+)?([^.()]+?)\s*\(choose\s+one\)/i);
      if (chooseOneMatch) {
        const optionsText = chooseOneMatch[1];
        const options = this.parseCommaSeparatedList(optionsText);
        if (options.length > 0) {
          grants.push({
            type: 'choice',
            expertises: options,
            choiceCount: 1
          });
          return;
        }
      }

      // Pattern 2: "choose one: [list]" or "choose two: [list]"
      const chooseMatch = effect.match(/choose\s+(one|two):\s*(.+)/i);
      if (chooseMatch) {
        const count = chooseMatch[1].toLowerCase() === 'one' ? 1 : 2;
        const optionsText = chooseMatch[2];
        const options = this.parseCommaSeparatedList(optionsText);
        if (options.length > 0) {
          grants.push({
            type: 'choice',
            expertises: options,
            choiceCount: count
          });
          return;
        }
      }

      // Pattern 3: "Gain [A] or [B] expertise"
      // Example: "Gain Light Weaponry or Heavy Weaponry expertise"
      const orMatch = effect.match(/gain\s+(.+?)\s+or\s+(.+?)\s+expertise/i);
      if (orMatch) {
        grants.push({
          type: 'choice',
          expertises: [orMatch[1].trim(), orMatch[2].trim()],
          choiceCount: 1
        });
        return;
      }

      // Pattern 4: "gain a [category] expertise"
      // Example: "gain a weapon expertise", "gain an armor expertise"
      const categoryMatch = effect.match(/gain\s+an?\s+(\w+)\s+expertise/i);
      if (categoryMatch) {
        const category = categoryMatch[1].toLowerCase();
        const categoryOptions = this.getExpertisesByCategory(category);
        if (categoryOptions.length > 0) {
          grants.push({
            type: 'choice',
            expertises: categoryOptions,
            choiceCount: 1
          });
          return;
        }
      }

      // Pattern 5: "Gain [Specific Name] expertise"
      // Example: "Gain Sleight of Hand expertise"
      // This should be last to avoid matching generic patterns
      const specificMatch = effect.match(/gain\s+([A-Z][a-zA-Z\s]+?)\s+expertise/i);
      if (specificMatch) {
        const expertiseName = specificMatch[1].trim();
        // Exclude generic patterns like "a weapon" or "an armor"
        if (!expertiseName.match(/^(a|an)\s/i)) {
          grants.push({
            type: 'single',
            expertises: [expertiseName]
          });
          return;
        }
      }
    });

    return grants;
  }

  /**
   * Parse comma-separated list with "and", "or", or "/" conjunctions
   * Example: "Armor Crafting, Equipment Crafting, or Weapon Crafting"
   * Example: "Armor/Equipment/Weapon Crafting" (slash-separated with common suffix)
   */
  private static parseCommaSeparatedList(text: string): string[] {
    // Remove parentheticals and extra whitespace
    const cleaned = text.replace(/\([^)]*\)/g, '').trim();
    
    // Check for slash-separated format with common suffix (e.g., "Armor/Equipment/Weapon Crafting")
    // Pattern: word1/word2/word3 suffix
    const slashWithSuffixMatch = cleaned.match(/^(.+?)\/(.+?)\s+(\S+)$/);
    if (slashWithSuffixMatch) {
      // Extract all slash-separated prefixes and the common suffix
      const allPrefixes = slashWithSuffixMatch[0].split(/\s+/)[0]; // Get the "Armor/Equipment/Weapon" part
      const suffix = slashWithSuffixMatch[3]; // Get "Crafting"
      
      const prefixes = allPrefixes.split('/');
      
      // Combine each prefix with the suffix
      return prefixes.map(prefix => {
        const combined = `${prefix.trim()} ${suffix}`;
        // Capitalize properly
        return combined.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      });
    }
    
    // Standard parsing with commas, "and", "or"
    const parts = cleaned.split(/,|\s+and\s+|\s+or\s+/i);
    
    return parts
      .map(p => p.trim())
      .filter(p => p.length > 0 && !p.match(/^(a|an|the)\s/i))
      .map(p => {
        // Capitalize first letter of each word
        return p.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      });
  }

  /**
   * Get expertise options by category keyword
   */
  private static getExpertisesByCategory(category: string): string[] {
    switch (category) {
      case 'weapon':
        return ['Light Weaponry', 'Heavy Weaponry', 'Special Weapons'];
      case 'armor':
        return ['Armor Proficiency'];
      case 'utility':
      case 'crafting':
        return ['Armor Crafting', 'Weapon Crafting', 'Equipment Crafting', 'Fabrial Crafting'];
      case 'cultural':
        return ['Alethi', 'Azish', 'Herdazian', 'Iriali', 'Kharbranthian', 'Listener', 
                'Natan', 'Reshi', 'Shin', 'Thaylen', 'Unkalaki', 'Veden', 'Wayfarer'];
      default:
        return [];
    }
  }

  /**
   * Check if an effect grants any expertises
   */
  static grantsExpertise(otherEffects: string[]): boolean {
    return this.parseExpertiseGrants(otherEffects).length > 0;
  }

  /**
   * Get all unique expertise names from grants (for validation/display)
   */
  static getAllExpertiseOptions(grants: ExpertiseGrant[]): string[] {
    const allOptions = new Set<string>();
    grants.forEach(grant => {
      grant.expertises.forEach(exp => allOptions.add(exp));
    });
    return Array.from(allOptions);
  }
}
