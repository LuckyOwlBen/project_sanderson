import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

interface CulturesResponse {
  success: boolean;
  ancestry: string | null;
  cultures: string[];
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class CultureApiService {
  private apiBase = window.location.hostname === 'localhost' && window.location.port === '4200'
    ? 'http://localhost:3000/api'
    : '/api';
  private charactersUrl = `${this.apiBase}/characters`;

  constructor(private http: HttpClient) {}

  getCultures(characterId: string): Observable<{ ancestry: string | null; cultures: string[] }> {
    console.log('[CultureApiService] Fetching cultures for character:', characterId);
    return this.http
      .get<CulturesResponse>(`${this.charactersUrl}/${characterId}/cultures`)
      .pipe(
        map((response) => {
          console.log('[CultureApiService] Received response:', response);
          if (!response?.success) {
            console.warn('[CultureApiService] Response not successful:', response);
            return { ancestry: null, cultures: [] };
          }
          return {
            ancestry: response.ancestry ?? null,
            cultures: response.cultures || []
          };
        })
      );
  }

  saveCultures(characterId: string, cultures: string[]): Observable<string[]> {
    return this.http
      .post<CulturesResponse>(`${this.charactersUrl}/${characterId}/cultures`, { cultures })
      .pipe(
        map((response) => {
          if (!response?.success) {
            return [];
          }
          return response.cultures || [];
        })
      );
  }
}
