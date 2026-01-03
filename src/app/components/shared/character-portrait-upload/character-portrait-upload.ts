import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ImageUploader } from '../image-uploader/image-uploader';

export interface PortraitDialogData {
  currentImageUrl: string | null;
  characterId?: string;
  characterName: string;
}

interface CachedImage {
  key: string;
  url: string;
  characterName?: string;
}

@Component({
  selector: 'app-character-portrait-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    ImageUploader
  ],
  templateUrl: './character-portrait-upload.html',
  styleUrl: './character-portrait-upload.scss',
})
export class CharacterPortraitUpload implements OnInit {
  uploadedImageUrl: string | null;
  cachedImages: CachedImage[] = [];

  constructor(
    public dialogRef: MatDialogRef<CharacterPortraitUpload>,
    @Inject(MAT_DIALOG_DATA) public data: PortraitDialogData
  ) {
    this.uploadedImageUrl = data.currentImageUrl;
  }

  ngOnInit(): void {
    this.loadCachedImages();
  }

  loadCachedImages(): void {
    const images: CachedImage[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('_portrait')) {
        const value = localStorage.getItem(key);
        if (value && value.startsWith('data:image')) {
          const characterName = key.split('_portrait')[0];
          images.push({ key, url: value, characterName });
        }
      }
    }
    this.cachedImages = images;
  }

  onImageUploaded(imageUrl: string): void {
    try {
      this.uploadedImageUrl = imageUrl;
    } catch (error: any) {
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        alert('Storage quota exceeded. Please delete some old character portraits or clear browser data.');
      }
      console.error('Error saving image:', error);
    }
  }

  onImageRemoved(): void {
    this.uploadedImageUrl = null;
  }

  selectCachedImage(imageUrl: string): void {
    this.uploadedImageUrl = imageUrl;
  }

  deleteCachedImage(cachedImage: CachedImage, event: Event): void {
    event.stopPropagation();
    if (confirm(`Delete portrait for ${cachedImage.characterName || 'this character'}?`)) {
      localStorage.removeItem(cachedImage.key);
      this.loadCachedImages();
      if (this.uploadedImageUrl === cachedImage.url) {
        this.uploadedImageUrl = null;
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    try {
      this.dialogRef.close(this.uploadedImageUrl);
    } catch (error: any) {
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        alert('Storage quota exceeded. Unable to save portrait. Please delete some old character portraits or clear browser data.');
      }
      console.error('Error saving portrait:', error);
    }
  }
}
