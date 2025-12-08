import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ImageUploadService } from '../../../services/image-upload.service';

@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './image-uploader.html',
  styleUrl: './image-uploader.scss',
})
export class ImageUploader {
  @Input() currentImageUrl: string | null = null;
  @Input() characterId?: string;
  @Input() imageType: string = 'portrait';
  @Input() label: string = 'Character Portrait';
  @Input() showPreview: boolean = true;
  
  @Output() imageUploaded = new EventEmitter<string>();
  @Output() imageRemoved = new EventEmitter<void>();

  uploading = false;
  uploadError: string | null = null;

  constructor(
    private imageUploadService: ImageUploadService,
    private cdr: ChangeDetectorRef
  ) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    
    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      this.uploadError = 'Only JPEG, PNG, and WebP images are allowed';
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      this.uploadError = 'Image must be smaller than 10MB';
      return;
    }

    this.uploadImage(file);
  }

  private uploadImage(file: File): void {
    this.uploading = true;
    this.uploadError = null;

    this.imageUploadService.uploadImage(file, this.characterId, this.imageType)
      .subscribe((response: any) => {
        // Defer state updates to next tick to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.uploading = false;
          
          if (response.success && response.imageUrl) {
            this.currentImageUrl = response.imageUrl;
            this.imageUploaded.emit(response.imageUrl);
            console.log('Image uploaded successfully:', response.imageUrl);
            this.cdr.markForCheck();
          } else {
            this.uploadError = response.error || 'Upload failed';
            this.cdr.markForCheck();
          }
        }, 0);
      });
  }

  removeImage(): void {
    if (!this.currentImageUrl) return;

    // Extract filename from URL
    const filename = this.currentImageUrl.split('/').pop();
    
    if (filename) {
      this.imageUploadService.deleteImage(filename).subscribe((response: any) => {
        // Defer state updates to next tick
        setTimeout(() => {
          if (response.success) {
            this.currentImageUrl = null;
            this.imageRemoved.emit();
            console.log('Image removed successfully');
            this.cdr.markForCheck();
          }
        }, 0);
      });
    } else {
      // If we can't extract filename, just clear locally
      setTimeout(() => {
        this.currentImageUrl = null;
        this.imageRemoved.emit();
        this.cdr.markForCheck();
      }, 0);
    }
  }

  getFullImageUrl(url: string | null): string {
    if (!url) return '';
    return this.imageUploadService.getImageUrl(url);
  }

  triggerFileInput(fileInput: HTMLInputElement): void {
    fileInput.click();
  }
}
