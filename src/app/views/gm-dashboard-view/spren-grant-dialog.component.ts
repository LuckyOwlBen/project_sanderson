import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { PlayerJoinedEvent } from '../../services/websocket.service';
import { RADIANT_ORDERS, RadiantOrderInfo } from '../../character/radiantPath/radiantPathManager';

@Component({
  selector: 'app-spren-grant-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatListModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>auto_awesome</mat-icon>
      Grant Spren to {{ data.player.name }}
    </h2>
    
    <mat-dialog-content>
      <p class="dialog-description">
        Select a Radiant Order to grant this character. 
        They will bond the corresponding spren and unlock the Order's tier 0 talent.
      </p>
      
      <div class="orders-list">
        <div *ngFor="let orderEntry of getOrders()" 
             class="order-option"
             [class.selected]="selectedOrderName === orderEntry.order"
             (click)="selectOrder(orderEntry)">
          <div class="order-content">
            <div class="order-header">
              <strong>{{ orderEntry.order }}</strong>
              <mat-icon class="spren-icon">interests</mat-icon>
              <span class="spren-name">{{ orderEntry.orderInfo.sprenType }}</span>
            </div>
            <div class="order-philosophy">
              <em>"{{ orderEntry.orderInfo.philosophy }}"</em>
            </div>
            <div class="order-surges">
              <mat-icon class="surge-icon">bolt</mat-icon>
              <span>{{ getSurgeNames(orderEntry.orderInfo) }}</span>
            </div>
          </div>
        </div>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button 
              color="primary" 
              (click)="onGrant()"
              [disabled]="!selectedOrder">
        <mat-icon>check</mat-icon>
        Grant Spren
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host ::ng-deep .mat-mdc-dialog-content {
      max-height: 60vh !important;
      overflow-y: auto !important;
      padding: 0 24px !important;
    }

    .dialog-description {
      margin-bottom: 16px;
      color: rgba(0, 0, 0, 0.6);
      padding-top: 8px;
    }

    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-bottom: 16px;
    }

    .order-option {
      padding: 16px;
      border: 2px solid rgba(0, 0, 0, 0.12);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      background-color: #fff;
      position: relative;
    }

    .order-option:hover:not(.selected) {
      border-color: rgba(63, 81, 181, 0.5);
      background-color: rgba(63, 81, 181, 0.05);
      transform: translateX(4px);
    }

    .order-option.selected {
      border-color: #3f51b5 !important;
      border-width: 3px !important;
      background: linear-gradient(135deg, rgba(63, 81, 181, 0.2) 0%, rgba(63, 81, 181, 0.15) 100%) !important;
      box-shadow: 0 0 0 3px rgba(63, 81, 181, 0.2), 0 4px 12px rgba(63, 81, 181, 0.4) !important;
    }

    .order-option.selected .order-header strong {
      color: #3f51b5 !important;
      font-size: 1.1em;
    }

    .order-option.selected::after {
      content: '✓';
      position: absolute;
      top: 12px;
      right: 12px;
      background-color: #3f51b5;
      color: white;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 18px;
      line-height: 28px;
      text-align: center;
    }

    .order-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
    }

    .order-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .spren-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #9c27b0;
    }

    .spren-name {
      color: #9c27b0;
      font-size: 0.9em;
    }

    .order-philosophy {
      font-size: 0.9em;
      color: rgba(0, 0, 0, 0.7);
      padding-left: 8px;
      border-left: 2px solid #3f51b5;
    }

    .order-surges {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.85em;
      color: rgba(0, 0, 0, 0.6);
    }

    .surge-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #ff9800;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class SprenGrantDialogComponent {
  selectedOrderName: string | null = null;
  selectedOrder: { order: string, orderInfo: RadiantOrderInfo } | null = null;

  constructor(
    public dialogRef: MatDialogRef<SprenGrantDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { player: PlayerJoinedEvent }
  ) {}

  getOrders(): { order: string, orderInfo: RadiantOrderInfo }[] {
    return Object.entries(RADIANT_ORDERS).map(([order, orderInfo]) => ({
      order,
      orderInfo
    }));
  }

  getSurgeNames(orderInfo: RadiantOrderInfo): string {
    return orderInfo.surgePair.map(s => 
      s.toLowerCase().replace('_', ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    ).join(' & ');
  }

  selectOrder(orderEntry: { order: string, orderInfo: RadiantOrderInfo }): void {
    this.selectedOrderName = orderEntry.order;
    this.selectedOrder = orderEntry;
    console.log('Selected order:', orderEntry.order);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onGrant(): void {
    if (this.selectedOrder) {
      console.log('Granting spren:', this.selectedOrder);
      this.dialogRef.close(this.selectedOrder);
    }
  }
}
