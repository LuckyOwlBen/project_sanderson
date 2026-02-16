import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface NpcTurnModalData {
  phase: 'fast-npc' | 'slow-npc';
  round: number;
}

@Component({
  selector: 'app-npc-turn-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="npc-turn-dialog">
      <h2 mat-dialog-title>
        <mat-icon>{{ getPhaseIcon() }}</mat-icon>
        {{ getPhaseTitle() }}
      </h2>
      
      <mat-dialog-content>
        <div class="round-info">
          Round {{ data.round }}
        </div>

        <div class="instructions">
          <mat-icon>info_outline</mat-icon>
          <div>
            <p>This is the {{ getPhaseLabel() }} phase.</p>
            <p>Resolve all NPC/enemy turns for this phase, then click the button below to continue.</p>
          </div>
        </div>

        <div class="action-info">
          <mat-icon>flash_on</mat-icon>
          <span>NPCs in this phase have <strong>{{ getActionCount() }} actions</strong> + 1 reaction</span>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions>
        <button mat-raised-button color="primary" (click)="npcsActed()" class="complete-button">
          <mat-icon>check_circle</mat-icon>
          NPCs Acted
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .npc-turn-dialog {
      min-width: 450px;
    }

    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      padding: 20px 24px;
      background: linear-gradient(135deg, #e53935 0%, #c62828 100%);
      color: white;
      font-size: 24px;
      margin: -24px -24px 0;
    }

    mat-dialog-content {
      padding: 24px;
    }

    .round-info {
      text-align: center;
      font-size: 18px;
      font-weight: 600;
      padding: 12px;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 8px;
      margin-bottom: 20px;
      color: #555;
    }

    .instructions {
      display: flex;
      gap: 12px;
      padding: 16px;
      background: #fff3e0;
      border-left: 4px solid #ff9800;
      border-radius: 4px;
      margin-bottom: 16px;
    }

    .instructions mat-icon {
      color: #f57c00;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .instructions p {
      margin: 0 0 8px 0;
      color: #555;
      font-size: 14px;
    }

    .instructions p:last-child {
      margin-bottom: 0;
    }

    .action-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #e8f5e9;
      border-radius: 8px;
      color: #2e7d32;
      font-size: 14px;
    }

    .action-info mat-icon {
      color: #43a047;
    }

    mat-dialog-actions {
      padding: 16px 24px;
      justify-content: center;
      border-top: 1px solid rgba(0, 0, 0, 0.12);
      margin: 0 -24px -24px;
    }

    .complete-button {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      padding: 12px 32px;
    }
  `]
})
export class NpcTurnModal {
  constructor(
    public dialogRef: MatDialogRef<NpcTurnModal>,
    @Inject(MAT_DIALOG_DATA) public data: NpcTurnModalData
  ) {}

  getPhaseTitle(): string {
    return this.data.phase === 'fast-npc' ? 'Fast NPC Turns' : 'Slow NPC Turns';
  }

  getPhaseLabel(): string {
    return this.data.phase === 'fast-npc' ? 'Fast NPC' : 'Slow NPC';
  }

  getPhaseIcon(): string {
    return this.data.phase === 'fast-npc' ? 'flash_on' : 'schedule';
  }

  getActionCount(): number {
    return this.data.phase === 'fast-npc' ? 2 : 3;
  }

  npcsActed(): void {
    this.dialogRef.close(true);
  }
}
