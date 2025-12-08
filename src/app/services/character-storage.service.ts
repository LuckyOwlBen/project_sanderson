import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Character } from '../character/character';

export interface SavedCharacter {
  id: string;
  name: string;
  level: number;
  ancestry: string;
  lastModified: string;
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class CharacterStorageService {
  // In production, API is served from same origin (no CORS needed)
  // In dev mode, backend runs on port 3000, frontend on 4200
  private apiUrl = window.location.hostname === 'localhost' && window.location.port === '4200'
    ? 'http://localhost:3000/api/characters'  // Dev mode
    : '/api/characters';                       // Production mode
  private useServer = false; // Will auto-detect
  private serverAvailable: boolean | null = null;

  constructor(private http: HttpClient) {
    this.checkServerAvailability();
  }

  private checkServerAvailability(): void {
    // Quick health check
    const healthUrl = this.apiUrl.replace('/api/characters', '/api/health');
    this.http.get(healthUrl, { observe: 'response' })
      .pipe(
        map(() => true),
        catchError(() => of(false))
      )
      .subscribe((available: boolean) => {
        this.serverAvailable = available;
        this.useServer = available;
        if (!available) {
          console.log('Backend server not available, using localStorage');
        } else {
          console.log('Backend server detected, using API');
        }
      });
  }

  saveCharacter(character: Character): Observable<{ success: boolean; id: string }> {
    const characterData = this.serializeCharacter(character);
    
    // If server check hasn't completed yet, default to localStorage
    if (this.serverAvailable === null || !this.useServer) {
      return this.saveToLocalStorage(character);
    }
    
    // Try server first, fallback to localStorage on error
    return this.http.post<{ success: boolean; id: string }>(
      `${this.apiUrl}/save`,
      characterData
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        console.warn('Failed to save to server, falling back to localStorage', error);
        this.useServer = false;
        return this.saveToLocalStorage(character);
      })
    );
  }

  loadCharacter(characterId: string): Observable<Character | null> {
    // If server check hasn't completed yet or server not available, use localStorage
    if (this.serverAvailable === null || !this.useServer) {
      return this.loadFromLocalStorage(characterId);
    }
    
    return this.http.get<any>(`${this.apiUrl}/load/${characterId}`).pipe(
      map((data) => this.deserializeCharacter(data)),
      catchError((error: HttpErrorResponse) => {
        console.warn('Failed to load from server, trying localStorage', error);
        return this.loadFromLocalStorage(characterId);
      })
    );
  }

  listCharacters(): Observable<SavedCharacter[]> {
    if (this.serverAvailable === null || !this.useServer) {
      return this.listFromLocalStorage();
    }
    
    return this.http.get<SavedCharacter[]>(`${this.apiUrl}/list`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.warn('Failed to list from server, using localStorage', error);
        return this.listFromLocalStorage();
      })
    );
  }

  deleteCharacter(characterId: string): Observable<{ success: boolean }> {
    if (this.serverAvailable === null || !this.useServer) {
      return this.deleteFromLocalStorage(characterId);
    }
    
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/delete/${characterId}`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.warn('Failed to delete from server, using localStorage', error);
        return this.deleteFromLocalStorage(characterId);
      })
    );
  }

  exportCharacter(character: Character): void {
    const characterData = this.serializeCharacter(character);
    const blob = new Blob([JSON.stringify(characterData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${character.name || 'character'}_${Date.now()}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private serializeCharacter(character: Character): any {
    // Use existing ID if available, otherwise generate new one
    const existingId = (character as any).id;
    return {
      id: existingId || this.generateId(character),
      name: character.name,
      level: character.level,
      ancestry: character.ancestry,
      cultures: character.cultures,
      paths: character.paths,
      attributes: {
        strength: character.attributes.strength,
        speed: character.attributes.speed,
        intellect: character.attributes.intellect,
        willpower: character.attributes.willpower,
        awareness: character.attributes.awareness,
        presence: character.attributes.presence
      },
      skills: character.skills.getAllSkillRanks(),
      unlockedTalents: Array.from(character.unlockedTalents),
      health: {
        current: character.resources.health.current,
        max: character.resources.health.max
      },
      focus: {
        current: character.resources.focus.current,
        max: character.resources.focus.max
      },
      investiture: {
        current: character.resources.investiture.current,
        max: character.resources.investiture.max
      },
      sessionNotes: (character as any).sessionNotes || '',
      lastModified: new Date().toISOString()
    };
  }

  private deserializeCharacter(data: any): Character {
    const character = new Character();
    // Store the ID on the character object for future saves
    (character as any).id = data.id;
    character.level = data.level || 1;
    character.name = data.name || '';
    character.ancestry = data.ancestry || '';
    character.cultures = data.cultures || [];
    character.paths = data.paths || [];
    
    if (data.attributes) {
      character.attributes.strength = data.attributes.strength || 0;
      character.attributes.speed = data.attributes.speed || 0;
      character.attributes.intellect = data.attributes.intellect || 0;
      character.attributes.willpower = data.attributes.willpower || 0;
      character.attributes.awareness = data.attributes.awareness || 0;
      character.attributes.presence = data.attributes.presence || 0;
    }
    
    if (data.skills) {
      Object.entries(data.skills).forEach(([skill, rank]) => {
        character.skills.setSkillRank(skill as any, rank as number);
      });
    }
    
    if (data.unlockedTalents) {
      data.unlockedTalents.forEach((talentId: string) => {
        character.unlockedTalents.add(talentId);
      });
    }
    
    if (data.health) {
      const healthDiff = data.health.current - character.resources.health.current;
      if (healthDiff !== 0) {
        if (healthDiff > 0) {
          character.resources.health.restore(healthDiff);
        } else {
          character.resources.health.spend(Math.abs(healthDiff));
        }
      }
    }
    
    if (data.focus) {
      const focusDiff = data.focus.current - character.resources.focus.current;
      if (focusDiff !== 0) {
        if (focusDiff > 0) {
          character.resources.focus.restore(focusDiff);
        } else {
          character.resources.focus.spend(Math.abs(focusDiff));
        }
      }
    }
    
    if (data.investiture) {
      const investDiff = data.investiture.current - character.resources.investiture.current;
      if (investDiff !== 0) {
        if (investDiff > 0) {
          character.resources.investiture.restore(investDiff);
        } else {
          character.resources.investiture.spend(Math.abs(investDiff));
        }
      }
    }
    
    (character as any).sessionNotes = data.sessionNotes || '';
    
    return character;
  }

  private generateId(character: Character): string {
    // Check if character already has an ID
    const existingId = (character as any).id;
    if (existingId) {
      return existingId;
    }
    
    // Generate new ID only if doesn't exist
    const safeName = character.name.toLowerCase().replace(/\s+/g, '_') || 'character';
    const timestamp = Date.now();
    return `${safeName}_${timestamp}`;
  }

  private saveToLocalStorage(character: Character): Observable<{ success: boolean; id: string }> {
    const characterData = this.serializeCharacter(character);
    const id = characterData.id;
    
    try {
      const existing = this.getAllFromLocalStorage();
      
      // If character already has an ID, remove old entry to prevent duplicates
      if ((character as any).id) {
        // Remove any existing entry with this ID
        delete existing[(character as any).id];
      }
      
      existing[id] = characterData;
      localStorage.setItem('saved_characters', JSON.stringify(existing));
      
      // Update character object with ID for future saves
      (character as any).id = id;
      
      return of({ success: true, id });
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return of({ success: false, id: '' });
    }
  }

  private loadFromLocalStorage(characterId: string): Observable<Character | null> {
    try {
      const existing = this.getAllFromLocalStorage();
      const data = existing[characterId];
      if (data) {
        return of(this.deserializeCharacter(data));
      }
      return of(null);
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return of(null);
    }
  }

  private listFromLocalStorage(): Observable<SavedCharacter[]> {
    try {
      const existing = this.getAllFromLocalStorage();
      const list: SavedCharacter[] = Object.values(existing).map((data: any) => ({
        id: data.id,
        name: data.name,
        level: data.level,
        ancestry: data.ancestry,
        lastModified: data.lastModified,
        data
      }));
      return of(list);
    } catch (error) {
      console.error('Error listing from localStorage:', error);
      return of([]);
    }
  }

  private deleteFromLocalStorage(characterId: string): Observable<{ success: boolean }> {
    try {
      const existing = this.getAllFromLocalStorage();
      delete existing[characterId];
      localStorage.setItem('saved_characters', JSON.stringify(existing));
      return of({ success: true });
    } catch (error) {
      console.error('Error deleting from localStorage:', error);
      return of({ success: false });
    }
  }

  private getAllFromLocalStorage(): Record<string, any> {
    const stored = localStorage.getItem('saved_characters');
    return stored ? JSON.parse(stored) : {};
  }
}
