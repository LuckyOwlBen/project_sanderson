import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Character } from './character';
import { Ancestry } from './ancestry/ancestry';
import { CulturalInterface } from './culture/culturalInterface';
import { ExpertiseSource, ExpertiseSourceType, ExpertiseSourceHelper } from './expertises/expertiseSource';

@Injectable({
  providedIn: 'root'
})
export class CharacterStateService {
  private character: Character;
  private characterSubject: BehaviorSubject<Character>;
  public character$: Observable<Character>;

  constructor() {
    this.character = new Character();
    this.characterSubject = new BehaviorSubject(this.character);
    this.character$ = this.characterSubject.asObservable();
  }

  updateCharacter(updates: Partial<Character>): void {
    Object.assign(this.character, updates);
    this.characterSubject.next(this.character);
  }

  getCharacter(): Character {
    return this.character;
  }

  // Specific update methods
  setAncestry(ancestry: Ancestry): void {
    this.character.ancestry = ancestry;
    
    // Set default dullform for Singer ancestry
    if (ancestry === Ancestry.SINGER) {
      // Always set dullform if no form is active
      if (!this.character.activeForm) {
        this.character.setActiveForm('dullform');
      }
    }
    
    this.characterSubject.next(this.character);
  }

  addCulture(culture: CulturalInterface): void {
    if (this.character.cultures.length < 2) {
      this.character.cultures.push(culture);
      this.characterSubject.next(this.character);
    }
  }

  removeCulture(culture: CulturalInterface): void {
    const index = this.character.cultures.findIndex(c => c.name === culture.name);
    if (index !== -1) {
      this.character.cultures.splice(index, 1);
      this.characterSubject.next(this.character);
    }
  }

  assignAttributePoint(attribute: keyof Character['attributes']): void {
    const currentValue = this.character.attributes[attribute];
    if (typeof currentValue === 'number' && currentValue < 5) {
      (this.character.attributes[attribute] as number) = currentValue + 1;
      this.characterSubject.next(this.character);
    }
  }

  unlockTalent(talentId: string): void {
    this.character.unlockedTalents.add(talentId);
    this.characterSubject.next(this.character);
  }

  removeTalent(talentId: string): void {
    this.character.unlockedTalents.delete(talentId);
    this.characterSubject.next(this.character);
  }

  getUnlockedTalents(): Set<string> {
    return this.character.unlockedTalents;
  }

  /**
   * Add an expertise with source tracking for cascade removal
   */
  addExpertise(expertiseName: string, source: ExpertiseSourceType = 'manual', sourceId?: string): void {
    // Check if expertise already exists
    const existingIndex = this.character.selectedExpertises.findIndex(e => e.name === expertiseName);
    
    if (existingIndex === -1) {
      // Add new expertise
      this.character.selectedExpertises.push(
        ExpertiseSourceHelper.create(expertiseName, source, sourceId)
      );
      this.characterSubject.next(this.character);
    } else {
      // Expertise exists - update only if new source is more specific
      const existing = this.character.selectedExpertises[existingIndex];
      // Keep the first source (culture/talent over manual)
      if (existing.source === 'manual' && source !== 'manual') {
        existing.source = source;
        existing.sourceId = sourceId;
        this.characterSubject.next(this.character);
      }
    }
  }

  /**
   * Remove a specific expertise by name (only if manually removable)
   */
  removeExpertise(expertiseName: string): void {
    const index = this.character.selectedExpertises.findIndex(e => e.name === expertiseName);
    if (index !== -1 && ExpertiseSourceHelper.canRemove(this.character.selectedExpertises[index])) {
      this.character.selectedExpertises.splice(index, 1);
      this.characterSubject.next(this.character);
    }
  }

  /**
   * Remove all expertises granted by a specific source (e.g., when talent is removed)
   */
  removeExpertisesBySource(sourceId: string): void {
    const originalLength = this.character.selectedExpertises.length;
    this.character.selectedExpertises = this.character.selectedExpertises.filter(
      e => e.sourceId !== sourceId
    );
    
    if (this.character.selectedExpertises.length !== originalLength) {
      this.characterSubject.next(this.character);
    }
  }

  /**
   * Get expertise names as string array (backward compatibility)
   */
  getSelectedExpertises(): string[] {
    return ExpertiseSourceHelper.toStringArray(this.character.selectedExpertises);
  }

  /**
   * Get full expertise objects with source information
   */
  getSelectedExpertisesWithSource(): ExpertiseSource[] {
    return this.character.selectedExpertises;
  }
}