import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface PathsSelection {
  type: string | null;
  sub: string | null;
}

interface PathsResponse {
  success: boolean;
  type: string | null;
  sub: string | null;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class PathsApiService {
  private apiBase = window.location.hostname === 'localhost' && window.location.port === '4200'
    ? 'http://localhost:3000/api'
    : '/api';
  private charactersUrl = `${this.apiBase}/characters`;

  constructor(private http: HttpClient) {}

  getPaths(characterId: string): Observable<PathsSelection> {
    return this.http
      .get<PathsResponse>(`${this.charactersUrl}/${characterId}/paths`)
      .pipe(
        map((response) => ({
          type: response.type ?? null,
          sub: response.sub ?? null
        }))
      );
  }

  savePaths(characterId: string, type: string, sub: string): Observable<PathsSelection> {
    return this.http
      .post<PathsResponse>(`${this.charactersUrl}/${characterId}/paths`, { type, sub })
      .pipe(
        map((response) => ({
          type: response.type ?? null,
          sub: response.sub ?? null
        }))
      );
  }
}
