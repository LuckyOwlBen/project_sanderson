import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { Character } from '../../../character/character';

@Component({
  selector: 'app-character-sheet-header',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './character-sheet-header.html',
  styleUrl: './character-sheet-header.scss',
})
export class CharacterSheetHeader {
  @Input() character: Character | null = null;
  
  @Output() save = new EventEmitter<void>();
  @Output() export = new EventEmitter<void>();
  @Output() navigateBack = new EventEmitter<void>();

  onSave(): void {
    this.save.emit();
  }

  onExport(): void {
    this.export.emit();
  }

  onBackToList(): void {
    this.navigateBack.emit();
  }
}
