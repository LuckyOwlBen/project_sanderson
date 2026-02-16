import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TalentsApiService } from './talents-api.service';
import { TalentUIResponse } from '../../../shared/types/talents';

@Injectable({ providedIn: 'root' })
export class TalentClientService {
  constructor(private api: TalentsApiService) {}

  fetchTalentUI(characterId: string): Observable<TalentUIResponse> {
    return this.api.getTalentUI(characterId);
  }

  /**
   * Persist staged talent changes. Payload is passed through to the API as-is.
   * The server is authoritative and will return the updated TalentUIResponse.
   */
  persistTalents(characterId: string, payload: any): Observable<any> {
    return this.api.saveTalents(characterId, payload);
  }
}
