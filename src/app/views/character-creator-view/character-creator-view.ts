import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet, ActivatedRoute } from '@angular/router';
import { CharacterStateService } from '../../character/characterStateService';
import { CharacterCreationFlowService, CreationStep } from '../../services/character-creation-flow-service';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent } from "@angular/material/card";
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { filter, takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';

@Component({
  selector: 'app-character-creator-view',
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    CommonModule,
    RouterOutlet,
    MatButtonModule,
  ],
  templateUrl: './character-creator-view.html',
  styleUrl: './character-creator-view.scss',
})
export class CharacterCreatorView implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  steps: CreationStep[];
  currentStep: number = 0;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public characterState: CharacterStateService,
    public flowService: CharacterCreationFlowService
  ) {
    this.steps = this.flowService.getSteps();
  }

    ngOnInit(): void {
    // Subscribe to flow service changes and update local property
    this.flowService.currentStep$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(step => {
      this.currentStep = step;
    });

    // Sync flow service with current route on init
    this.flowService.setCurrentStepByRoute(this.router.url);

    // Check if we're at parent route with no child - redirect to first step
    const hasChildRoute = this.activatedRoute.firstChild !== null;
    if (!hasChildRoute) {
      const firstStepRoute = this.flowService.getStepRoute(0);
      if (firstStepRoute) {
        this.router.navigate([firstStepRoute], { relativeTo: this.activatedRoute });
      }
    }

    // Listen to route changes and update flow service
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.flowService.setCurrentStepByRoute(this.router.url);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  nextStep(): void {
    if (this.flowService.canGoNext()) {
      const nextIndex = this.flowService.getCurrentStep() + 1;
      const nextRoute = this.flowService.getStepRoute(nextIndex);
      if (nextRoute) {
        console.log('Navigating to next step route:', nextRoute);
        this.router.navigate([nextRoute], { relativeTo: this.activatedRoute });
      }
    }
  }

  previousStep(): void {
    if (this.flowService.canGoPrevious()) {
      const prevIndex = this.flowService.getCurrentStep() - 1;
      const prevRoute = this.flowService.getStepRoute(prevIndex);
      if (prevRoute) {
        this.router.navigate([prevRoute], { relativeTo: this.activatedRoute });
      }
    }
  }

  canGoNext(): boolean {
    return this.flowService.canGoNext();
  }

  canGoPrevious(): boolean {
    return this.flowService.canGoPrevious();
  }
}