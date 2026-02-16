import { Injectable } from '@angular/core';
import { CulturalInterface } from '../character/culture/culturalInterface';
import { ALL_CULTURES } from '../character/culture/allCultures';

@Injectable({ providedIn: 'root' })
export class CulturesService {
  private allCultures = ALL_CULTURES;

  /**
   * Get all available cultures
   */
  getAllCultures(): CulturalInterface[] {
    return this.allCultures;
  }

  /**
   * Get a culture by name
   * @param cultureName - The name of the culture to find
   * @returns The culture interface or undefined
   */
  getCultureByName(cultureName: string): CulturalInterface | undefined {
    return this.allCultures.find(c => c.name === cultureName);
  }

  /**
   * Get suggested names for one or more cultures
   * @param cultureNames - Array of culture names
   * @returns Combined set of suggested names from all cultures
   */
  getSuggestedNames(cultureNames: string[]): string[] {
    const allNames = new Set<string>();
    
    cultureNames.forEach(cultureName => {
      const culture = this.getCultureByName(cultureName);
      if (culture && culture.suggestedNames) {
        culture.suggestedNames.forEach(name => allNames.add(name));
      }
    });
    
    return Array.from(allNames);
  }

  /**
   * Get image placeholder (gradient) for a culture
   * @param cultureName - The name of the culture
   * @returns CSS gradient string for the placeholder
   */
  getImagePlaceholder(cultureName: string): string {
    const placeholders: { [key: string]: string } = {
      'Alethi': 'linear-gradient(135deg, #8B4513 0%, #D2691E 100%)',
      'Azish': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
      'Herdazian': 'linear-gradient(135deg, #228B22 0%, #32CD32 100%)',
      'Iriali': 'linear-gradient(135deg, #FF6347 0%, #FF4500 100%)',
      'Kharbranthian': 'linear-gradient(135deg, #4169E1 0%, #1E90FF 100%)',
      'Listener': 'linear-gradient(135deg, #800080 0%, #9932CC 100%)',
      'Natan': 'linear-gradient(135deg, #20B2AA 0%, #48D1CC 100%)',
      'Reshi': 'linear-gradient(135deg, #00CED1 0%, #40E0D0 100%)',
      'Shin': 'linear-gradient(135deg, #F0E68C 0%, #EEE8AA 100%)',
      'Thaylen': 'linear-gradient(135deg, #2F4F4F 0%, #708090 100%)',
      'Unkalaki': 'linear-gradient(135deg, #A0522D 0%, #CD853F 100%)',
      'Veden': 'linear-gradient(135deg, #DC143C 0%, #B22222 100%)',
      'Wayfarer': 'linear-gradient(135deg, #696969 0%, #808080 100%)'
    };
    return placeholders[cultureName] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  }

  /**
   * Get image URL path for a culture
   * @param cultureName - The name of the culture
   * @returns Image URL path
   */
  getImageUrl(cultureName: string): string {
    const fileName = cultureName.toLowerCase().replace(/\s+/g, '-');
    return `/images/cultures/${fileName}.jpg`;
  }
}
