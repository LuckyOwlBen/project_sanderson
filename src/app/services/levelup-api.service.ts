import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LevelTables {
  attributePointsPerLevel: number[];
  skillPointsPerLevel: number[];
  healthPerLevel: number[];
  healthStrengthBonusLevels: number[];
  maxSkillRanksPerLevel: number[];
  skillRanksPerLevel: number[];
  talentPointsPerLevel: number[];
}

export interface LevelSummary {
  id: string;
  name: string;
  level: number;
  ancestry: string | null;
  pendingLevelPoints: number;
  lastModified?: string;
}

export interface AttributeSlice {
  id: string;
  level: number;
  attributes: Record<string, number>;
  pointsForLevel: number;
  lastModified?: string;
  success?: boolean;
}

export interface SkillSlice {
  id: string;
  level: number;
  skills: Record<string, number>;
  pointsForLevel: number;
  maxRank: number;
  ranksPerLevel: number;
  lastModified?: string;
  success?: boolean;
}

export interface TalentSlice {
  id: string;
  level?: number;
  ancestry?: string | null;
  unlockedTalents?: string[];
  pointsForLevel?: number;
  talentPointsAllocation?: number;
  lastModified?: string;
  success?: boolean;
}

export interface TalentForLevelResponse {
  talentPoints: number;
  previouslySelectedTalents: string[];
  requiresSingerSelection: boolean;
  ancestry: string | null;
  level: number;
  mainPath: string;
}

@Injectable({ providedIn: 'root' })
export class LevelUpApiService {
  private apiBase = window.location.hostname === 'localhost' && window.location.port === '4200'
    ? 'http://localhost:3000/api'
    : '/api';
  private levelUpUrl = `${this.apiBase}/levelup`;
  private charactersUrl = `${this.apiBase}/characters`;

  constructor(private http: HttpClient) {}

  getTables(): Observable<LevelTables> {
    return this.http.get<LevelTables>(`${this.levelUpUrl}/tables`);
  }

  getLevelSummary(id: string): Observable<LevelSummary> {
    return this.http.get<LevelSummary>(`${this.charactersUrl}/${id}/level/summary`);
  }

  getAttributeSlice(id: string): Observable<AttributeSlice> {
    return this.http.get<AttributeSlice>(`${this.charactersUrl}/${id}/level/attributes`);
  }

  getSkillSlice(id: string): Observable<SkillSlice> {
    return this.http.get<SkillSlice>(`${this.charactersUrl}/${id}/level/skills`);
  }

  getTalentSlice(id: string): Observable<TalentSlice> {
    return this.http.get<TalentSlice>(`${this.charactersUrl}/${id}/level/talents`);
  }

  getTalentForLevel(id: string): Observable<TalentForLevelResponse> {
    return this.http.get<TalentForLevelResponse>(`${this.charactersUrl}/${id}/talents/forLevel`);
  }

  updateAttributeSlice(id: string, attributes: Record<string, number>): Observable<AttributeSlice> {
    return this.http.patch<AttributeSlice>(`${this.charactersUrl}/${id}/level/attributes`, { attributes });
  }

  updateSkillSlice(id: string, skills: Record<string, number>): Observable<SkillSlice> {
    return this.http.patch<SkillSlice>(`${this.charactersUrl}/${id}/level/skills`, { skills });
  }

  updateTalentSlice(
    id: string,
    unlockedTalents: string[]
  ): Observable<TalentSlice> {
    return this.http.patch<TalentSlice>(`${this.charactersUrl}/${id}/level/talents`, {
      unlockedTalents
    });
  }

  submitPaths(id: string, mainPath: string, specialization: string): Observable<{ success: boolean; unlockedTalent?: string; paths?: string[]; }> {
    return this.http.post<{ success: boolean; unlockedTalent?: string; paths?: string[]; }>(`${this.charactersUrl}/${id}/paths`, {
      mainPath,
      specialization
    });
  }
}
