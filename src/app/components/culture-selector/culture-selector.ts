import { Component } from '@angular/core';
import { CulturalInterface } from '../../character/culture/culturalInterface';
import { ALL_CULTURES } from '../../character/culture/allCultures';
import { CommonModule } from '@angular/common';
import { CharacterStateService } from '../../character/characterStateService';

@Component({
  selector: 'app-culture-selector',
  imports: [
    CommonModule
  ],
  templateUrl: './culture-selector.html',
  styleUrls: ['./culture-selector.scss']
})
export class CultureSelector {
  cultures: CulturalInterface[] = ALL_CULTURES;
  selectedCulture: CulturalInterface | null = null;
  confirmedCultures: CulturalInterface[] | null = null;
  constructor(private characterState: CharacterStateService) {}

    ngOnInit(): void {
    this.characterState.character$.subscribe(char => {
      this.confirmedCultures = char.cultures;
    });
  }

  selectCulture(culture: CulturalInterface): void {
    this.selectedCulture = culture;
  }

  confirmCulture(): void {
    if (this.selectedCulture) {
      this.characterState.addCulture(this.selectedCulture);
      this.selectedCulture = null;
      // Emit event or call service to save selection
    }
  }

  backToSelection(): void {
    this.selectedCulture = null;
  }
}
