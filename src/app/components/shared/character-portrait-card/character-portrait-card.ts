import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Character } from '../../../character/character';
import { CharacterImage } from '../character-image/character-image';
import { CharacterPortraitUpload } from '../character-portrait-upload/character-portrait-upload';

@Component({
  selector: 'app-character-portrait-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    CharacterImage
  ],
  templateUrl: './character-portrait-card.html',
  styleUrl: './character-portrait-card.scss',
})
export class CharacterPortraitCard {
  @Input() character: Character | null = null;
  @Input() characterId: string = '';
  @Input() portraitUrl: string | null = null;
  
  @Output() portraitChanged = new EventEmitter<string | null>();

  constructor(
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  openPortraitUpload(): void {
    if (!this.character) return;

    const dialogRef = this.dialog.open(CharacterPortraitUpload, {
      width: '600px',
      data: {
        currentImageUrl: (this.character as any).portraitUrl || null,
        characterId: this.characterId || (this.character as any).id,
        characterName: this.character.name || 'Character'
      }
    });

    dialogRef.afterClosed().subscribe((imageUrl: string | null | undefined) => {
      if (imageUrl !== undefined && this.character) {
        // Defer update to next tick to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          if (imageUrl) {
            // Store URL without timestamp (add timestamp during display only)
            const urlWithoutTimestamp = imageUrl.split('?')[0];
            this.portraitChanged.emit(urlWithoutTimestamp);
          } else {
            this.portraitChanged.emit(null);
          }
          this.cdr.detectChanges(); // Force change detection
        }, 0);
      }
    });
  }

  getPortraitUrl(): string | null {
    return (this.character as any)?.portraitUrl || null;
  }
}
