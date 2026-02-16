import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { PlayerJoinedEvent } from '../../services/websocket.service';

@Component({
  selector: 'app-money-grant-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>monetization_on</mat-icon>
      Grant Money to {{ data.player.name }}
    </h2>

    <mat-dialog-content>
      <!-- Current Money Display -->
      <mat-card class="current-money-card">
        <mat-card-content>
          <div class="money-display">
            <mat-icon>account_balance_wallet</mat-icon>
            <div class="money-info">
              <span class="label">Current Balance</span>
              <span class="amount">{{ data.player.currencyInChips || 0 }} mk</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Money Amount Input -->
      <mat-form-field class="amount-field">
        <mat-label>Amount (in Markings)</mat-label>
        <input
          matInput
          type="number"
          [(ngModel)]="amount"
          min="1"
          placeholder="Enter amount to grant"
          (keyup.enter)="confirm()"
        />
        <mat-icon matSuffix>monetization_on</mat-icon>
      </mat-form-field>

      <!-- Operation Type -->
      <div class="operation-type">
        <label>
          <input
            type="radio"
            name="operation"
            value="add"
            [(ngModel)]="operation"
            (change)="updatePreview()"
          />
          <span>Give Money (+)</span>
        </label>
        <label>
          <input
            type="radio"
            name="operation"
            value="set"
            [(ngModel)]="operation"
            (change)="updatePreview()"
          />
          <span>Set Balance (=)</span>
        </label>
      </div>

      <!-- Preview -->
      <mat-card class="preview-card" *ngIf="amount">
        <mat-card-content>
          <div class="preview-row">
            <span>Current:</span>
            <span class="amount">{{ data.player.currencyInChips || 0 }} mk</span>
          </div>
          <div
            class="preview-row operation"
            [class.add]="operation === 'add'"
            [class.set]="operation === 'set'"
          >
            <span>{{ operation === 'add' ? 'Add' : 'Set to' }}:</span>
            <span class="amount">{{ amount }} mk</span>
          </div>
          <div class="preview-row result">
            <span>Result:</span>
            <span class="amount">{{ getResultAmount() }} mk</span>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Warning for large amounts -->
      <div class="warning-box" *ngIf="amount && amount > 10000">
        <mat-icon>warning</mat-icon>
        <div>
          <strong>Large Amount Warning</strong>
          <p>
            You are granting {{ amount }} mk, which is a large amount. Please confirm this is
            intentional.
          </p>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions>
      <button mat-button (click)="cancel()">Cancel</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="!amount || amount <= 0"
        (click)="confirm()"
      >
        <mat-icon>{{ operation === 'add' ? 'add_circle' : 'check_circle' }}</mat-icon>
        {{ operation === 'add' ? 'Grant' : 'Set' }} {{ amount }} mk
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        max-height: 90vh;
        overflow-y: auto;
        overflow-x: hidden;
        background-color: var(--gpSystemDarkerGrey);
      }

      h2[mat-dialog-title] {
        background-color: var(--gpSystemDarkerGrey);
        color: #fff;
        padding: 1rem 1.5rem;
        margin: 0 -1.5rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);

        mat-icon {
          color: gold;
        }
      }

      mat-dialog-content {
        min-width: 400px;
        max-width: 500px;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding: 1.5rem !important;
        overflow-y: auto;
        background-color: var(--gpSystemDarkerGrey);
      }

      mat-dialog-actions {
        background-color: var(--gpSystemDarkerGrey);
        padding: 1rem 1.5rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        gap: 0.5rem;
        flex-shrink: 0;
        margin-top: auto;
        justify-content: flex-end;
        align-items: center;
        min-height: 56px;
        position: relative;
        z-index: 10;
      }

      .amount-field {
        width: 100%;

        ::ng-deep .mdc-text-field {
          width: 100%;
        }
      }

      .current-money-card {
        background-color: rgba(212, 175, 55, 0.1);
        border: 2px solid rgba(212, 175, 55, 0.3);
        border-radius: 8px;

        mat-card-content {
          padding: 1rem;
        }

        .money-display {
          display: flex;
          align-items: center;
          gap: 1rem;

          mat-icon {
            color: gold;
            font-size: 2rem;
            width: 2rem;
            height: 2rem;
          }

          .money-info {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;

            .label {
              color: rgba(255, 255, 255, 0.7);
              font-size: 0.85rem;
            }

            .amount {
              color: gold;
              font-size: 1.5rem;
              font-weight: 600;
            }
          }
        }
      }

      .operation-type {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;

        label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.8);
          padding: 0.5rem;
          border-radius: 4px;
          transition: all 0.2s ease;

          &:hover {
            background-color: rgba(255, 255, 255, 0.05);
          }

          input[type='radio'] {
            width: 18px;
            height: 18px;
            cursor: pointer;
            accent-color: var(--gpColor-ChalkyBlue);
          }

          span {
            user-select: none;
          }
        }
      }

      .preview-card {
        background-color: rgba(26, 159, 255, 0.05);
        border: 1px solid rgba(26, 159, 255, 0.2);
        border-radius: 8px;

        mat-card-content {
          padding: 1rem;
        }

        .preview-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          color: rgba(255, 255, 255, 0.7);

          .amount {
            font-weight: 600;
            color: #fff;
            font-size: 1.1rem;
          }

          &.operation {
            &.add {
              color: rgba(76, 175, 80, 0.8);

              .amount {
                color: rgb(76, 175, 80);
              }
            }

            &.set {
              color: rgba(26, 159, 255, 0.8);

              .amount {
                color: var(--gpColor-ChalkyBlue);
              }
            }
          }

          &.result {
            padding-top: 0.75rem;
            margin-top: 0.75rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);

            .amount {
              color: gold;
              font-size: 1.2rem;
            }
          }
        }
      }

      .warning-box {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        background-color: rgba(255, 152, 0, 0.1);
        border: 1px solid rgba(255, 152, 0, 0.5);
        border-radius: 4px;

        mat-icon {
          color: #ffa726;
          flex-shrink: 0;
        }

        strong {
          color: #ffa726;
        }

        p {
          color: rgba(255, 255, 255, 0.8);
          margin: 0.25rem 0 0 0;
          font-size: 0.9rem;
        }
      }
    `,
  ],
})
export class MoneyGrantDialogComponent implements OnInit {
  amount: number = 0;
  operation: 'add' | 'set' = 'add';

  constructor(
    public dialogRef: MatDialogRef<MoneyGrantDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { player: PlayerJoinedEvent }
  ) {}

  ngOnInit(): void {
    // Initialize
  }

  updatePreview(): void {
    // Triggers change detection for preview
  }

  getResultAmount(): number {
    if (this.operation === 'add') {
      return (this.data.player.currencyInChips || 0) + this.amount;
    } else {
      return this.amount;
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    if (this.amount && this.amount > 0) {
      this.dialogRef.close({
        amount: this.amount,
        operation: this.operation,
      });
    }
  }
}
