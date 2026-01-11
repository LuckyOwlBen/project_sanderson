import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subject, timer, of, merge, ReplaySubject } from 'rxjs';
import { catchError, switchMap, tap, takeUntil, startWith, map } from 'rxjs/operators';

interface LogEntry {
  id: number;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

interface LogsResponse {
  logs: LogEntry[];
}

@Component({
  selector: 'app-logs-view',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './logs-view.html',
  styleUrl: './logs-view.scss',
})
export class LogsView implements OnInit, OnDestroy {
  vm$ = new ReplaySubject<LogsViewModel>(1);

  private destroy$ = new Subject<void>();
  private refresh$ = new Subject<void>();
  private lastUpdated: string | null = null;

  currentPage = 1;
  pageSize = 20;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const autoRefresh$ = timer(0, 5000);

    merge(autoRefresh$, this.refresh$)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.fetchLogs())
      )
      .subscribe(vm => this.vm$.next(vm));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onRefresh(): void {
    this.refresh$.next();
  }

  trackByLogId(_: number, log: LogEntry): number {
    return log.id;
  }

  nextPage(totalLogs: number): void {
    const maxPage = Math.ceil(totalLogs / this.pageSize);
    if (this.currentPage < maxPage) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  getPagedLogs(logs: LogEntry[]): LogEntry[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return logs.slice(start, start + this.pageSize);
  }

  getTotalPages(totalLogs: number): number {
    return Math.ceil(totalLogs / this.pageSize);
  }

  private fetchLogs() {
    return this.http.get<LogsResponse>('/api/logs?limit=200').pipe(
      map(response => {
        console.log('[LogsView] Received logs response:', response);
        return {
          logs: response.logs || [],
          loading: false,
          error: null,
          lastUpdated: new Date().toISOString(),
        };
      }),
      startWith({
        logs: [],
        loading: true,
        error: null,
        lastUpdated: this.lastUpdated,
      }),
      catchError(error => {
        console.error('[LogsView] Error fetching logs:', error);
        return of({
          logs: [],
          loading: false,
          error: 'Unable to load logs right now.',
          lastUpdated: this.lastUpdated,
        });
      }),
      tap(vm => {
        this.lastUpdated = vm.lastUpdated ?? this.lastUpdated;
      })
    );
  }
}

interface LogsViewModel {
  logs: LogEntry[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}
