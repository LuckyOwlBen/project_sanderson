/**
 * MetadataModule - MODULE 15: METADATA
 * Handles session and modification tracking
 */

export class MetadataModule {
  sessionNotes: string = '';
  lastModified: string = '';

  constructor(sessionNotes: string = '', lastModified?: string) {
    this.sessionNotes = sessionNotes;
    this.lastModified = lastModified || new Date().toISOString();
  }

  /**
   * Update session notes
   */
  setSessionNotes(notes: string): void {
    this.sessionNotes = notes;
    this.updateModifiedTime();
  }

  /**
   * Append to session notes
   */
  appendSessionNotes(notes: string): void {
    if (this.sessionNotes) {
      this.sessionNotes += '\n' + notes;
    } else {
      this.sessionNotes = notes;
    }
    this.updateModifiedTime();
  }

  /**
   * Update last modified timestamp
   */
  updateModifiedTime(): void {
    this.lastModified = new Date().toISOString();
  }

  /**
   * Get last modified date
   */
  getLastModifiedDate(): Date {
    return new Date(this.lastModified);
  }
}
