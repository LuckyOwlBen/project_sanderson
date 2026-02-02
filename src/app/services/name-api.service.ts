import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface NameResponse {
  success: boolean;
  name: string;
  level: number;
  cultures: string[];
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class NameApiService {
  private apiBase = window.location.hostname === 'localhost' && window.location.port === '4200'
    ? 'http://localhost:3000/api'
    : '/api';
  private charactersUrl = `${this.apiBase}/characters`;

  constructor(private http: HttpClient) {}

  getName(characterId: string): Observable<{ name: string; level: number; cultures: string[] } | null> {
    return this.http
      .get<NameResponse>(`${this.charactersUrl}/${characterId}/name`)
      .pipe(
        map((response) => {
          if (!response?.success) {
            return null;
          }
          return {
            name: response.name || '',
            level: response.level || 1,
            cultures: response.cultures || []
          };
        })
      );
  }

  saveName(characterId: string, name: string, level: number): Observable<{ name: string; level: number } | null> {
    return this.http
      .post<NameResponse>(`${this.charactersUrl}/${characterId}/name`, { name, level })
      .pipe(
        map((response) => {
          if (!response?.success) {
            return null;
          }
          return {
            name: response.name || '',
            level: response.level || 1
          };
        })
      );
  }
}
