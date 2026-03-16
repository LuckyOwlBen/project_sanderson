/**
 * Navigation Status Service (Frontend)
 * 
 * Caches tri-state status for character creation steps.
 * Acts as a local cache of backend state for instant UI updates.
 * Updated at strategic moments: character load, finalize, level-up.
 * 
 * States:
 *   'pending'   – Has unspent points or selection not yet made (Gold)
 *   'spent'     – All points spent / selection made, still editable (Green)
 *   'finalized' – Locked via Review page finalize, read-only (Blue)
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export type StepState = 'pending' | 'spent' | 'finalized';

export interface NavigationFinalized {
  ancestry: StepState;
  culture: StepState;
  name: StepState;
  attributes: StepState;
  expertises: StepState;
  skills: StepState;
  paths: StepState;
  talents: StepState;
  equipment: StepState;
}

@Injectable({
  providedIn: 'root'
})
export class NavFinalizedService {
  private loaded$ = new BehaviorSubject<boolean>(false);
  private navFinalized$ = new BehaviorSubject<NavigationFinalized>({
    ancestry: 'pending',
    culture: 'pending',
    name: 'pending',
    attributes: 'pending',
    expertises: 'pending',
    skills: 'pending',
    paths: 'pending',
    talents: 'pending',
    equipment: 'pending'
  });

  constructor(private http: HttpClient) {}

  /**
   * Get the current navigation status observable
   */
  getNavigationFinalized(): Observable<NavigationFinalized> {
    return this.navFinalized$.asObservable();
  }

  /**
   * Get a specific step's status
   */
  getStepStatus(step: keyof NavigationFinalized): Observable<StepState> {
    return new Observable(observer => {
      this.navFinalized$.subscribe(status => {
        observer.next(status[step]);
      });
    });
  }

  /**
   * Load status from backend API
   * Called at strategic moments: character load, finalize, level-up
   */
  loadNavFinalized(characterId: string): Observable<NavigationFinalized> {
    if (!characterId) {
      console.warn('[NavFinalizedService] No characterId provided');
      return of(this.navFinalized$.value);
    }

    return this.http.get<NavigationFinalized>(`/api/character/${characterId}/isNavFinalized`)
      .pipe(
        tap(status => {
          console.log(`[NavFinalizedService] Loaded status for character ${characterId}:`, status);
          this.navFinalized$.next(status);
          this.loaded$.next(true);
        }),
        catchError(error => {
          console.error(`[NavFinalizedService] Error loading status for ${characterId}:`, error);
          return of(this.navFinalized$.value);
        })
      );
  }

  /**
   * Check if service has loaded data
   */
  isLoaded(): Observable<boolean> {
    return this.loaded$.asObservable();
  }

  /**
   * Manually set status (useful for offline testing)
   */
  setNavigationFinalized(status: NavigationFinalized): void {
    this.navFinalized$.next({ ...status });
    this.loaded$.next(true);
  }
}
