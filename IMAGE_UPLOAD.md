# Image Upload System

## Overview
The image upload system allows users to upload custom images (portraits, backgrounds, etc.) that persist across sessions. Images are stored server-side and automatically converted to WebP format for optimal file size.

## Features
- **Automatic WebP Conversion**: JPG and PNG files are automatically compressed to WebP
- **File Size Optimization**: Images resized to max 800x800px, compressed at 85% quality
- **Persistent Storage**: Images stored in `server/images/` directory (512GB available on mini PC)
- **Security**: File type validation, size limits (10MB max), directory traversal protection
- **Easy Integration**: Reusable `ImageUploader` component

## Server Setup

### Install Dependencies
```bash
cd server
npm install
```

New dependencies added:
- `multer`: Handles multipart/form-data file uploads
- `sharp`: High-performance image processing (WebP conversion, resizing)

### Storage Location
Images are stored in: `server/images/`
- Created automatically on server startup
- Served statically at `http://localhost:3000/images/`

## API Endpoints

### Upload Image
```
POST /api/images/upload
Content-Type: multipart/form-data

Body:
- image: File (required)
- characterId: string (optional)
- imageType: string (optional) - e.g., 'portrait', 'background'

Response:
{
  "success": true,
  "imageUrl": "/images/character123_portrait_1234567890.webp",
  "filename": "character123_portrait_1234567890.webp"
}
```

### Delete Image
```
DELETE /api/images/delete/:filename

Response:
{
  "success": true
}
```

### List Images
```
GET /api/images/list

Response:
{
  "success": true,
  "images": [
    {
      "filename": "character123_portrait_1234567890.webp",
      "url": "/images/character123_portrait_1234567890.webp"
    }
  ]
}
```

## Usage in Components

### Import the ImageUploader Component
```typescript
import { ImageUploader } from '../components/shared/image-uploader/image-uploader';

@Component({
  // ...
  imports: [ImageUploader, ...]
})
```

### Use in Template
```html
<app-image-uploader
  [currentImageUrl]="character.portraitUrl"
  [characterId]="character.id"
  [imageType]="'portrait'"
  [label]="'Character Portrait'"
  (imageUploaded)="onImageUploaded($event)"
  (imageRemoved)="onImageRemoved()">
</app-image-uploader>
```

### Handle Events
```typescript
onImageUploaded(imageUrl: string): void {
  if (this.character) {
    (this.character as any).portraitUrl = imageUrl;
    this.characterState.updateCharacter(this.character);
  }
}

onImageRemoved(): void {
  if (this.character) {
    delete (this.character as any).portraitUrl;
    this.characterState.updateCharacter(this.character);
  }
}
```

## Image Service

The `ImageUploadService` provides methods for:
- `uploadImage(file, characterId?, imageType?)`: Upload and convert to WebP
- `deleteImage(filename)`: Remove image from server
- `listImages()`: Get all available images
- `getImageUrl(path)`: Convert relative path to full URL
- `isServerAvailable()`: Check if server is reachable

## File Naming Convention
Images are named: `{characterId}_{imageType}_{timestamp}.webp`

Examples:
- `char_123_portrait_1733684400000.webp`
- `char_456_background_1733684500000.webp`
- `portrait_1733684600000.webp` (no characterId)

## Storage Considerations

### Disk Space
- Mini PC has 512GB storage
- WebP compression typically reduces file size by 25-35%
- Example: 2MB JPG → ~1.4MB WebP
- Can store ~350,000+ character portraits (at avg 1.5MB each)

### Cleanup Strategy (Future Enhancement)
Consider implementing:
1. Delete images when character is deleted
2. Periodic cleanup of orphaned images
3. Image gallery management interface

## Browser Compatibility
WebP is supported in:
- Chrome 23+ (2012)
- Firefox 65+ (2019)
- Safari 14+ (2020)
- Edge 18+ (2018)

All modern browsers fully support WebP.

## Security Notes
- File type validation (only JPEG, PNG, WebP accepted)
- 10MB file size limit
- Directory traversal protection on delete
- Files served from dedicated `/images/` directory
- No executable file types accepted
