import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

export interface ExpertiseChoiceData {
  talentName: string;
  options: string[];
  choiceCount: number;
  description?: string;
}

export interface ExpertiseChoiceResult {
  selected: string[];
}

@Component({
  selector: 'app-expertise-choice-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './expertise-choice-dialog.html',
  styleUrl: './expertise-choice-dialog.scss'
})
export class ExpertiseChoiceDialog {
  selectedExpertises: Set<string> = new Set();
  Array = Array; // For template access

  constructor(
    public dialogRef: MatDialogRef<ExpertiseChoiceDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ExpertiseChoiceData
  ) {}

  toggleExpertise(expertise: string): void {
    if (this.selectedExpertises.has(expertise)) {
      this.selectedExpertises.delete(expertise);
    } else {
      // If choice count is 1, clear previous selection
      if (this.data.choiceCount === 1) {
        this.selectedExpertises.clear();
      }
      
      // Only add if we haven't reached the limit
      if (this.selectedExpertises.size < this.data.choiceCount) {
        this.selectedExpertises.add(expertise);
      }
    }
  }

  isSelected(expertise: string): boolean {
    return this.selectedExpertises.has(expertise);
  }

  canSelect(expertise: string): boolean {
    return this.isSelected(expertise) || 
           this.selectedExpertises.size < this.data.choiceCount;
  }

  canConfirm(): boolean {
    return this.selectedExpertises.size === this.data.choiceCount;
  }

  onConfirm(): void {
    this.dialogRef.close({
      selected: Array.from(this.selectedExpertises)
    } as ExpertiseChoiceResult);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
