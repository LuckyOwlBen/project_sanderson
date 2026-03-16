import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CulturalInterface } from '../../character/culture/culturalInterface';
import { Ancestry } from '../../character/ancestry/ancestry';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { StepValidationService } from '../../services/step-validation.service';
import { CultureApiService } from '../../services/culture-api.service';
import { CharacterIdentityService } from '../../services/character-identity.service';
import { CulturesService } from '../../services/cultures.service';
import { NavFinalizedService } from '../../services/nav-finalized.service';
import { Subject, firstValueFrom, takeUntil, filter, take } from 'rxjs';

interface CultureInfo {
  culture: CulturalInterface;
  name: string;
  expertise: string;
  description: string;
  imagePlaceholder: string;
  imageUrl: string;
  suggestedNames: string[];
}

@Component({
  selector: 'app-culture-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './culture-selector.html',
  styleUrls: ['./culture-selector.scss']
})
export class CultureSelector implements OnInit, OnDestroy {
  private readonly STEP_INDEX = 1; // Culture is step 1
  private destroy$ = new Subject<void>();
  
  allCultureInfos: CultureInfo[] = [];
  selectedCulture: CultureInfo | null = null;
  selectedCultureNames: string[] = [];
  availableCultureInfos: CultureInfo[] = [];
  selectedCultureInfos: CultureInfo[] = [];
  currentAncestry: string | null = null;
  showValidation = false;
  isLoading = false;
  isWaitingForIdentity = false;
  isFinalized = false;
  
  constructor(
    private router: Router,
    private validationService: StepValidationService,
    private cultureApiService: CultureApiService,
    private identityService: CharacterIdentityService,
    private culturesService: CulturesService,
    private navFinalizedService: NavFinalizedService,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeCultureInfos();
    this.updateCultureLists();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  get canProgress(): boolean {
    return this.selectedCultureNames.length > 0;
  }
  
  get isMaxCulturesSelected(): boolean {
    return this.selectedCultureNames.length >= 2;
  }

  private updateCultureLists(): void {
    // Filter by both selection status and ancestry restrictions
    this.availableCultureInfos = this.allCultureInfos.filter(info => 
      !this.selectedCultureNames.includes(info.culture.name) &&
      this.isCultureAvailable(info.culture)
    );
    this.selectedCultureInfos = this.allCultureInfos.filter(info => 
      this.selectedCultureNames.includes(info.culture.name)
    );
  }

  private isCultureAvailable(culture: CulturalInterface): boolean {
    // If culture has ancestry restriction, only show if it matches current ancestry
    if (culture.restrictedToAncestry) {
      return culture.restrictedToAncestry === this.currentAncestry;
    }
    // If no restriction, culture is available to all
    return true;
  }

  ngOnInit(): void {
    // Subscribe to nav finalized status for lock state
    this.navFinalizedService.getNavigationFinalized()
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.isFinalized = status.culture === 'finalized';
        this.cdr.markForCheck();
      });

    // Monitor the waiting flag from identity service
    this.identityService.waitingForIdentity$
      .pipe(takeUntil(this.destroy$))
      .subscribe((waiting) => {
        this.isWaitingForIdentity = waiting;
      });

    // Once we have a character ID, load cultures from API
    this.identityService.currentCharacterId$
      .pipe(
        takeUntil(this.destroy$),
        filter((id) => id !== null) // Only proceed when ID exists
      )
      .subscribe((characterId) => {
        if (characterId) {
          this.loadCulturesFromApi(characterId);
        }
      });
  }

  private loadCulturesFromApi(characterId: string): void {
    console.log('[CultureSelector] Loading cultures for character:', characterId);
    this.cultureApiService.getCultures(characterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('[CultureSelector] Received cultures from API:', response);
          this.currentAncestry = response.ancestry;
          this.selectedCultureNames = response.cultures || [];
          this.updateCultureLists();
          this.updateValidation();
          this.isWaitingForIdentity = false;
          console.log('[CultureSelector] Current ancestry:', this.currentAncestry);
          console.log('[CultureSelector] Updated selectedCultureNames:', this.selectedCultureNames);
          console.log('[CultureSelector] Available cultures:', this.availableCultureInfos.length);
          console.log('[CultureSelector] Selected cultures:', this.selectedCultureInfos.length);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('[CultureSelector] Failed to load cultures:', err);
          this.currentAncestry = null;
          this.selectedCultureNames = [];
          this.updateCultureLists();
          this.updateValidation();
          this.isWaitingForIdentity = false;
          this.cdr.detectChanges();
          this.router.navigate(['/']);
        }
      });
  }

  private updateValidation(): void {
    // Culture selection is optional on first load, becomes valid once at least one is selected
    // Allow empty state initially, but require at least one culture before proceeding
    const isValid = true; // Step is always valid for navigation purposes
    this.validationService.setStepValid(this.STEP_INDEX, isValid);
  }

  private initializeCultureInfos(): void {
    this.allCultureInfos = this.culturesService.getAllCultures()
      .map(culture => ({
        culture: culture,
        name: culture.name,
        expertise: culture.expertise,
        description: culture.description,
        imagePlaceholder: this.culturesService.getImagePlaceholder(culture.name),
        imageUrl: this.culturesService.getImageUrl(culture.name),
        suggestedNames: culture.suggestedNames
      }));
  }

  viewCultureDetails(cultureInfo: CultureInfo): void {
    this.selectedCulture = cultureInfo;
    
    // Scroll to top when details open
    setTimeout(() => {
      const detailsSection = document.querySelector('.culture-details');
      if (detailsSection) {
        detailsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // Fallback: scroll the main content area to top
        const mainContent = document.querySelector('.app-sidenav-content');
        if (mainContent) {
          mainContent.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }, 0);
  }

  confirmCulture(): void {
    if (this.selectedCulture) {
      this.selectedCultureNames.push(this.selectedCulture.culture.name);
      this.updateCultureLists();
      this.updateValidation();
      this.selectedCulture = null;
      this.showValidation = false;
      
      // Scroll to selected cultures section after a brief delay
      setTimeout(() => {
        const selectedSection = document.querySelector('.selected-cultures-section');
        if (selectedSection) {
          selectedSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }

  backToSelection(): void {
    this.selectedCulture = null;
  }

  removeCulture(cultureInfo: CultureInfo): void {
    this.selectedCultureNames = this.selectedCultureNames.filter(name => name !== cultureInfo.culture.name);
    this.updateCultureLists();
    this.updateValidation();
  }

  // Persist hook for CharacterCreatorView
  public async persistStep(): Promise<void> {
    console.log('[CultureSelector] persistStep called');
    const characterId = await firstValueFrom(
      this.identityService.currentCharacterId$.pipe(take(1))
    );

    if (!characterId) {
      console.warn('[CultureSelector] No character ID available for saving');
      return;
    }

    if (this.selectedCultureNames.length === 0) {
      console.warn('[CultureSelector] No cultures selected for saving');
      return;
    }

    console.log('[CultureSelector] Saving cultures:', this.selectedCultureNames, 'for character:', characterId);
    this.isLoading = true;
    try {
      const response = await firstValueFrom(
        this.cultureApiService.saveCultures(characterId, this.selectedCultureNames)
      );
      console.log('[CultureSelector] Cultures saved to server:', response);
    } catch (error) {
      console.error('[CultureSelector] Failed to save cultures:', error);
      this.router.navigate(['/']);
    } finally {
      this.isLoading = false;
    }
  }
}
