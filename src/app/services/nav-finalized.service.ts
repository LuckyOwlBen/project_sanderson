/**
 * Navigation Finalized Service (Frontend)
 *
 * Caches finalized status for character creation steps.
 * Acts as a local cache of backend state for instant UI updates.
 * Updated at strategic moments: character load, finalize, level-up.
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface NavigationFinalized {
  ancestry: boolean;
  culture: boolean;
  name: boolean;
  attributes: boolean;
  expertises: boolean;
  skills: boolean;
  paths: boolean;
  talents: boolean;
  equipment: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class NavFinalizedService {
  private loaded$ = new BehaviorSubject<boolean>(false);
  private navFinalized$ = new BehaviorSubject<NavigationFinalized>({
    ancestry: false,
    culture: false,
    name: false,
    attributes: false,
    expertises: false,
    skills: false,
    paths: false,
    talents: false,
    equipment: false,
  });

  constructor(private http: HttpClient) {}

  /**
   * Get the current navigation finalized status observable
   */
  getNavigationFinalized(): Observable<NavigationFinalized> {
    return this.navFinalized$.asObservable();
  }

  /**
   * Get a specific step's finalized status
   */
  getStepFinalized(step: keyof NavigationFinalized): Observable<boolean> {
    return new Observable((observer) => {
      this.navFinalized$.subscribe((status) => {
        observer.next(status[step]);
      });
    });
  }

  /**
   * Load finalized status from backend API
   * Called at strategic moments: character load, finalize, level-up
   */
  loadNavFinalized(characterId: string): Observable<NavigationFinalized> {
    if (!characterId) {
      console.warn('[NavFinalizedService] No characterId provided');
      return of(this.navFinalized$.value);
    }

    return this.http.get<NavigationFinalized>(`/api/character/${characterId}/isNavFinalized`).pipe(
      tap((status) => {
        console.log(
          `[NavFinalizedService] Loaded finalized status for character ${characterId}:`,
          status
        );
        this.navFinalized$.next(status);
        this.loaded$.next(true);
      }),
      catchError((error) => {
        console.error(
          `[NavFinalizedService] Error loading finalized status for ${characterId}:`,
          error
        );
        // Return current cached state on error
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
   * Manually set finalized status (useful for offline testing)
   */
  setNavigationFinalized(status: NavigationFinalized): void {
    this.navFinalized$.next({ ...status });
    this.loaded$.next(true);
  }
}
