import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ImageUploadService } from '../../../services/image-upload.service';

@Component({
  selector: 'app-character-image',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './character-image.html',
  styleUrl: './character-image.scss',
})
export class CharacterImage implements OnInit, OnChanges {
  @Input() imageUrl: string | null = null;
  @Input() characterName: string = 'Character';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() showPlaceholder: boolean = true;

  imageLoading: boolean = false;
  imageLoaded: boolean = false;
  imageError: boolean = false;
  imageLoadAttempts: number = 0;
  maxRetries: number = 3;
  retryDelay: number = 1000; // Start with 1 second
  
  private lastImageUrl: string | null = null;
  private cachedFullUrl: string = '';

  constructor(
    private imageUploadService: ImageUploadService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    // Defer initial load to avoid change detection errors
    setTimeout(() => {
      if (this.imageUrl) {
        this.loadImage();
      }
    }, 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imageUrl']) {
      const previous = changes['imageUrl'].previousValue;
      const current = changes['imageUrl'].currentValue;
      
      // Reset state when URL actually changes
      if (previous !== current && !changes['imageUrl'].firstChange) {
        this.imageLoaded = false;
        this.imageError = false;
        this.imageLoadAttempts = 0;
        
        // Clear cached URL to force regeneration
        this.lastImageUrl = null;
        this.cachedFullUrl = '';
        
        // Defer load to avoid change detection errors
        setTimeout(() => {
          if (this.imageUrl) {
            this.loadImage();
          }
        }, 0);
      }
    }
  }

  getFullImageUrl(): string {
    if (!this.imageUrl) {
      this.lastImageUrl = null;
      this.cachedFullUrl = '';
      return '';
    }
    
    // Only regenerate URL if imageUrl changed
    if (this.imageUrl !== this.lastImageUrl) {
      this.lastImageUrl = this.imageUrl;
      this.cachedFullUrl = this.imageUploadService.getImageUrl(this.imageUrl);
    }
    
    return this.cachedFullUrl;
  }

  getSizeClass(): string {
    return `size-${this.size}`;
  }

  private loadImage(): void {
    this.imageLoading = true;
    this.imageError = false;
    
    const img = new Image();
    const imageUrl = this.getFullImageUrl();
    
    img.onload = () => {
      this.ngZone.run(() => {
        this.imageLoading = false;
        this.imageLoaded = true;
        this.imageError = false;
        this.cdr.markForCheck();
      });
    };
    
    img.onerror = () => {
      this.ngZone.run(() => {
        this.imageLoadAttempts++;
        
        if (this.imageLoadAttempts < this.maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = this.retryDelay * Math.pow(2, this.imageLoadAttempts - 1);
          console.log(`Image load failed, retrying in ${delay}ms... (attempt ${this.imageLoadAttempts}/${this.maxRetries})`);
          
          setTimeout(() => {
            this.loadImage();
          }, delay);
        } else {
          console.error('Image failed to load after', this.maxRetries, 'attempts');
          this.imageLoading = false;
          this.imageError = true;
          this.cdr.markForCheck();
        }
      });
    };
    
    img.src = imageUrl;
  }

  onImageLoad(): void {
    this.ngZone.run(() => {
      this.imageLoading = false;
      this.imageLoaded = true;
      this.imageError = false;
      this.cdr.markForCheck();
    });
  }

  onImageError(): void {
    this.ngZone.run(() => {
      this.imageLoadAttempts++;
      
      if (this.imageLoadAttempts < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, this.imageLoadAttempts - 1);
        console.log(`Image load failed, retrying in ${delay}ms... (attempt ${this.imageLoadAttempts}/${this.maxRetries})`);
        
        setTimeout(() => {
          this.imageLoaded = false;
          this.imageError = false;
          this.cdr.markForCheck();
        }, delay);
      } else {
        console.error('Image failed to load after', this.maxRetries, 'attempts');
        this.imageLoading = false;
        this.imageError = true;
        this.cdr.markForCheck();
      }
    });
  }
}
