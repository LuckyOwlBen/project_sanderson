import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil, filter } from 'rxjs';
import { CharacterIdentityService } from '../../services/character-identity.service';
import { FinalizeApiService, CompleteCharacterView } from '../../services/finalize-api.service';
import { CharacterImage } from '../../components/shared/character-image/character-image';

@Component({
  selector: 'app-character-review',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    CharacterImage
  ],
  templateUrl: './character-review.html',
  styleUrl: './character-review.scss',
})
export class CharacterReview implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  completeCharacter: CompleteCharacterView | null = null;
  portraitUrl: string | null = null;
  isLevelUpMode: boolean = false;
  isLoadingCharacter: boolean = false;
  isWaitingForIdentity: boolean = false;
  characterLoadError: string = '';
  private characterId: string | null = null;

  constructor(
    private activatedRoute: ActivatedRoute,
    private identityService: CharacterIdentityService,
    private finalizeApi: FinalizeApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to route params to detect level-up mode
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.isLevelUpMode = params['levelUp'] === 'true';
      });

    // Monitor waiting state for character ID
    this.identityService.waitingForIdentity$
      .pipe(takeUntil(this.destroy$))
      .subscribe((waiting) => {
        this.isWaitingForIdentity = waiting;
      });

    // Wait for character ID, then load complete character
    this.identityService.currentCharacterId$
      .pipe(
        takeUntil(this.destroy$),
        filter((id) => id !== null)
      )
      .subscribe((characterId) => {
        if (characterId) {
          this.characterId = characterId;
          this.loadCompleteCharacterFromApi(characterId);
        }
      });
  }

  private loadCompleteCharacterFromApi(characterId: string): void {
    console.log('[CharacterReview] Loading complete character from API:', characterId);
    this.isLoadingCharacter = true;
    this.characterLoadError = '';

    this.finalizeApi.getCompleteCharacter(characterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (complete) => {
          this.isLoadingCharacter = false;
          if (!complete) {
            console.warn('[CharacterReview] API returned no complete character for ID:', characterId);
            this.characterLoadError = 'Failed to load character. Character may have been deleted.';
            return;
          }
          this.completeCharacter = complete;
          console.log('[CharacterReview] Complete character loaded from API:', complete.name);
        },
        error: (err) => {
          this.isLoadingCharacter = false;
          console.error('[CharacterReview] Failed to load complete character from API:', err);
          this.characterLoadError = 'Failed to load character. Please check your connection.';
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  finalizeCharacter(): void {
    if (!this.characterId) {
      console.error('[CharacterReview] Cannot finalize: No character ID available');
      return;
    }

    const characterName = this.completeCharacter?.name || 'character';
    console.log('[CharacterReview] Finalizing character creation:', characterName);
    this.isLoadingCharacter = true;
    this.characterLoadError = '';
    
    this.finalizeApi.finalizeCharacter(this.characterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          this.isLoadingCharacter = false;
          
          if (success) {
            console.log('[CharacterReview] ✅ Character finalized successfully:', this.characterId);
            // Navigate to character sheet
            this.router.navigate(['/character-sheet', this.characterId], {
              queryParams: {
                created: 'true' // Flag indicating character was just created
              }
            });
          } else {
            console.error('[CharacterReview] Finalize returned success=false');
            this.characterLoadError = 'Failed to finalize character. Please try again.';
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          this.isLoadingCharacter = false;
          console.error('[CharacterReview] ❌ Error finalizing character:', err);
          
          // Check if error message indicates unspent points
          const errorMessage = err?.error?.error || err?.message || 'Unknown error';
          if (errorMessage.includes('points remaining')) {
            this.characterLoadError = errorMessage;
          } else {
            this.characterLoadError = 'Error finalizing character. Please check your connection and try again.';
          }
          this.cdr.detectChanges();
        }
      });
  }
}




