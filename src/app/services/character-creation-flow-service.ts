import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CreationStep {
  label: string;
  route: string;
}

@Injectable({
  providedIn: 'root'
})
export class CharacterCreationFlowService {
  private readonly steps: CreationStep[] = [
    { label: 'Ancestry', route: 'ancestry' },
    { label: 'Culture', route: 'culture' },
    { label: 'Attributes', route: 'attributes' },
    { label: 'Skills', route: 'skills' },
    { label: 'Paths', route: 'paths' },
    { label: 'Talents', route: 'talents' },
    { label: 'Review', route: 'review' }
  ];

  private currentStepSubject = new BehaviorSubject<number>(0);
  public currentStep$: Observable<number> = this.currentStepSubject.asObservable();

  getSteps(): CreationStep[] {
    return this.steps;
  }

  getCurrentStep(): number {
    return this.currentStepSubject.value;
  }

  setCurrentStep(stepIndex: number): void {
    if (stepIndex >= 0 && stepIndex < this.steps.length) {
      this.currentStepSubject.next(stepIndex);
    }
  }

  setCurrentStepByRoute(route: string): void {
    const stepIndex = this.steps.findIndex(step => 
      route.endsWith(`/${step.route}`) || route.includes(`/${step.route}?`)
    );
    if (stepIndex !== -1) {
      this.currentStepSubject.next(stepIndex);
    }
  }

  getStepRoute(index: number): string | null {
    return this.steps[index]?.route || null;
  }

  canGoNext(): boolean {
    // Add validation logic here based on current step
    // Could check CharacterStateService to validate completeness
    return this.currentStepSubject.value < this.steps.length - 1;
  }

  canGoPrevious(): boolean {
    return this.currentStepSubject.value > 0;
  }

  reset(): void {
    this.currentStepSubject.next(0);
  }
}
