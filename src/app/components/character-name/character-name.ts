import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { Subject, takeUntil } from 'rxjs';
import { CharacterStateService } from '../../character/characterStateService';
import { Character } from '../../character/character';

@Component({
  selector: 'app-character-name',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule
  ],
  templateUrl: './character-name.html',
  styleUrl: './character-name.scss',
})
export class CharacterName implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  character: Character | null = null;
  characterName: string = '';
  nameError: string = '';

  constructor(private characterState: CharacterStateService) {}

  ngOnInit(): void {
    this.characterState.character$
      .pipe(takeUntil(this.destroy$))
      .subscribe(character => {
        this.character = character;
        // Only sync characterName if it's empty (initial load)
        if (!this.characterName) {
          this.characterName = character.name || '';
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onNameChange(): void {
    this.validateName();
    // characterName is the proxy - user can type anything
    // Only update character.name when validation passes
    if (this.character) {
      if (this.nameError === '') {
        // Valid: update character name
        this.character.name = this.characterName.trim();
        (this.character as any).nameInputHasError = false;
      } else {
        // Invalid: clear character name but keep nameInputHasError flag
        this.character.name = '';
        (this.character as any).nameInputHasError = true;
      }
      this.characterState.updateCharacter(this.character);
    }
  }

  private validateName(): void {
    const trimmedName = this.characterName.trim();
    
    // Check if empty
    if (!trimmedName) {
      this.nameError = 'Character name is required';
      return;
    }
    
    // Check minimum length
    if (trimmedName.length < 2) {
      this.nameError = 'Name must be at least 2 characters';
      return;
    }
    
    // Check maximum length
    if (trimmedName.length > 50) {
      this.nameError = 'Name must be 50 characters or less';
      return;
    }
    
    // Only allow letters, spaces, hyphens, and apostrophes
    // This prevents SQL injection and other malicious input
    const validNamePattern = /^[a-zA-Z\s\-']+$/;
    if (!validNamePattern.test(trimmedName)) {
      this.nameError = 'Name can only contain letters, spaces, hyphens, and apostrophes';
      return;
    }
    
    // Prevent excessive spaces
    if (/\s{2,}/.test(trimmedName)) {
      this.nameError = 'Name cannot contain multiple consecutive spaces';
      return;
    }
    
    // Name is valid
    this.nameError = '';
  }

  isNameValid(): boolean {
    // Re-validate to ensure we have current state
    this.validateName();
    return this.nameError === '' && this.characterName.trim().length >= 2;
  }
}
