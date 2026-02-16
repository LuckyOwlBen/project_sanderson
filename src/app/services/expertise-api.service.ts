import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface ExpertiseSelection {
  name: string;
  source?: string; // 'culture' | 'talent' | 'gm' | 'manual'
  sourceId?: string;
  category?: string;
  level?: number;
}

export interface ExpertiseState {
  characterId: string;
  totalPoints: number;
  pointsSpent: number;
  pointsRemaining: number;
  finalized: boolean;
  expertise: ExpertiseSelection[];
}

interface ExpertiseStateResponse {
  success: boolean;
  data: ExpertiseState;
  error?: string;
}

interface AvailableExpertiseResponse {
  success: boolean;
  data: { categories: Record<string, string[]> };
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class ExpertiseApiService {
  private apiBase =
    window.location.hostname === 'localhost' && window.location.port === '4200'
      ? 'http://localhost:3000/api'
      : '/api';
  private charactersUrl = `${this.apiBase}/characters`;

  constructor(private http: HttpClient) {}

  getExpertise(characterId: string): Observable<ExpertiseState> {
    return this.http
      .get<ExpertiseStateResponse>(`${this.charactersUrl}/${characterId}/expertise`)
      .pipe(map((response) => response.data));
  }

  updateExpertise(
    characterId: string,
    expertise: ExpertiseSelection[]
  ): Observable<ExpertiseState> {
    return this.http
      .post<ExpertiseStateResponse>(`${this.charactersUrl}/${characterId}/expertise`, { expertise })
      .pipe(map((response) => response.data));
  }

  getAvailableExpertise(): Observable<Record<string, string[]>> {
    return this.http
      .get<AvailableExpertiseResponse>(`${this.apiBase}/expertise/available`)
      .pipe(map((response) => response.data.categories));
  }
}
