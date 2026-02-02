import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, filter } from 'rxjs';
import { StepValidationService } from '../../services/step-validation.service';
import { NameApiService } from '../../services/name-api.service';
import { CharacterIdentityService } from '../../services/character-identity.service';
import { CulturesService } from '../../services/cultures.service';

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
  
  characterName: string = '';
  characterLevel: number = 1;
  nameError: string = '';
  suggestedNames: string[] = [];
  isLoading: boolean = false;
  isWaitingForIdentity: boolean = false;
  availableLevels: number[] = [];
  private characterId: string | null = null;

  constructor(
    private router: Router,
    private validationService: StepValidationService,
    private nameApiService: NameApiService,
    private identityService: CharacterIdentityService,
    private culturesService: CulturesService,
    private cdr: ChangeDetectorRef
  ) {
    // Generate available levels 1-21
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

    // Monitor the waiting flag from identity service
    this.identityService.waitingForIdentity$
      .pipe(takeUntil(this.destroy$))
      .subscribe((waiting) => {
        this.isWaitingForIdentity = waiting;
      });

    // Once we have a character ID, load name and level from API
    this.identityService.currentCharacterId$
      .pipe(
        takeUntil(this.destroy$),
        filter((id) => id !== null) // Only proceed when ID exists
      )
      .subscribe((characterId) => {
        if (characterId) {
          this.characterId = characterId;
          this.loadNameFromApi(characterId);
        }
      });
  }

  private loadNameFromApi(characterId: string): void {
    console.log('[CharacterName] Loading name and level for character:', characterId);
    this.nameApiService.getName(characterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (nameData) => {
          if (nameData) {
            this.characterName = nameData.name;
            this.characterLevel = nameData.level;
            console.log('[CharacterName] Loaded name:', this.characterName, 'level:', this.characterLevel);
            console.log('[CharacterName] Loaded cultures:', nameData.cultures);
            this.updateSuggestedNames(nameData.cultures);
          } else {
            console.warn('[CharacterName] API returned null for name');
            this.characterName = '';
            this.characterLevel = 1;
            this.updateSuggestedNames([]);
          }
          this.validateName();
          this.updateValidation();
          this.isWaitingForIdentity = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('[CharacterName] Failed to load name:', err);
          this.characterName = '';
          this.characterLevel = 1;
          this.updateSuggestedNames([]);
          this.validateName();
          this.updateValidation();
          this.isWaitingForIdentity = false;
          this.cdr.detectChanges();
          this.router.navigate(['/']);
        }
      });
  }

  private updateSuggestedNames(cultureNames: string[] = []): void {
    this.suggestedNames = this.culturesService.getSuggestedNames(cultureNames);
  }

  selectSuggestedName(name: string): void {
    this.characterName = name;
    this.onNameChange();
  }

  onLevelChange(): void {
    this.updateValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onNameChange(): void {
    this.validateName();
    this.updateValidation();
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

  // Persist hook for CharacterCreatorView
  public persistStep(): void {
    console.log('[CharacterName] persistStep called');
    
    if (!this.characterId) {
      console.warn('[CharacterName] No character ID available for saving');
      return;
    }

    if (this.nameError !== '') {
      console.warn('[CharacterName] Name has validation errors, cannot save');
      return;
    }

    const nameToSave = this.characterName.trim();
    console.log('[CharacterName] Saving name:', nameToSave, 'level:', this.characterLevel);
    
    this.isLoading = true;
    this.nameApiService.saveName(this.characterId, nameToSave, this.characterLevel)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('[CharacterName] Name saved to server:', response);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('[CharacterName] Failed to save name:', error);
          this.isLoading = false;
          this.router.navigate(['/']);
        }
      });
  }
}

