import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { TalentUIResponse } from '../../../shared/types/talents';

export interface RadiantPathData {
  boundOrder: string | null;
  currentIdeal: number;
  idealSpoken: boolean;
  surgePair: string | null;
  sprenType: string | null;
}

export interface TalentsState {
  characterId: string;
  totalPoints: number;
  pointsSpent: number;
  pointsRemaining: number;
  finalized: boolean;
  totalTalents: string[];
  pendingTalents: string[];
  pendingTrees: string[];  // Selected bonus path trees (removable until finalized)
  availableTrees: string[];
  selectedTreeId: string | null;
  requiresSingerSelection: boolean;
  ancestry: string | null;
  level: number;
  radiantPath?: RadiantPathData;
}

interface TalentsResponse {
  success: boolean;
  data: TalentsState;
  error?: string;
}

interface TalentUIResponseData {
  success: boolean;
  data: TalentUIResponse;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class TalentsApiService {
  private apiBase = window.location.hostname === 'localhost' && window.location.port === '4200'
    ? 'http://localhost:3000/api'
    : '/api';
  private charactersUrl = `${this.apiBase}/characters`;

  constructor(private http: HttpClient) {}

  getTalents(characterId: string): Observable<TalentsState> {
    return this.http
      .get<TalentsResponse>(`${this.charactersUrl}/${characterId}/talents`)
      .pipe(map((response) => response.data));
  }

  getTalentUI(characterId: string): Observable<TalentUIResponse> {
    return this.http
      .get<TalentUIResponseData>(`${this.charactersUrl}/${characterId}/talents/ui`)
      .pipe(map((response) => response.data));
  }

  saveTalents(characterId: string, talents: Partial<TalentsState>): Observable<TalentsState> {
    return this.http
      .post<TalentsResponse>(`${this.charactersUrl}/${characterId}/talents`, { talents })
      .pipe(map((response) => response.data));
  }
}
