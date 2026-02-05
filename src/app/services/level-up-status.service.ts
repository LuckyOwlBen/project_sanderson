import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LevelUpStatus {
  success: boolean;
  attributesFinalized: boolean;
  skillsFinalized: boolean;
  talentsFinalized: boolean;
  expertiseFinalized: boolean;
  firstUnfinalizedStep: string | null;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LevelUpStatusService {
  private apiBase = window.location.hostname === 'localhost' && window.location.port === '4200'
    ? 'http://localhost:3000/api'
    : '/api';
  private charactersUrl = `${this.apiBase}/characters`;

  constructor(private http: HttpClient) {}

  /**
   * Fetch level-up status for a character
   * Single endpoint that returns all finalized flags and first unfinalzed step
   */
  getLevelUpStatus(characterId: string): Observable<LevelUpStatus> {
    return this.http.get<LevelUpStatus>(`${this.charactersUrl}/${characterId}/level-up-status`);
  }
}

