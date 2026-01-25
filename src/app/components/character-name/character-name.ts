import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { Subject, takeUntil } from 'rxjs';
import { CharacterStateService } from '../../character/characterStateService';
import { StepValidationService } from '../../services/step-validation.service';
import { Character } from '../../character/character';
import { CharacterStorageService } from '../../services/character-storage.service';
import { CharacterCreationApiService } from '../../services/character-creation-api.service';
import { ActivatedRoute } from '@angular/router';
import { LevelUpManager } from '../../levelup/levelUpManager';
import { LevelUpApiService } from '../../services/levelup-api.service';

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
    MatChipsModule,
    MatSelectModule,
    MatOptionModule
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
  isLevelUpMode: boolean = false;
  isLoading: boolean = false;
  private characterId: string | null = null;
  availableLevels: number[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private characterState: CharacterStateService,
    private validationService: StepValidationService,
    private storageService: CharacterStorageService,
    private creationApiService: CharacterCreationApiService,
    private levelUpManager: LevelUpManager,
    private levelUpApi: LevelUpApiService
  ) {
    // Generate available levels based on LevelUpManager's progression table
    // The progression tables have 21 entries (levels 1-21)
    this.availableLevels = Array.from({ length: 21 }, (_, i) => i + 1);
  }

  ngOnInit(): void {
    // Scroll to top when component loads
    setTimeout(() => {
      const mainContent = document.querySelector('.app-sidenav-content');
      if (mainContent) {
        mainContent.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 0);

    // Subscribe to route params so we can detect level-up mode and always
    // fetch a fresh character snapshot from the backend by ID.
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.isLevelUpMode = params['levelUp'] === 'true';

        // Read the current character snapshot to get the ID, but do not
        // subscribe to character$ (avoids stale state re-emits).
        this.character = this.characterState.getCharacter();
        this.characterId = (this.character as any)?.id || null;

        if (this.characterId) {
          this.fetchCharacterFromApi(this.characterId);
        } else {
          console.warn('[CharacterName] No character ID found; cannot load name from API');
          this.syncLocalCharacterState();
        }
      });
  }

  private fetchCharacterFromApi(characterId: string): void {
    this.storageService.loadCharacter(characterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (loaded) => {
          if (!loaded) {
            console.warn('[CharacterName] API returned no character for ID:', characterId);
            this.syncLocalCharacterState();
            return;
          }
          this.character = loaded;
          this.characterName = loaded.name || '';
          this.characterState.updateCharacter(loaded);
          this.updateSuggestedNames();
          this.validateName();
          this.updateValidation();
        },
        error: (err) => {
          console.error('[CharacterName] Failed to load character from API:', err);
          this.syncLocalCharacterState();
        }
      });
  }

  private syncLocalCharacterState(): void {
    // Fallback to whatever is currently in memory; still validate so the UI
    // remains usable even if the API call fails or the ID is missing.
    if (!this.character) {
      this.character = this.characterState.getCharacter();
    }
    if (this.character && !this.characterName) {
      this.characterName = this.character.name || '';
    }
    this.updateSuggestedNames();
    this.validateName();
    this.updateValidation();
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

  onLevelChange(): void {
    if (this.character) {
      this.characterState.updateCharacter(this.character);
      this.updateValidation();
    }
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

  // Persist hook for CharacterCreatorView
  public persistStep(): void {
    if (!this.character || !this.characterId) {
      return;
    }

    // Ensure the latest name is on the character before saving
    if (this.nameError === '') {
      this.character.name = this.characterName.trim();
    }

    this.isLoading = true;

    // Try to save name and level via API first
    this.creationApiService.updateName(this.characterId, this.character.name, this.character.level)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('[CharacterName] Name saved to server:', response);
          this.isLoading = false;

          // If level > 1, initialize the level with cumulative points
          if (this.character && this.character.level > 1) {
            this.levelUpApi.initializeLevel(this.characterId!, this.character.level).subscribe({
              next: () => {},
              error: (err) => console.error('[CharacterName] Failed to initialize level:', err)
            });
          }
        },
        error: (err) => {
          console.error('[CharacterName] Failed to save name via API:', err);
          this.isLoading = false;

          // Fallback to localStorage
          this.storageService.saveCharacter(this.character!).subscribe({
            next: () => {
              console.log('[CharacterName] Name saved to localStorage');
              if (this.character && this.character.level > 1) {
                this.levelUpApi.initializeLevel(this.characterId!, this.character.level).subscribe({
                  next: () => {},
                  error: (err) => console.error('[CharacterName] Failed to initialize level:', err)
                });
              }
            },
            error: () => console.error('[CharacterName] Failed to save name to localStorage')
          });
        }
      });
  }
}

