import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

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

interface CompleteCharacterResponse {
  success: boolean;
  character?: CompleteCharacterView;
  error?: string;
}

interface FinalizeResponse {
  success: boolean;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class FinalizeApiService {
  private apiBase = window.location.hostname === 'localhost' && window.location.port === '4200'
    ? 'http://localhost:3000/api'
    : '/api';
  private charactersUrl = `${this.apiBase}/characters`;

  constructor(private http: HttpClient) {}

  /**
   * Get a flattened view of a complete character for review
   */
  getCompleteCharacter(characterId: string): Observable<CompleteCharacterView | null> {
    return this.http
      .get<CompleteCharacterResponse>(`${this.charactersUrl}/${characterId}/complete`)
      .pipe(
        map((response) => {
          if (!response?.success || !response.character) {
            return null;
          }
          return response.character;
        })
      );
  }

  /**
   * Finalize character creation
   * Validates all sections are complete and locks the character for level 1
   */
  finalizeCharacter(characterId: string): Observable<boolean> {
    return this.http
      .post<FinalizeResponse>(`${this.charactersUrl}/${characterId}/finalize`, {})
      .pipe(
        map((response) => {
          return response?.success ?? false;
        })
      );
  }
}
