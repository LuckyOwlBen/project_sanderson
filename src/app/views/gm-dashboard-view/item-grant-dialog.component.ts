import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { InventoryItem, ItemType } from '../../character/inventory/inventoryItem';
import { ALL_ITEMS } from '../../character/inventory/itemDefinitions';
import { PlayerJoinedEvent } from '../../services/websocket.service';

@Component({
  selector: 'app-item-grant-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>redeem</mat-icon>
      Grant Item to {{ data.player.name }}
    </h2>

    <mat-dialog-content>
      <!-- Category Filter -->
      <mat-form-field class="category-select">
        <mat-label>Category</mat-label>
        <mat-select [(ngModel)]="selectedCategory" (ngModelChange)="filterItems()">
          <mat-option value="all">All Items</mat-option>
          <mat-option value="weapon">Weapons</mat-option>
          <mat-option value="armor">Armor</mat-option>
          <mat-option value="equipment">Equipment</mat-option>
          <mat-option value="consumable">Consumables</mat-option>
          <mat-option value="fabrial">Fabrials</mat-option>
          <mat-option value="mount">Mounts</mat-option>
        </mat-select>
      </mat-form-field>

      <!-- Search -->
      <mat-form-field class="search-field">
        <mat-label>Search items</mat-label>
        <input matInput [(ngModel)]="searchQuery" (ngModelChange)="filterItems()" placeholder="Search by name...">
        <mat-icon matPrefix>search</mat-icon>
      </mat-form-field>

      <!-- Rarity Filter -->
      <mat-chip-set class="rarity-chips">
        <mat-chip 
          [highlighted]="showCommon"
          (click)="toggleCommon()">
          Common Items
        </mat-chip>
        <mat-chip 
          [highlighted]="showRewardOnly"
          (click)="toggleRewardOnly()">
          Reward Only
        </mat-chip>
        <mat-chip 
          [highlighted]="showTalentOnly"
          (click)="toggleTalentOnly()">
          Talent Only
        </mat-chip>
      </mat-chip-set>

      <!-- Item List -->
      <div class="item-list">
        <mat-card 
          *ngFor="let item of getFilteredItems()"
          class="item-card"
          [class.selected]="selectedItem?.id === item.id"
          [class.reward-only]="item.rarity === 'reward-only'"
          [class.talent-only]="item.rarity === 'talent-only'"
          (click)="selectItem(item)">
          
          <div class="item-header">
            <mat-icon [class]="'item-icon ' + item.type">{{ getItemIcon(item) }}</mat-icon>
            <div class="item-info">
              <span class="item-name">{{ item.name }}</span>
              <span class="item-type">{{ item.type }}</span>
            </div>
            <mat-chip 
              *ngIf="item.rarity !== 'common'"
              [color]="item.rarity === 'reward-only' ? 'accent' : 'warn'">
              {{ item.rarity }}
            </mat-chip>
          </div>

          <p class="item-description">{{ item.description }}</p>

          <div class="item-stats" *ngIf="selectedItem?.id === item.id">
            <span *ngIf="item.weaponProperties">
              {{ item.weaponProperties.damage }} {{ item.weaponProperties.damageType }}
            </span>
            <span *ngIf="item.armorProperties">
              Deflect: {{ item.armorProperties.deflectValue }}
            </span>
            <span class="item-weight">{{ item.weight }} lbs</span>
            <span class="item-price">{{ item.price }}mk</span>
          </div>
        </mat-card>

        <div class="no-results" *ngIf="getFilteredItems().length === 0">
          <mat-icon>search_off</mat-icon>
          <p>No items found</p>
        </div>
      </div>

      <!-- Quantity Selector -->
      <mat-form-field class="quantity-field" *ngIf="selectedItem">
        <mat-label>Quantity</mat-label>
        <input matInput type="number" [(ngModel)]="quantity" min="1" max="99">
      </mat-form-field>

      <!-- Warning for special items -->
      <div class="warning-box" *ngIf="selectedItem && selectedItem.rarity !== 'common'">
        <mat-icon>warning</mat-icon>
        <div>
          <strong>Special Item Warning</strong>
          <p *ngIf="selectedItem.rarity === 'reward-only'">
            This item is marked as "Reward Only" and should only be granted for significant achievements or story milestones.
          </p>
          <p *ngIf="selectedItem.rarity === 'talent-only'">
            This item is marked as "Talent Only" and is typically granted through character advancement, not directly by the GM.
          </p>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions>
      <button mat-button (click)="cancel()">Cancel</button>
      <button 
        mat-raised-button 
        color="primary"
        [disabled]="!selectedItem"
        (click)="confirm()">
        <mat-icon>redeem</mat-icon>
        Grant {{ quantity }}x {{ selectedItem?.name || 'Item' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
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
        color: var(--gpColor-ChalkyBlue);
      }
    }

    mat-dialog-content {
      min-width: 500px;
      max-width: 600px;
      max-height: 60vh;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem 1.5rem !important;
      overflow-y: auto;
      background-color: var(--gpSystemDarkerGrey);
    }

    mat-dialog-actions {
      background-color: var(--gpSystemDarkerGrey);
      padding: 1rem 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .category-select,
    .search-field,
    .quantity-field {
      width: 100%;
    }

    .rarity-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;

      mat-chip {
        cursor: pointer;
        background-color: rgba(255, 255, 255, 0.1);
        color: #fff;

        &[highlighted="true"] {
          background-color: var(--gpColor-ChalkyBlue);
          color: #000;
        }
      }
    }

    .item-list {
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 300px;
      padding-right: 0.5rem;
    }

    .item-card {
      cursor: pointer;
      transition: all 0.2s ease;
      padding: 1rem;
      background-color: rgba(0, 0, 0, 0.3);
      color: #fff;

      &:hover {
        transform: translateX(4px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
        background-color: rgba(0, 0, 0, 0.4);
      }

      &.selected {
        border: 2px solid var(--gpColor-ChalkyBlue);
        background-color: var(--gpSystemDarkGrey) !important;
      }

      &.reward-only {
        border-left: 4px solid #ff9800;
      }

      &.talent-only {
        border-left: 4px solid #9c27b0;
      }
    }

    .item-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.5rem;

      .item-icon {
        font-size: 2rem;
        width: 2rem;
        height: 2rem;

        &.weapon { color: var(--gpColor-ChalkyBlue); }
        &.armor { color: var(--gpColor-LightGreen); }
        &.equipment { color: #ffa726; }
        &.fabrial { color: gold; }
        &.mount { color: #8d6e63; }
      }

      .item-info {
        flex: 1;
        display: flex;
        flex-direction: column;

        .item-name {
          font-weight: 600;
          font-size: 1.1rem;
          color: #fff;
        }

        .item-type {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.6);
          text-transform: capitalize;
        }
      }

      mat-chip {
        font-size: 0.7rem;
        min-height: 24px;
        padding: 0 8px;
      }
    }

    .item-description {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
      margin: 0.5rem 0;
    }

    .item-stats {
      display: flex;
      gap: 1rem;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.6);
      padding-top: 0.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);

      span {
        color: rgba(255, 255, 255, 0.7);
      }

      .item-price {
        color: gold;
        font-weight: 600;
      }
    }

    .no-results {
      text-align: center;
      padding: 2rem;
      color: rgba(255, 255, 255, 0.5);

      mat-icon {
        font-size: 3rem;
        width: 3rem;
        height: 3rem;
        opacity: 0.3;
        color: rgba(255, 255, 255, 0.3);
      }

      p {
        color: rgba(255, 255, 255, 0.5);
      }
    }

    .warning-box {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background-color: rgba(255, 152, 0, 0.15);
      border: 1px solid rgba(255, 152, 0, 0.5);
      border-radius: 4px;

      mat-icon {
        color: #ffa726;
      }

      strong {
        color: #ffa726;
      }

      p {
        color: rgba(255, 255, 255, 0.8);
        margin: 0.25rem 0 0 0;
      }
    }

    .no-results {
      text-align: center;
      padding: 2rem;
      color: var(--gpSystemLightGrey);

      mat-icon {
        font-size: 3rem;
        width: 3rem;
        height: 3rem;
        opacity: 0.5;
      }
    }

    .warning-box {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background-color: rgba(255, 152, 0, 0.1);
      border: 1px solid #ff9800;
      border-radius: 4px;

      mat-icon {
        color: #ff9800;
      }

      strong {
        color: #ff9800;
      }

      p {
        margin: 0.5rem 0 0 0;
        font-size: 0.9rem;
      }
    }

    mat-dialog-actions {
      padding: 1rem;
      gap: 0.5rem;
    }
  `]
})
export class ItemGrantDialogComponent {
  selectedItem: InventoryItem | null = null;
  quantity: number = 1;
  searchQuery: string = '';
  selectedCategory: ItemType | 'all' = 'all';
  showCommon: boolean = true;
  showRewardOnly: boolean = true;
  showTalentOnly: boolean = true;
  filteredItems: InventoryItem[] = [];

  constructor(
    public dialogRef: MatDialogRef<ItemGrantDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { player: PlayerJoinedEvent }
  ) {
    this.filterItems();
  }

  filterItems(): void {
    this.filteredItems = ALL_ITEMS.filter(item => {
      // Category filter
      if (this.selectedCategory !== 'all' && item.type !== this.selectedCategory) {
        return false;
      }

      // Rarity filter
      if (item.rarity === 'common' && !this.showCommon) return false;
      if (item.rarity === 'reward-only' && !this.showRewardOnly) return false;
      if (item.rarity === 'talent-only' && !this.showTalentOnly) return false;

      // Search filter
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(query) || 
               item.description.toLowerCase().includes(query);
      }

      return true;
    });
  }

  getFilteredItems(): InventoryItem[] {
    return this.filteredItems;
  }

  selectItem(item: InventoryItem): void {
    this.selectedItem = item;
  }

  toggleCommon(): void {
    this.showCommon = !this.showCommon;
    this.filterItems();
  }

  toggleRewardOnly(): void {
    this.showRewardOnly = !this.showRewardOnly;
    this.filterItems();
  }

  toggleTalentOnly(): void {
    this.showTalentOnly = !this.showTalentOnly;
    this.filterItems();
  }

  getItemIcon(item: InventoryItem): string {
    switch (item.type) {
      case 'weapon': return 'swords';
      case 'armor': return 'shield';
      case 'equipment': return 'backpack';
      case 'consumable': return 'science';
      case 'fabrial': return 'auto_awesome';
      case 'mount': return 'pets';
      case 'vehicle': return 'directions_boat';
      default: return 'inventory_2';
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    if (this.selectedItem) {
      this.dialogRef.close({
        itemId: this.selectedItem.id,
        quantity: this.quantity
      });
    }
  }
}
