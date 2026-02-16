import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

export interface TurnSpeedSelectorData {
  characterName: string;
  round: number;
}

@Component({
  selector: 'app-turn-speed-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  template: `
    <div class="turn-speed-dialog">
      <h2 mat-dialog-title>
        <mat-icon>bolt</mat-icon>
        Choose Your Turn Speed
      </h2>
      
      <mat-dialog-content>
        <div class="character-info">
          <strong>{{ data.characterName }}</strong>
          <span class="round-label">Round {{ data.round }}</span>
        </div>

        <div class="rules-reminder">
          <p>Choose how you want to act this round:</p>
        </div>

        <div class="speed-options">
          <mat-card class="speed-card fast-card" (click)="selectSpeed('fast')">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>flash_on</mat-icon>
                Fast Turn
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="action-count">2 Actions</div>
              <div class="description">
                Act before enemies, but with fewer actions
              </div>
              <div class="phase-label">Phase 1: Fast PC Turns</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="speed-card slow-card" (click)="selectSpeed('slow')">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>schedule</mat-icon>
                Slow Turn
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="action-count">3 Actions</div>
              <div class="description">
                Act after fast enemies, but with more actions
              </div>
              <div class="phase-label">Phase 3: Slow PC Turns</div>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="note">
          <mat-icon>info</mat-icon>
          <span>All turns include 1 reaction</span>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions>
        <button mat-stroked-button (click)="decideLater()">
          <mat-icon>timer</mat-icon>
          Decide Later
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .turn-speed-dialog {
      max-width: 600px;
    }

    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      padding: 20px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 24px;
      margin: -24px -24px 0;
    }

    mat-dialog-content {
      padding: 24px;
      min-width: 500px;
    }

    .character-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 16px;
    }

    .round-label {
      color: #666;
      font-weight: 500;
    }

    .rules-reminder {
      text-align: center;
      margin-bottom: 20px;
      color: #555;
      font-size: 14px;
    }

    .speed-options {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
    }

    .speed-card {
      flex: 1;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 3px solid transparent;
    }

    .speed-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }

    .fast-card {
      border-color: #ff9800;
    }

    .fast-card:hover {
      border-color: #f57c00;
      background: #fff3e0;
    }

    .slow-card {
      border-color: #2196f3;
    }

    .slow-card:hover {
      border-color: #1976d2;
      background: #e3f2fd;
    }

    mat-card-header {
      margin-bottom: 12px;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 20px;
      font-weight: 600;
    }

    .fast-card mat-card-title {
      color: #f57c00;
    }

    .slow-card mat-card-title {
      color: #1976d2;
    }

    .action-count {
      font-size: 32px;
      font-weight: bold;
      text-align: center;
      margin: 16px 0;
    }

    .fast-card .action-count {
      color: #ff9800;
    }

    .slow-card .action-count {
      color: #2196f3;
    }

    .description {
      text-align: center;
      color: #666;
      font-size: 14px;
      margin-bottom: 12px;
      min-height: 40px;
    }

    .phase-label {
      text-align: center;
      font-size: 12px;
      color: #999;
      font-weight: 500;
      padding: 8px;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 4px;
    }

    .note {
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: center;
      padding: 12px;
      background: #e8f5e9;
      border-radius: 8px;
      color: #2e7d32;
      font-size: 14px;
    }

    .note mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    mat-dialog-actions {
      padding: 16px 24px;
      justify-content: center;
      border-top: 1px solid rgba(0, 0, 0, 0.12);
      margin: 0 -24px -24px;
    }

    mat-dialog-actions button {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class TurnSpeedSelector {
  constructor(
    public dialogRef: MatDialogRef<TurnSpeedSelector>,
    @Inject(MAT_DIALOG_DATA) public data: TurnSpeedSelectorData
  ) {}

  selectSpeed(speed: 'fast' | 'slow'): void {
    this.dialogRef.close(speed);
  }

  decideLater(): void {
    this.dialogRef.close(null);
  }
}
