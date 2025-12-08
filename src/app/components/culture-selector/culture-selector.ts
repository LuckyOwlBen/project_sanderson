import { Component, OnInit } from '@angular/core';
import { CulturalInterface } from '../../character/culture/culturalInterface';
import { ALL_CULTURES } from '../../character/culture/allCultures';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CharacterStateService } from '../../character/characterStateService';

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
export class CultureSelector implements OnInit {
  allCultureInfos: CultureInfo[] = [];
  selectedCulture: CultureInfo | null = null;
  confirmedCultures: CulturalInterface[] = [];
  showValidation = false;
  
  constructor(private characterState: CharacterStateService) {
    this.initializeCultureInfos();
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

  ngOnInit(): void {
    this.characterState.character$.subscribe(char => {
      this.confirmedCultures = char.cultures || [];
      // Show validation if we're on this page and have no cultures
      if (this.confirmedCultures.length === 0) {
        // Delay to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.showValidation = true;
        }, 0);
      } else {
        this.showValidation = false;
      }
    });
  }

  private initializeCultureInfos(): void {
    this.allCultureInfos = ALL_CULTURES.map(culture => ({
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
  }

  confirmCulture(): void {
    if (this.selectedCulture) {
      this.characterState.addCulture(this.selectedCulture.culture);
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
  }
}
