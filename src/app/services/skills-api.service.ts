import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface SkillsState {
  characterId: string;
  totalPoints: number;
  pointsSpent: number;
  pointsRemaining: number;
  finalized: boolean;
  skills: Record<string, number>;
}

interface SkillsResponse {
  success: boolean;
  data: SkillsState;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class SkillsApiService {
  private apiBase =
    window.location.hostname === 'localhost' && window.location.port === '4200'
      ? 'http://localhost:3000/api'
      : '/api';
  private charactersUrl = `${this.apiBase}/characters`;

  constructor(private http: HttpClient) {}

  getSkills(characterId: string): Observable<SkillsState> {
    return this.http
      .get<SkillsResponse>(`${this.charactersUrl}/${characterId}/skills`)
      .pipe(map((response) => response.data));
  }

  updateSkills(characterId: string, skills: Record<string, number>): Observable<SkillsState> {
    return this.http
      .post<SkillsResponse>(`${this.charactersUrl}/${characterId}/skills`, { skills })
      .pipe(map((response) => response.data));
  }
}
