import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CharacterStateService } from '../../character/characterStateService';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent } from "@angular/material/card";
import { CommonModule } from '@angular/common';
import { MatStepperModule } from '@angular/material/stepper';

@Component({
  selector: 'app-character-creator-view',
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    CommonModule,
    RouterOutlet,
    MatStepperModule
  ],
  templateUrl: './character-creator-view.html',
  styleUrl: './character-creator-view.scss',
})
export class CharacterCreatorView implements OnInit {
  currentStep = 0;
  
  steps = [
    { label: 'Ancestry', route: 'ancestry' },
    { label: 'Culture', route: 'culture' },
    { label: 'Attributes', route: 'attributes' },
    { label: 'Skills', route: 'skills' },
    { label: 'Talents', route: 'talents' },
    { label: 'Review', route: 'review' }
  ];

  constructor(
    private router: Router,
    public characterState: CharacterStateService
  ) {}

  ngOnInit(): void {
    // Automatically navigate to first step if at parent route
    if (this.router.url === '/character-creator') {
      this.router.navigate(['/character-creator/ancestry']);
    }
  }

  goToStep(index: number): void {
    this.currentStep = index;
    this.router.navigate(['/character-creator', this.steps[index].route]);
  }

  nextStep(): void {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.router.navigate(['/character-creator', this.steps[this.currentStep].route]);
    }
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.router.navigate(['/character-creator', this.steps[this.currentStep].route]);
    }
  }

  canGoNext(): boolean {
    // Add validation logic here based on current step
    // For now, always allow
    return true;
  }
}
