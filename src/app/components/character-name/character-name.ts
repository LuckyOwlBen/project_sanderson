import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, takeUntil } from 'rxjs';
import { CharacterStateService } from '../../character/characterStateService';
import { StepValidationService } from '../../services/step-validation.service';
import { Character } from '../../character/character';

@Component({
  selector: 'app-character-name',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './character-name.html',
  styleUrl: './character-name.scss',
})
export class CharacterName implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private readonly STEP_INDEX = 2; // Name is step 2
  
  character: Character | null = null;
  characterName: string = '';
  nameError: string = '';
  suggestedNames: string[] = [];

  constructor(
    private characterState: CharacterStateService,
    private validationService: StepValidationService
  ) {}

  ngOnInit(): void {
    // Scroll to top when component loads
    setTimeout(() => {
      const mainContent = document.querySelector('.app-sidenav-content');
      if (mainContent) {
        mainContent.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 0);

    this.characterState.character$
      .pipe(takeUntil(this.destroy$))
      .subscribe(character => {
        this.character = character;
        // Only sync characterName if it's empty (initial load)
        if (!this.characterName) {
          this.characterName = character.name || '';
        }
        // Update suggested names from cultures
        this.updateSuggestedNames();
        // Validate on load for existing characters
        this.validateName();
        this.updateValidation();
      });
  }

  private updateSuggestedNames(): void {
    if (!this.character?.cultures || this.character.cultures.length === 0) {
      this.suggestedNames = [];
      return;
    }
    
    // Combine suggested names from all cultures
    const allNames = new Set<string>();
    this.character.cultures.forEach(culture => {
      if (culture.suggestedNames) {
        culture.suggestedNames.forEach(name => allNames.add(name));
      }
    });
    
    this.suggestedNames = Array.from(allNames);
  }

  selectSuggestedName(name: string): void {
    this.characterName = name;
    this.onNameChange();
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
      this.updateValidation();
    }
  }

  private updateValidation(): void {
    const isValid = this.nameError === '' && this.characterName.trim().length >= 2;
    this.validationService.setStepValid(this.STEP_INDEX, isValid);
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
