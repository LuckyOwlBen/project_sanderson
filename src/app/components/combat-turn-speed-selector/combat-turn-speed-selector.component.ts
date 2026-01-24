import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CombatService } from '../../services/combat.service';
import { WebsocketService } from '../../services/websocket.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-combat-turn-speed-selector',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <mat-card *ngIf="isVisible" data-testid="turn-speed-selector" class="turn-speed-selector">
      <mat-card-header>
        <mat-card-title>⚔️ Combat Active</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p>Select your turn speed:</p>
        <div class="button-group">
          <button
            mat-raised-button
            [color]="selectedSpeed === 'fast' ? 'primary' : ''"
            (click)="selectSpeed('fast')"
            data-testid="fast-button"
            class="speed-button"
          >
            <mat-icon>lightning_bolt</mat-icon>
            Fast Turn
          </button>
          <button
            mat-raised-button
            [color]="selectedSpeed === 'slow' ? 'accent' : ''"
            (click)="selectSpeed('slow')"
            data-testid="slow-button"
            class="speed-button"
          >
            <mat-icon>schedule</mat-icon>
            Slow Turn
          </button>
        </div>
        <div *ngIf="selectedSpeed" class="speed-info" data-testid="speed-info">
          <p *ngIf="selectedSpeed === 'fast'">
            ⚡ <strong>Fast Turn:</strong> 2 actions + 1 reaction
          </p>
          <p *ngIf="selectedSpeed === 'slow'">
            📋 <strong>Slow Turn:</strong> 3 actions + 1 reaction
          </p>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .turn-speed-selector {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 300px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 1000;
    }

    mat-card-header {
      margin-bottom: 12px;
    }

    mat-card-title {
      font-size: 18px;
      margin: 0;
    }

    .button-group {
      display: flex;
      gap: 8px;
      margin: 16px 0;
    }

    .speed-button {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .speed-info {
      margin-top: 16px;
      padding: 12px;
      border-radius: 4px;
      background-color: rgba(63, 81, 181, 0.1);
      border-left: 4px solid #3f51b5;
    }

    .speed-info p {
      margin: 0;
      font-size: 14px;
    }
  `]
})
export class CombatTurnSpeedSelectorComponent implements OnInit, OnDestroy {
  @Input() characterId: string = '';

  isVisible = false;
  selectedSpeed: 'fast' | 'slow' | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private combatService: CombatService,
    private websocketService: WebsocketService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Listen for combat start from WebSocket (server-side trigger from GM)
    const combatStartStream = (this.websocketService as any)?.combatStart$;
    if (combatStartStream && typeof combatStartStream.pipe === 'function') {
      combatStartStream
        .pipe(takeUntil(this.destroy$))
        .subscribe((event: any) => {
          console.log('[Combat Selector] ⚔️ Combat start received from server');
          this.isVisible = true;
          this.cdr.markForCheck();
        });
    }

    // Also listen for local combat toggle (for offline/single-player scenarios)
    this.combatService.combatActive$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isActive => {
        this.isVisible = isActive;
        if (!isActive) {
          this.selectedSpeed = null;
        }
        this.cdr.markForCheck();
      });

    // Track selected speed
    this.combatService.turnSpeedChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event.characterId === this.characterId) {
          this.selectedSpeed = event.turnSpeed;
          this.cdr.markForCheck();
        }
      });

    // Initialize with current selected speed if any
    const currentSpeed = this.combatService.getTurnSpeed(this.characterId);
    if (currentSpeed) {
      this.selectedSpeed = currentSpeed;
    }

    const isActive = this.combatService.isCombatActive();
    this.isVisible = isActive;
  }

  selectSpeed(speed: 'fast' | 'slow'): void {
    // Only emit if speed is actually changing
    if (this.selectedSpeed !== speed) {
      this.combatService.setTurnSpeed(this.characterId, speed);
      this.websocketService.selectTurnSpeed(this.characterId, speed);
      this.selectedSpeed = speed;
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
