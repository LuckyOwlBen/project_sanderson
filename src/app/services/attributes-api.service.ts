import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface AttributesState {
  characterId: string;
  totalPoints: number;
  pointsSpent: number;
  pointsRemaining: number;
  strength: number;
  speed: number;
  awareness: number;
  intellect: number;
  willpower: number;
  presence: number;
  finalized: boolean;
  derived: {
    health: number;
    focus: number;
    movement: number;
    recovery: string;
  };
}

interface AttributesResponse {
  success: boolean;
  data: AttributesState;
  error?: string;
}

interface AttributesFinalizeResponse {
  success: boolean;
  data?: {
    characterId: string;
    finalized: boolean;
  };
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class AttributesApiService {
  private apiBase = window.location.hostname === 'localhost' && window.location.port === '4200'
    ? 'http://localhost:3000/api'
    : '/api';
  private charactersUrl = `${this.apiBase}/characters`;

  constructor(private http: HttpClient) {}

  getAttributes(characterId: string): Observable<AttributesState> {
    return this.http
      .get<AttributesResponse>(`${this.charactersUrl}/${characterId}/attributes`)
      .pipe(map((response) => response.data));
  }

  updateAttributes(characterId: string, attributes: Record<string, number>): Observable<AttributesState> {
    return this.http
      .post<AttributesResponse>(`${this.charactersUrl}/${characterId}/attributes`, { attributes })
      .pipe(map((response) => response.data));
  }

  finalizeAttributes(characterId: string): Observable<boolean> {
    return this.http
      .post<AttributesFinalizeResponse>(`${this.charactersUrl}/${characterId}/attributes/finalize`, {})
      .pipe(map((response) => response?.data?.finalized ?? false));
  }
}
