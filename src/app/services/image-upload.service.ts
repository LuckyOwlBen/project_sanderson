import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface ImageUploadResponse {
  success: boolean;
  imageUrl?: string;
  filename?: string;
  error?: string;
}

export interface ImageListResponse {
  success: boolean;
  images?: { filename: string; url: string }[];
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {
  private apiUrl = 'http://localhost:80/api';
  private serverAvailable = false;
  private readonly LOCALSTORAGE_PREFIX = 'character_image_';

  constructor(private http: HttpClient) {
    this.checkServerAvailability();
  }

  private async checkServerAvailability(): Promise<void> {
    try {
      await this.http.get(`${this.apiUrl}/health`).toPromise();
      this.serverAvailable = true;
      console.log('Image server available - using server storage');
    } catch {
      this.serverAvailable = false;
      console.warn('Image server not available - using localStorage fallback');
    }
  }

  /**
   * Upload an image file to the server or localStorage
   * Automatically converts to WebP format on server
   * Falls back to Base64 localStorage if server unavailable
   */
  uploadImage(
    file: File, 
    characterId?: string, 
    imageType: string = 'portrait'
  ): Observable<ImageUploadResponse> {
    // Try server upload first
    if (this.serverAvailable) {
      const formData = new FormData();
      formData.append('image', file);
      if (characterId) {
        formData.append('characterId', characterId);
      }
      formData.append('imageType', imageType);

      return this.http.post<ImageUploadResponse>(
        `${this.apiUrl}/images/upload`, 
        formData
      ).pipe(
        catchError(error => {
          console.error('Server upload failed, falling back to localStorage:', error);
          // Fallback to localStorage if server fails
          return this.uploadToLocalStorage(file, characterId, imageType);
        })
      );
    } else {
      // Use localStorage directly if server not available
      return this.uploadToLocalStorage(file, characterId, imageType);
    }
  }

  /**
   * Upload image to localStorage as Base64
   */
  private uploadToLocalStorage(
    file: File,
    characterId?: string,
    imageType: string = 'portrait'
  ): Observable<ImageUploadResponse> {
    return new Observable(observer => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const base64Image = e.target?.result as string;
          
          // Delete old image for this character/type if it exists
          const oldKeyPattern = `${this.LOCALSTORAGE_PREFIX}${characterId}_${imageType}`;
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(oldKeyPattern)) {
              localStorage.removeItem(key);
            }
          });
          
          // Add timestamp to make each upload unique
          const timestamp = Date.now();
          const storageKey = `${this.LOCALSTORAGE_PREFIX}${characterId}_${imageType}_${timestamp}`;
          
          // Store in localStorage
          localStorage.setItem(storageKey, base64Image);
          
          observer.next({
            success: true,
            imageUrl: storageKey, // Return storage key as "URL"
            filename: storageKey
          });
          observer.complete();
        } catch (error: any) {
          observer.next({
            success: false,
            error: error.message || 'localStorage storage failed'
          });
          observer.complete();
        }
      };
      
      reader.onerror = () => {
        observer.next({
          success: false,
          error: 'Failed to read file'
        });
        observer.complete();
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Delete an image from the server or localStorage
   */
  deleteImage(filename: string): Observable<{ success: boolean; error?: string }> {
    // Check if it's a localStorage key
    if (filename.startsWith(this.LOCALSTORAGE_PREFIX)) {
      return this.deleteFromLocalStorage(filename);
    }

    // Try server deletion
    if (!this.serverAvailable) {
      return of({ 
        success: false, 
        error: 'Server not available' 
      });
    }

    return this.http.delete<{ success: boolean; error?: string }>(
      `${this.apiUrl}/images/delete/${filename}`
    ).pipe(
      catchError(error => {
        console.error('Image deletion failed:', error);
        return of({ 
          success: false, 
          error: error.message || 'Deletion failed' 
        });
      })
    );
  }

  /**
   * Delete image from localStorage
   */
  private deleteFromLocalStorage(storageKey: string): Observable<{ success: boolean; error?: string }> {
    try {
      localStorage.removeItem(storageKey);
      console.log(`Image removed from localStorage: ${storageKey}`);
      return of({ success: true });
    } catch (error: any) {
      return of({ 
        success: false, 
        error: error.message || 'localStorage deletion failed' 
      });
    }
  }

  /**
   * List all available images (for gallery)
   */
  listImages(): Observable<ImageListResponse> {
    if (!this.serverAvailable) {
      return of({ 
        success: false, 
        error: 'Server not available' 
      });
    }

    return this.http.get<ImageListResponse>(
      `${this.apiUrl}/images/list`
    ).pipe(
      catchError(error => {
        console.error('Image list failed:', error);
        return of({ 
          success: false, 
          error: error.message || 'Failed to list images' 
        });
      })
    );
  }

  /**
   * Get full image URL from filename or path
   * Handles both server URLs and localStorage keys
   */
  getImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    
    // Strip cache-busting query parameters to get the actual path/key
    const pathWithoutQuery = imagePath.split('?')[0];
    
    // If it's a localStorage key, retrieve the Base64 data
    if (pathWithoutQuery.startsWith(this.LOCALSTORAGE_PREFIX)) {
      const base64Data = localStorage.getItem(pathWithoutQuery);
      return base64Data || '';
    }
    
    // If already a full URL, return as-is (keep query params for server images)
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // If it's a data URL (Base64), return as-is
    if (imagePath.startsWith('data:')) {
      return imagePath;
    }
    
    // If already starts with /images/, return with server base (keep query params)
    if (pathWithoutQuery.startsWith('/images/')) {
      return `http://localhost:80${imagePath}`;
    }
    
    // Otherwise, assume it's just a filename (keep query params)
    return `http://localhost:80/images/${imagePath}`;
  }

  isServerAvailable(): boolean {
    return this.serverAvailable;
  }

  /**
   * Get storage type for an image path
   */
  getStorageType(imagePath: string): 'server' | 'localStorage' | 'unknown' {
    if (!imagePath) return 'unknown';
    if (imagePath.startsWith(this.LOCALSTORAGE_PREFIX)) return 'localStorage';
    if (imagePath.startsWith('/images/') || imagePath.startsWith('http')) return 'server';
    return 'unknown';
  }
}
