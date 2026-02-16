import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Ancestry } from '../character/ancestry/ancestry';

interface AncestryResponse {
  success: boolean;
  ancestry: string | null;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class AncestryApiService {
  private apiBase =
    window.location.hostname === 'localhost' && window.location.port === '4200'
      ? 'http://localhost:3000/api'
      : '/api';
  private charactersUrl = `${this.apiBase}/characters`;

  constructor(private http: HttpClient) {}

  getAncestry(characterId: string): Observable<Ancestry | null> {
    return this.http.get<AncestryResponse>(`${this.charactersUrl}/${characterId}/ancestry`).pipe(
      map((response) => {
        if (!response?.success) {
          return null;
        }
        if (response.ancestry === Ancestry.HUMAN) {
          return Ancestry.HUMAN;
        }
        if (response.ancestry === Ancestry.SINGER) {
          return Ancestry.SINGER;
        }
        return null;
      })
    );
  }

  saveAncestry(characterId: string, ancestry: Ancestry | null): Observable<Ancestry | null> {
    return this.http
      .post<AncestryResponse>(`${this.charactersUrl}/${characterId}/ancestry`, { ancestry })
      .pipe(
        map((response) => {
          if (!response?.success) {
            return null;
          }
          if (response.ancestry === Ancestry.HUMAN) {
            return Ancestry.HUMAN;
          }
          if (response.ancestry === Ancestry.SINGER) {
            return Ancestry.SINGER;
          }
          return null;
        })
      );
  }
}
