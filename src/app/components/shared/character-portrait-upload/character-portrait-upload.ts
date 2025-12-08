import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ImageUploader } from '../image-uploader/image-uploader';

export interface PortraitDialogData {
  currentImageUrl: string | null;
  characterId?: string;
  characterName: string;
}

@Component({
  selector: 'app-character-portrait-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    ImageUploader
  ],
  templateUrl: './character-portrait-upload.html',
  styleUrl: './character-portrait-upload.scss',
})
export class CharacterPortraitUpload {
  uploadedImageUrl: string | null;

  constructor(
    public dialogRef: MatDialogRef<CharacterPortraitUpload>,
    @Inject(MAT_DIALOG_DATA) public data: PortraitDialogData
  ) {
    this.uploadedImageUrl = data.currentImageUrl;
  }

  onImageUploaded(imageUrl: string): void {
    this.uploadedImageUrl = imageUrl;
  }

  onImageRemoved(): void {
    this.uploadedImageUrl = null;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.dialogRef.close(this.uploadedImageUrl);
  }
}
