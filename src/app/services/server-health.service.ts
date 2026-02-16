import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ServerHealthService {
  private healthCheckInterval = 5000; // Check every 5 seconds
  private healthUrl = window.location.hostname === 'localhost' && window.location.port === '4200'
    ? 'http://localhost:3000/api/health'
    : '/api/health';
  
  private serverHealthSubject = new BehaviorSubject<boolean>(true);
  public serverHealth$ = this.serverHealthSubject.asObservable();
  
  private wasHealthy = true;

  constructor(private http: HttpClient) {
    this.performInitialHealthCheck();
    this.startHealthCheck();
  }

  private performInitialHealthCheck(): void {
    // Check server health immediately on app startup
    this.http.get(this.healthUrl, { responseType: 'text' }).pipe(
      map(() => true),
      catchError(() => of(false))
    ).subscribe(isHealthy => {
      this.wasHealthy = isHealthy;
      this.serverHealthSubject.next(isHealthy);
      if (!isHealthy) {
        console.warn('[ServerHealth] Server is DOWN on app startup');
      } else {
        console.log('[ServerHealth] Server is UP');
      }
    });
  }

  private startHealthCheck(): void {
    interval(this.healthCheckInterval).pipe(
      switchMap(() => 
        this.http.get(this.healthUrl, { responseType: 'text' }).pipe(
          map(() => true),
          catchError(() => of(false))
        )
      )
    ).subscribe(isHealthy => {
      const previousState = this.wasHealthy;
      this.wasHealthy = isHealthy;
      
      // Emit new state
      this.serverHealthSubject.next(isHealthy);
      
      // Log state changes
      if (previousState && !isHealthy) {
        console.warn('[ServerHealth] Server went DOWN');
      } else if (!previousState && isHealthy) {
        console.log('[ServerHealth] Server came BACK UP');
      }
    });
  }

  isServerHealthy(): boolean {
    return this.serverHealthSubject.value;
  }
}
