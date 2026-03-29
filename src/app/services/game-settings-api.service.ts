import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface GameSettings {
  sellPercent: number;
}

export interface GameSettingsResponse {
  success: boolean;
  settings?: GameSettings;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class GameSettingsApiService {
  private apiBase = window.location.hostname === 'localhost' && window.location.port === '4200'
    ? 'http://localhost:3000/api'
    : '/api';

  constructor(private http: HttpClient) {}

  getSettings(): Observable<GameSettings> {
    return this.http
      .get<GameSettingsResponse>(`${this.apiBase}/settings`)
      .pipe(map(r => r.settings ?? { sellPercent: 50 }));
  }

  updateSettings(patch: Partial<GameSettings>): Observable<GameSettings> {
    return this.http
      .patch<GameSettingsResponse>(`${this.apiBase}/settings`, patch)
      .pipe(map(r => r.settings ?? { sellPercent: 50 }));
  }
}
