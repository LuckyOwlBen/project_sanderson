import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { PlayerJoinedEvent } from '../../services/websocket.service';
import { ALL_EXPERTISES, ExpertiseDefinition, CULTURAL_EXPERTISES, ITEM_EXPERTISES, CRAFTING_EXPERTISES } from '../../character/expertises/allExpertises';

@Component({
  selector: 'app-expertise-grant-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>school</mat-icon>
      Grant Expertise to {{ data.player.name }}
    </h2>
    
    <mat-dialog-content>
      <p class="dialog-description">
        Grant an expertise to this character. Expertises function as skills with Intellect as the governing attribute.
      </p>

      <!-- Category Filter -->
      <mat-form-field appearance="outline" class="category-select">
        <mat-label>Filter by Category</mat-label>
        <mat-select [(ngModel)]="selectedCategory" (selectionChange)="onCategoryChange()">
          <mat-option value="all">All Expertises</mat-option>
          <mat-option value="cultural">Cultural</mat-option>
          <mat-option value="weapon">Weapon Proficiency</mat-option>
          <mat-option value="armor">Armor Proficiency</mat-option>
          <mat-option value="utility">Utility</mat-option>
          <mat-option value="specialist">Specialist/Crafting</mat-option>
        </mat-select>
      </mat-form-field>
      
      <div class="expertises-list">
        <div *ngFor="let expertise of getFilteredExpertises()" 
             class="expertise-option"
             [class.selected]="selectedExpertise?.name === expertise.name"
             (click)="selectExpertise(expertise)">
          <div class="expertise-content">
            <div class="expertise-header">
              <mat-icon class="expertise-icon">{{ getCategoryIcon(expertise.category) }}</mat-icon>
              <strong>{{ expertise.name }}</strong>
              <mat-chip class="category-chip" [class]="'chip-' + expertise.category">
                {{ expertise.category }}
              </mat-chip>
            </div>
            <div class="expertise-description">
              {{ expertise.description }}
            </div>
          </div>
        </div>

        <p *ngIf="getFilteredExpertises().length === 0" class="no-results">
          No expertises found in this category.
        </p>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button 
              color="primary" 
              (click)="onGrant()"
              [disabled]="!selectedExpertise">
        <mat-icon>check</mat-icon>
        Grant Expertise
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host ::ng-deep .mat-mdc-dialog-content {
      max-height: 65vh !important;
      overflow-y: auto !important;
      padding: 0 24px !important;
    }

    .dialog-description {
      margin-bottom: 16px;
      color: rgba(0, 0, 0, 0.6);
      padding-top: 8px;
    }

    .category-select {
      width: 100%;
      margin-bottom: 16px;
    }

    .expertises-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .expertise-option {
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      background: white;

      &:hover {
        border-color: #2196F3;
        background: #f5f5f5;
      }

      &.selected {
        border-color: #2196F3;
        background: #E3F2FD;
      }
    }

    .expertise-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .expertise-header {
      display: flex;
      align-items: center;
      gap: 8px;

      .expertise-icon {
        color: #2196F3;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      strong {
        flex: 1;
        font-size: 16px;
      }

      .category-chip {
        font-size: 11px;
        min-height: 24px;
        padding: 4px 8px;

        &.chip-cultural {
          background: #E8F5E9;
          color: #2E7D32;
        }

        &.chip-weapon {
          background: #FFEBEE;
          color: #C62828;
        }

        &.chip-armor {
          background: #FFF3E0;
          color: #E65100;
        }

        &.chip-utility {
          background: #E1F5FE;
          color: #0277BD;
        }

        &.chip-specialist {
          background: #F3E5F5;
          color: #6A1B9A;
        }
      }
    }

    .expertise-description {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.7);
      line-height: 1.4;
      margin-left: 28px;
    }

    .no-results {
      text-align: center;
      color: #999;
      font-style: italic;
      padding: 24px;
    }

    mat-dialog-actions {
      padding: 16px 24px !important;
    }
  `]
})
export class ExpertiseGrantDialogComponent {
  selectedExpertise: ExpertiseDefinition | null = null;
  selectedCategory: string = 'all';

  constructor(
    public dialogRef: MatDialogRef<ExpertiseGrantDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { player: PlayerJoinedEvent }
  ) {}

  getFilteredExpertises(): ExpertiseDefinition[] {
    if (this.selectedCategory === 'all') {
      return ALL_EXPERTISES;
    }
    return ALL_EXPERTISES.filter(e => e.category === this.selectedCategory);
  }

  onCategoryChange(): void {
    // Clear selection when category changes
    this.selectedExpertise = null;
  }

  selectExpertise(expertise: ExpertiseDefinition): void {
    this.selectedExpertise = expertise;
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'cultural': return 'public';
      case 'weapon': return 'swords';
      case 'armor': return 'shield';
      case 'utility': return 'construction';
      case 'specialist': return 'engineering';
      default: return 'school';
    }
  }

  onGrant(): void {
    console.log('[Expertise Dialog] 🎯 onGrant called');
    console.log('[Expertise Dialog] 🎯 Selected expertise:', this.selectedExpertise);
    if (this.selectedExpertise) {
      const result = { 
        expertiseName: this.selectedExpertise.name,
        expertise: this.selectedExpertise
      };
      console.log('[Expertise Dialog] 🎯 Closing dialog with result:', result);
      this.dialogRef.close(result);
    } else {
      console.log('[Expertise Dialog] ⚠️ No expertise selected!');
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
