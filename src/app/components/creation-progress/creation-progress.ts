import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { NavFinalizedService, NavigationFinalized } from '../../services/nav-finalized.service';

export interface CreationStepStatus {
  label: string;
  icon: string;
  route: string;
  stepNumber: number;
  stepKey: keyof NavigationFinalized;
  finalized: boolean;
  hasPending: boolean;
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
        this.updateStepFinalizedStatus(navStatus);
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeSteps(): void {
    this.steps = [
      { label: 'Ancestry', icon: 'groups', route: 'ancestry', stepNumber: 0, stepKey: 'ancestry', finalized: false, hasPending: true },
      { label: 'Culture', icon: 'public', route: 'culture', stepNumber: 1, stepKey: 'culture', finalized: false, hasPending: true },
      { label: 'Name', icon: 'badge', route: 'name', stepNumber: 2, stepKey: 'name', finalized: false, hasPending: true },
      { label: 'Attributes', icon: 'fitness_center', route: 'attributes', stepNumber: 3, stepKey: 'attributes', finalized: false, hasPending: true },
      { label: 'Expertises', icon: 'auto_stories', route: 'expertises', stepNumber: 4, stepKey: 'expertises', finalized: false, hasPending: true },
      { label: 'Skills', icon: 'school', route: 'skills', stepNumber: 5, stepKey: 'skills', finalized: false, hasPending: true },
      { label: 'Path', icon: 'explore', route: 'paths', stepNumber: 6, stepKey: 'paths', finalized: false, hasPending: true },
      { label: 'Talents', icon: 'stars', route: 'talents', stepNumber: 7, stepKey: 'talents', finalized: false, hasPending: true },
      { label: 'Equipment', icon: 'inventory_2', route: 'equipment', stepNumber: 8, stepKey: 'equipment', finalized: false, hasPending: true },
      { label: 'Review', icon: 'check_circle', route: 'review', stepNumber: 9, stepKey: 'equipment', finalized: false, hasPending: true },
    ];
  }

  private updateStepFinalizedStatus(navStatus: NavigationFinalized): void {
    // Update finalized status from the backend service
    this.steps.forEach(step => {
      step.finalized = navStatus[step.stepKey];
      // Gold boxes show for any step that isn't finalized yet
      step.hasPending = !step.finalized;
    });
  }

  navigateToStep(step: CreationStepStatus): void {
    this.router.navigate(['/character-creator-view', step.route]);
  }
}
