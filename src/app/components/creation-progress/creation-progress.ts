import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { NavFinalizedService, NavigationFinalized, StepState } from '../../services/nav-finalized.service';

export interface CreationStepStatus {
  label: string;
  icon: string;
  route: string;
  stepNumber: number;
  stepKey: keyof NavigationFinalized;
  state: StepState;
}

@Component({
  selector: 'app-creation-progress',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './creation-progress.html',
  styleUrl: './creation-progress.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreationProgressComponent implements OnInit, OnDestroy {
  @Input() displayMode: 'inline-progress' | 'navigation-grid' = 'navigation-grid';

  private destroy$ = new Subject<void>();
  
  steps: CreationStepStatus[] = [];

  constructor(
    private router: Router,
    private navFinalized: NavFinalizedService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeSteps();
    
    // Single source of truth: navFinalized service
    this.navFinalized.getNavigationFinalized()
      .pipe(takeUntil(this.destroy$))
      .subscribe(navStatus => {
        this.updateStepStatus(navStatus);
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeSteps(): void {
    this.steps = [
      { label: 'Ancestry', icon: 'groups', route: 'ancestry', stepNumber: 0, stepKey: 'ancestry', state: 'pending' },
      { label: 'Culture', icon: 'public', route: 'culture', stepNumber: 1, stepKey: 'culture', state: 'pending' },
      { label: 'Name', icon: 'badge', route: 'name', stepNumber: 2, stepKey: 'name', state: 'pending' },
      { label: 'Attributes', icon: 'fitness_center', route: 'attributes', stepNumber: 3, stepKey: 'attributes', state: 'pending' },
      { label: 'Expertises', icon: 'auto_stories', route: 'expertises', stepNumber: 4, stepKey: 'expertises', state: 'pending' },
      { label: 'Skills', icon: 'school', route: 'skills', stepNumber: 5, stepKey: 'skills', state: 'pending' },
      { label: 'Path', icon: 'explore', route: 'paths', stepNumber: 6, stepKey: 'paths', state: 'pending' },
      { label: 'Talents', icon: 'stars', route: 'talents', stepNumber: 7, stepKey: 'talents', state: 'pending' },
      { label: 'Equipment', icon: 'inventory_2', route: 'equipment', stepNumber: 8, stepKey: 'equipment', state: 'pending' },
      { label: 'Review', icon: 'check_circle', route: 'review', stepNumber: 9, stepKey: 'equipment', state: 'pending' },
    ];
  }

  private updateStepStatus(navStatus: NavigationFinalized): void {
    this.steps.forEach(step => {
      step.state = navStatus[step.stepKey];
    });
  }

  navigateToStep(step: CreationStepStatus): void {
    this.router.navigate(['/character-creator-view', step.route]);
  }
}
