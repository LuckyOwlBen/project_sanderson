import { Component, OnInit, OnDestroy } from '@angular/core';
import { CulturalInterface } from '../../character/culture/culturalInterface';
import { ALL_CULTURES } from '../../character/culture/allCultures';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CharacterStateService } from '../../character/characterStateService';
import { StepValidationService } from '../../services/step-validation.service';
import { CharacterStorageService } from '../../services/character-storage.service';
import { CharacterCreationApiService } from '../../services/character-creation-api.service';
import { Subject, takeUntil } from 'rxjs';

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
  confirmedCultures: CulturalInterface[] = [];
  showValidation = false;
  isLoading = false;
  private characterId: string | null = null;
  
  constructor(
    private characterState: CharacterStateService,
    private validationService: StepValidationService,
    private storageService: CharacterStorageService,
    private creationApiService: CharacterCreationApiService
  ) {
    this.initializeCultureInfos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  get canProgress(): boolean {
    return this.confirmedCultures.length > 0;
  }
  
  get availableCultureInfos(): CultureInfo[] {
    return this.allCultureInfos.filter(info => 
      !this.confirmedCultures.some(culture => culture.name === info.culture.name)
    );
  }
  
  get selectedCultureInfos(): CultureInfo[] {
    return this.allCultureInfos.filter(info => 
      this.confirmedCultures.some(culture => culture.name === info.culture.name)
    );
  }
  
  get isMaxCulturesSelected(): boolean {
    return this.confirmedCultures.length >= 2;
  }

  ngOnInit(): void {
    const current = this.characterState.getCharacter();
    this.characterId = (current as any)?.id || null;
    this.confirmedCultures = current.cultures || [];
    this.initializeCultureInfos();
    this.updateValidation();
    this.showValidation = this.confirmedCultures.length === 0;
  }

  private updateValidation(): void {
    const isValid = this.confirmedCultures.length > 0;
    this.validationService.setStepValid(this.STEP_INDEX, isValid);
  }

  private initializeCultureInfos(): void {
    // Get current character ancestry from the service
    let currentCharacter: any = null;
    const subscription = this.characterState.character$.subscribe(char => currentCharacter = char);
    subscription.unsubscribe();
    const currentAncestry = currentCharacter?.ancestry;
    
    this.allCultureInfos = ALL_CULTURES
      .filter(culture => {
        // Filter out cultures restricted to specific ancestries if character doesn't match
        if (culture.restrictedToAncestry) {
          return currentAncestry === culture.restrictedToAncestry;
        }
        return true;
      })
      .map(culture => ({
        culture: culture,
        name: culture.name,
        expertise: culture.expertise,
        description: culture.description,
        imagePlaceholder: this.getImagePlaceholder(culture.name),
        imageUrl: this.getImageUrl(culture.name),
        suggestedNames: culture.suggestedNames
      }));
  }

  private getImagePlaceholder(cultureName: string): string {
    const placeholders: { [key: string]: string } = {
      'Alethi': 'linear-gradient(135deg, #8B4513 0%, #D2691E 100%)',
      'Azish': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
      'Herdazian': 'linear-gradient(135deg, #228B22 0%, #32CD32 100%)',
      'Iriali': 'linear-gradient(135deg, #FF6347 0%, #FF4500 100%)',
      'Kharbranthian': 'linear-gradient(135deg, #4169E1 0%, #1E90FF 100%)',
      'Listener': 'linear-gradient(135deg, #800080 0%, #9932CC 100%)',
      'Natan': 'linear-gradient(135deg, #20B2AA 0%, #48D1CC 100%)',
      'Reshi': 'linear-gradient(135deg, #00CED1 0%, #40E0D0 100%)',
      'Shin': 'linear-gradient(135deg, #F0E68C 0%, #EEE8AA 100%)',
      'Thaylen': 'linear-gradient(135deg, #2F4F4F 0%, #708090 100%)',
      'Unkalaki': 'linear-gradient(135deg, #A0522D 0%, #CD853F 100%)',
      'Veden': 'linear-gradient(135deg, #DC143C 0%, #B22222 100%)',
      'Wayfarer': 'linear-gradient(135deg, #696969 0%, #808080 100%)'
    };
    return placeholders[cultureName] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  }

  private getImageUrl(cultureName: string): string {
    const fileName = cultureName.toLowerCase().replace(/\s+/g, '-');
    return `/images/cultures/${fileName}.jpg`;
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
      this.characterState.addCulture(this.selectedCulture.culture);
      this.confirmedCultures = this.characterState.getCharacter().cultures || [];
      this.initializeCultureInfos();
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
    this.characterState.removeCulture(cultureInfo.culture);
    this.confirmedCultures = this.characterState.getCharacter().cultures || [];
    this.initializeCultureInfos();
    this.updateValidation();
  }

  // Persist hook for CharacterCreatorView
  public persistStep(): void {
    const character = this.characterState.getCharacter();
    if (!this.characterId) {
      return;
    }

    this.isLoading = true;

    // Try to save cultures via API first
    this.creationApiService.updateCultures(this.characterId, this.confirmedCultures)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('[CultureSelector] Cultures saved to server:', response);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('[CultureSelector] Failed to save cultures via API:', err);
          this.isLoading = false;

          // Fallback to localStorage
          this.storageService.saveCharacter(character).subscribe({
            next: () => {
              console.log('[CultureSelector] Cultures saved to localStorage');
            },
            error: () => console.error('[CultureSelector] Failed to save cultures to localStorage')
          });
        }
      });
  }
}
