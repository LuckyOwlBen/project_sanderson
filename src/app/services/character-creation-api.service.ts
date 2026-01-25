import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AncestryUpdateResponse {
  success: boolean;
  ancestry: string;
  id: string;
  error?: string;
}

export interface CharacterNameUpdateResponse {
  success: boolean;
  name: string;
  id: string;
  error?: string;
}

export interface CultureUpdateResponse {
  success: boolean;
  cultures: any[];
  id: string;
  error?: string;
}

export interface AttributeUpdateResponse {
  success: boolean;
  attributes: Record<string, number>;
  id: string;
  error?: string;
}

export interface ExpertiseUpdateResponse {
  success: boolean;
  selectedExpertises: any[];
  id: string;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class CharacterCreationApiService {
  private apiBase = window.location.hostname === 'localhost' && window.location.port === '4200'
    ? 'http://localhost:3000/api'
    : '/api';
  private charactersUrl = `${this.apiBase}/characters`;

  constructor(private http: HttpClient) {}

  /**
   * Update character ancestry
   * POST /api/characters/:id/ancestry
   */
  updateAncestry(id: string, ancestry: string): Observable<AncestryUpdateResponse> {
    return this.http.post<AncestryUpdateResponse>(
      `${this.charactersUrl}/${id}/ancestry`,
      { ancestry }
    );
  }

  /**
   * Update character name
   * POST /api/characters/:id/name
   */
  updateName(id: string, name: string): Observable<CharacterNameUpdateResponse> {
    return this.http.post<CharacterNameUpdateResponse>(
      `${this.charactersUrl}/${id}/name`,
      { name }
    );
  }

  /**
   * Update character cultures
   * POST /api/characters/:id/cultures
   */
  updateCultures(id: string, cultures: any[]): Observable<CultureUpdateResponse> {
    return this.http.post<CultureUpdateResponse>(
      `${this.charactersUrl}/${id}/cultures`,
      { cultures }
    );
  }

  /**
   * Update character attributes
   * POST /api/characters/:id/attributes
   */
  updateAttributes(id: string, attributes: Record<string, number>): Observable<AttributeUpdateResponse> {
    return this.http.post<AttributeUpdateResponse>(
      `${this.charactersUrl}/${id}/attributes`,
      { attributes }
    );
  }

  /**
   * Update character expertises
   * POST /api/characters/:id/expertises
   */
  updateExpertises(id: string, selectedExpertises: any[]): Observable<ExpertiseUpdateResponse> {
    return this.http.post<ExpertiseUpdateResponse>(
      `${this.charactersUrl}/${id}/expertises`,
      { selectedExpertises }
    );
  }
}
