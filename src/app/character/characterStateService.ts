import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Character } from './character';
import { Ancestry } from './ancestry/ancestry';
import { CulturalInterface } from './culture/culturalInterface';

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
}