import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { Character } from '../../character/character';
import { CharacterCreationFlowService } from '../../services/character-creation-flow-service';
import { CharacterStateService } from '../../character/characterStateService';

export interface CreationStepStatus {
  label: string;
  icon: string;
  route: string;
  stepNumber: number;
  completed: boolean;
  hasPending: boolean;
}

@Component({
  selector: 'app-creation-progress',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './creation-progress.html',
  styleUrl: './creation-progress.scss',
})
export class CreationProgressComponent implements OnInit, OnDestroy {
  @Input() displayMode: 'inline-progress' | 'navigation-grid' = 'navigation-grid';
  @Input() character: Character | null = null;
  @Input() isLevelUpMode: boolean = false;

  private destroy$ = new Subject<void>();
  
  steps: CreationStepStatus[] = [];
  currentStepIndex: number = 0;

  constructor(
    private router: Router,
    private flowService: CharacterCreationFlowService,
    private characterState: CharacterStateService
  ) {}

  ngOnInit(): void {
    this.initializeSteps();
    
    this.flowService.currentStep$
      .pipe(takeUntil(this.destroy$))
      .subscribe(index => {
        this.currentStepIndex = index;
      });

    // Subscribe to character changes to update step completion statuses
    this.characterState.character$
      .pipe(takeUntil(this.destroy$))
      .subscribe(character => {
        this.character = character;
        this.updateStepStatuses();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeSteps(): void {
    this.steps = [
      { label: 'Ancestry', icon: 'groups', route: 'ancestry', stepNumber: 0, completed: false, hasPending: false },
      { label: 'Culture', icon: 'public', route: 'culture', stepNumber: 1, completed: false, hasPending: false },
      { label: 'Name', icon: 'badge', route: 'name', stepNumber: 2, completed: false, hasPending: false },
      { label: 'Attributes', icon: 'fitness_center', route: 'attributes', stepNumber: 3, completed: false, hasPending: false },
      { label: 'Skills', icon: 'school', route: 'skills', stepNumber: 4, completed: false, hasPending: false },
      { label: 'Expertises', icon: 'auto_stories', route: 'expertises', stepNumber: 5, completed: false, hasPending: false },
      { label: 'Path', icon: 'explore', route: 'paths', stepNumber: 6, completed: false, hasPending: false },
      { label: 'Talents', icon: 'stars', route: 'talents', stepNumber: 7, completed: false, hasPending: false },
      { label: 'Equipment', icon: 'inventory_2', route: 'equipment', stepNumber: 8, completed: false, hasPending: false },
      { label: 'Review', icon: 'check_circle', route: 'review', stepNumber: 9, completed: false, hasPending: false },
    ];

    this.updateStepStatuses();
  }

  private updateStepStatuses(): void {
    if (!this.character) {
      return;
    }

    // Update completion status
    this.steps[0].completed = !!this.character.ancestry;
    this.steps[1].completed = this.character.cultures && this.character.cultures.length > 0;
    this.steps[2].completed = !!(this.character.name && this.character.name.length > 0);
    this.steps[3].completed = this.hasAttributesAllocated();
    this.steps[4].completed = this.hasSkillsAllocated();
    this.steps[5].completed = (this.character.selectedExpertises?.length ?? 0) > 0;
    this.steps[6].completed = !!this.character.radiantPath;
    this.steps[7].completed = (this.character.unlockedTalents?.size ?? 0) > 0;
    this.steps[8].completed = true; // Equipment is optional
    this.steps[9].completed = false; // Review is never "completed"
  }

  private hasAttributesAllocated(): boolean {
    if (!this.character) return false;
    const attrs = this.character.attributes;
    return attrs.strength > 0 || attrs.speed > 0 || attrs.awareness > 0 ||
           attrs.intellect > 0 || attrs.willpower > 0 || attrs.presence > 0;
  }

  private hasSkillsAllocated(): boolean {
    if (!this.character?.skills) return false;
    const skillRanks = this.character.skills.getAllSkillRanks();
    return Object.values(skillRanks).some(rank => rank > 0);
  }

  updateStepPending(stepNumber: number, hasPending: boolean): void {
    const step = this.steps.find(s => s.stepNumber === stepNumber);
    if (step) {
      step.hasPending = hasPending;
    }
  }

  navigateToStep(step: CreationStepStatus): void {
    this.router.navigate(['/character-creator-view', step.route]);
  }

  isCurrentStep(step: CreationStepStatus): boolean {
    return step.stepNumber === this.currentStepIndex;
  }
}
