import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, filter, take } from 'rxjs';
import { Ancestry } from '../../character/ancestry/ancestry';
import { StepValidationService } from '../../services/step-validation.service';
import { AncestryApiService } from '../../services/ancestry-api.service';
import { CharacterIdentityService } from '../../services/character-identity.service';
import { NavFinalizedService } from '../../services/nav-finalized.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

interface AncestryInfo {
  type: Ancestry;
  title: string;
  shortDesc: string;
  fullDesc: string;
  features: string[];
  imagePlaceholder: string;
  image: string;
}

@Component({
  selector: 'app-ancestry-selector',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
  ],
  templateUrl: './ancestry-selector.html',
  styleUrl: './ancestry-selector.scss',
})
export class AncestrySelector implements OnInit, OnDestroy {
  private readonly STEP_INDEX = 0; // Ancestry is step 0
  private destroy$ = new Subject<void>();
  
  selectedAncestry: Ancestry | null = null;
  Ancestry = Ancestry; // Expose enum to template
  isLoading: boolean = false;
  isWaitingForIdentity: boolean = false;
  isFinalized: boolean = false;

  ancestries: AncestryInfo[] = [
    {
      type: Ancestry.HUMAN,
      title: 'Human',
      shortDesc: 'The most common people of Roshar',
      fullDesc: 'Humans are the dominant species on Roshar, having arrived on the world long ago. They inhabit every corner of the planet, from the storm-battered eastern kingdoms to the sheltered western lands of Shinovar. Humans display tremendous diversity in culture, appearance, and ambition.',
      features: [
        'Versatile and adaptable to any role',
        'Can pursue any path or profession',
        'Most common ancestry across Roshar',
        'Wide variety of cultures and traditions'
      ],
      imagePlaceholder: 'account_circle',
      image: '/images/ancestries/human.jpg'
    },
    {
      type: Ancestry.SINGER,
      title: 'Singer',
      shortDesc: 'Ancient inhabitants with the ability to change forms',
      fullDesc: 'Singers are humanoid beings with distinctive carapace armor and the extraordinary ability to assume different forms during highstorms by bonding with spren. Once called parshendi or parshmen, they are the original inhabitants of Roshar. In their various forms, singers can adapt their physical and mental capabilities to suit different roles in society.',
      features: [
        'Can change forms during highstorms',
        'Natural carapace provides protection',
        'Unique connection to Roshar\'s rhythms',
        'Access to specialized form abilities',
        'Ancient heritage predating humans'
      ],
      imagePlaceholder: 'psychology',
      image: '/images/ancestries/singer.jpg'

    }
  ];

  constructor(
    private router: Router,
    private validationService: StepValidationService,
    private ancestryApiService: AncestryApiService,
    private identityService: CharacterIdentityService,
    private navFinalizedService: NavFinalizedService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to nav finalized status for lock state
    this.navFinalizedService.getNavigationFinalized()
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.isFinalized = status.ancestry === 'finalized';
        this.cdr.markForCheck();
      });

    // Monitor the waiting flag from identity service
    this.identityService.waitingForIdentity$
      .pipe(takeUntil(this.destroy$))
      .subscribe((waiting) => {
        this.isWaitingForIdentity = waiting;
      });

    // Once we have a character ID, lazy load ancestry from API
    this.identityService.currentCharacterId$
      .pipe(
        takeUntil(this.destroy$),
        filter((id) => id !== null) // Only proceed when ID exists
      )
      .subscribe((characterId) => {
        if (characterId) {
          this.loadAncestryFromApi(characterId);
        }
      });
  }

  private loadAncestryFromApi(characterId: string): void {
    console.log('[AncestrySelector] Loading ancestry from API for character:', characterId);
    this.ancestryApiService.getAncestry(characterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ancestry) => {
          console.log('[AncestrySelector] Received ancestry from API:', ancestry);
          if (ancestry) {
            this.selectedAncestry = ancestry;
          } else {
            this.selectedAncestry = null;
          }
          this.updateValidation();
          this.isWaitingForIdentity = false;
          console.log('[AncestrySelector] Updated selectedAncestry:', this.selectedAncestry);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('[AncestrySelector] Error loading ancestry from API:', err);
          this.selectedAncestry = null;
          this.updateValidation();
          this.isWaitingForIdentity = false;
          this.cdr.detectChanges();
          this.router.navigate(['/']);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectAncestry(ancestry: Ancestry): void {
    this.selectedAncestry = ancestry;
    this.updateValidation();
  }

  private updateValidation(): void {
    const isValid = this.selectedAncestry !== null;
    this.validationService.setStepValid(this.STEP_INDEX, isValid);
  }

  navigateNext(): void {
    this.router.navigate(['/character-creator-view/culture']);
  }

  // Persist hook for CharacterCreatorView
  public persistStep(): Promise<void> {
    console.log('[AncestrySelector] persistStep called');
    return new Promise<void>((resolve, reject) => {
      this.identityService.currentCharacterId$.pipe(
        takeUntil(this.destroy$),
        filter(id => id !== null),
        take(1)
      ).subscribe(characterId => {
        if (!characterId) {
          console.warn('[AncestrySelector] No character ID available for saving');
          resolve();
          return;
        }

        if (!this.selectedAncestry) {
          console.warn('[AncestrySelector] No ancestry selected for saving');
          resolve();
          return;
        }

        console.log('[AncestrySelector] Saving ancestry:', this.selectedAncestry, 'for character:', characterId);
        this.isLoading = true;
        this.ancestryApiService.saveAncestry(characterId, this.selectedAncestry)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              console.log('[AncestrySelector] Ancestry saved to server:', response);
              this.isLoading = false;
              resolve();
            },
            error: (error) => {
              console.error('[AncestrySelector] Failed to save ancestry:', error);
              this.isLoading = false;
              reject(error);
            }
          });
      });
    });
  }
}


