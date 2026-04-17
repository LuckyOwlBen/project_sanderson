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
    <!-- YOUR TURN popup -->
    <div *ngIf="isMyTurn" class="your-turn-overlay" data-testid="your-turn-overlay">
      <div class="your-turn-card">
        <div class="your-turn-icon">⚔️</div>
        <h2 class="your-turn-title">YOUR TURN!</h2>
        <p class="your-turn-round">Round {{ turnRound }}</p>
        <div class="your-turn-actions">
          <span class="action-count">{{ turnActions }}</span>
          <span class="action-label">Actions Available</span>
        </div>
        <p class="your-turn-reaction">+ 1 Reaction</p>
      </div>
    </div>

    <!-- Speed selector -->
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

    /* YOUR TURN overlay */
    .your-turn-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      pointer-events: none;
      animation: overlayFadeIn 0.3s ease-out;
    }

    @keyframes overlayFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .your-turn-card {
      background: linear-gradient(135deg, rgba(20, 30, 20, 0.95) 0%, rgba(10, 40, 10, 0.98) 100%);
      border: 2px solid #4caf50;
      border-radius: 16px;
      padding: 32px 48px;
      text-align: center;
      box-shadow: 0 0 40px rgba(76, 175, 80, 0.4), 0 0 80px rgba(76, 175, 80, 0.2);
      animation: turnCardPulse 2s ease-in-out infinite;
    }

    @keyframes turnCardPulse {
      0%, 100% { box-shadow: 0 0 40px rgba(76, 175, 80, 0.4), 0 0 80px rgba(76, 175, 80, 0.2); }
      50% { box-shadow: 0 0 60px rgba(76, 175, 80, 0.6), 0 0 120px rgba(76, 175, 80, 0.3); }
    }

    .your-turn-icon {
      font-size: 48px;
      margin-bottom: 8px;
    }

    .your-turn-title {
      font-size: 36px;
      font-weight: 700;
      color: #4caf50;
      margin: 0 0 4px 0;
      text-transform: uppercase;
      letter-spacing: 4px;
      text-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
    }

    .your-turn-round {
      font-size: 14px;
      color: #aaa;
      margin: 0 0 16px 0;
    }

    .your-turn-actions {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 16px 0 8px 0;
    }

    .action-count {
      font-size: 48px;
      font-weight: 700;
      color: #fff;
      line-height: 1;
    }

    .action-label {
      font-size: 14px;
      color: #aaa;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .your-turn-reaction {
      font-size: 14px;
      color: #81c784;
      margin: 8px 0 0 0;
    }
  `]
})
export class CombatTurnSpeedSelectorComponent implements OnInit, OnDestroy {
  @Input() characterId: string = '';

  isVisible = false;
  selectedSpeed: 'fast' | 'slow' | null = null;

  // Turn notification state
  isMyTurn = false;
  turnRound = 1;
  turnActions = 2;

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
          this.isMyTurn = false;
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

    // Listen for "your turn" events
    const yourTurnStream = (this.websocketService as any)?.yourTurn$;
    if (yourTurnStream && typeof yourTurnStream.pipe === 'function') {
      yourTurnStream
        .pipe(takeUntil(this.destroy$))
        .subscribe((event: any) => {
          if (event.characterId === this.characterId) {
            this.isMyTurn = true;
            this.turnRound = event.round;
            this.turnActions = event.actionsAvailable;
            this.cdr.markForCheck();
          }
        });
    }

    // Dismiss "your turn" when active participant changes away from us
    this.combatService.activeParticipantId$
      .pipe(takeUntil(this.destroy$))
      .subscribe(activeId => {
        if (this.isMyTurn && activeId !== this.characterId) {
          this.isMyTurn = false;
          this.cdr.markForCheck();
        }
      });

    // Dismiss on combat end
    const combatEndStream = (this.websocketService as any)?.combatEnd$;
    if (combatEndStream && typeof combatEndStream.pipe === 'function') {
      combatEndStream
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.isMyTurn = false;
          this.isVisible = false;
          this.selectedSpeed = null;
          this.cdr.markForCheck();
        });
    }

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
