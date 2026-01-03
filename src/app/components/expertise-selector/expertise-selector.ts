import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { CharacterStateService } from '../../character/characterStateService';
import { Character } from '../../character/character';
import { StepValidationService } from '../../services/step-validation.service';
import { CULTURAL_EXPERTISES, ExpertiseDefinition } from '../../character/expertises/allExpertises';

@Component({
  selector: 'app-expertise-selector',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule
  ],
  templateUrl: './expertise-selector.html',
  styleUrl: './expertise-selector.scss',
})
export class ExpertiseSelector implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private readonly STEP_INDEX = 5;
  
  character: Character | null = null;
  availableExpertises: ExpertiseDefinition[] = CULTURAL_EXPERTISES;
  selectedExpertises: string[] = [];
  culturalExpertises: string[] = []; // Auto-granted from culture selection
  availablePoints: number = 0;
  totalPoints: number = 0;
  validationMessage: string = '';

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
        this.selectedExpertises = [...character.selectedExpertises];
        this.extractCulturalExpertises();
        this.calculateAvailablePoints();
        this.updateValidation();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private extractCulturalExpertises(): void {
    if (!this.character) return;
    
    // Extract cultural expertise names from selected cultures
    this.culturalExpertises = this.character.cultures
      .map(culture => culture.name)
      .filter(name => CULTURAL_EXPERTISES.some(exp => exp.name === name));
    
    // Auto-add cultural expertises if not already selected
    this.culturalExpertises.forEach(expertise => {
      if (!this.selectedExpertises.includes(expertise)) {
        this.selectedExpertises.push(expertise);
        this.characterState.addExpertise(expertise);
      }
    });
  }

  private calculateAvailablePoints(): void {
    if (!this.character) return;
    
    // Total points = Intellect score
    this.totalPoints = this.character.attributes.intellect;
    
    // Available points = total - selected (excluding cultural auto-grants which are free)
    const nonCulturalSelections = this.selectedExpertises.filter(
      exp => !this.culturalExpertises.includes(exp)
    ).length;
    
    this.availablePoints = this.totalPoints - nonCulturalSelections;
  }

  private updateValidation(): void {
    const isValid = this.availablePoints >= 0;
    
    if (this.availablePoints < 0) {
      this.validationMessage = `You have selected too many expertises. Remove ${Math.abs(this.availablePoints)} expertise(s).`;
    } else if (this.availablePoints > 0) {
      this.validationMessage = `You have ${this.availablePoints} expertise point(s) remaining to spend.`;
    } else {
      this.validationMessage = 'All expertise points have been allocated.';
    }
    
    this.validationService.setStepValid(this.STEP_INDEX, isValid);
  }

  isExpertiseSelected(expertise: ExpertiseDefinition): boolean {
    return this.selectedExpertises.includes(expertise.name);
  }

  isCulturalExpertise(expertise: ExpertiseDefinition): boolean {
    return this.culturalExpertises.includes(expertise.name);
  }

  canSelectExpertise(expertise: ExpertiseDefinition): boolean {
    // Can always select if it's a cultural expertise (from their culture)
    if (this.isCulturalExpertise(expertise)) {
      return true;
    }
    
    // Can select if not already selected and have points available
    return !this.isExpertiseSelected(expertise) && this.availablePoints > 0;
  }

  canDeselectExpertise(expertise: ExpertiseDefinition): boolean {
    // Cultural expertises can be deselected
    return this.isExpertiseSelected(expertise);
  }

  toggleExpertise(expertise: ExpertiseDefinition): void {
    if (this.isExpertiseSelected(expertise)) {
      this.deselectExpertise(expertise);
    } else if (this.canSelectExpertise(expertise)) {
      this.selectExpertise(expertise);
    }
  }

  private selectExpertise(expertise: ExpertiseDefinition): void {
    if (!this.selectedExpertises.includes(expertise.name)) {
      this.selectedExpertises.push(expertise.name);
      this.characterState.addExpertise(expertise.name);
      this.calculateAvailablePoints();
      this.updateValidation();
    }
  }

  private deselectExpertise(expertise: ExpertiseDefinition): void {
    const index = this.selectedExpertises.indexOf(expertise.name);
    if (index !== -1) {
      this.selectedExpertises.splice(index, 1);
      this.characterState.removeExpertise(expertise.name);
      this.calculateAvailablePoints();
      this.updateValidation();
    }
  }

  getExpertisesByCategory(category: string): ExpertiseDefinition[] {
    return this.availableExpertises.filter(exp => exp.category === category);
  }

  removeExpertiseByName(expertiseName: string): void {
    const expertise = this.availableExpertises.find(e => e.name === expertiseName);
    if (expertise) {
      this.deselectExpertise(expertise);
    }
  }
}
