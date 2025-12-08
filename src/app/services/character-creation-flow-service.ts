import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CharacterStateService } from '../character/characterStateService';

export interface CreationStep {
  label: string;
  route: string;
}

@Injectable({
  providedIn: 'root'
})
export class CharacterCreationFlowService {
  private readonly steps: CreationStep[] = [
    { label: 'Name', route: 'name' },
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

  constructor(private characterState: CharacterStateService) {}

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
    const currentStep = this.currentStepSubject.value;
    
    // Can't go past the last step
    if (currentStep >= this.steps.length - 1) {
      return false;
    }
    
    // Validate current step before allowing next
    let character: any = null;
    this.characterState.character$.subscribe(c => character = c).unsubscribe();
    
    if (!character) {
      return false;
    }
    
    switch (currentStep) {
      case 0: // Name step
        // Check both that name is valid AND that there's no input error
        return this.isNameValid(character.name) && !character.nameInputHasError;
      case 1: // Ancestry step
        return !!character.ancestry;
      default:
        // Other steps don't block progression
        return true;
    }
  }

  private isNameValid(name: string): boolean {
    if (!name || typeof name !== 'string') {
      return false;
    }
    
    const trimmedName = name.trim();
    
    // Check length requirements
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      return false;
    }
    
    // Check for valid characters only
    const validNamePattern = /^[a-zA-Z\s\-']+$/;
    if (!validNamePattern.test(trimmedName)) {
      return false;
    }
    
    // Check for excessive spaces
    if (/\s{2,}/.test(trimmedName)) {
      return false;
    }
    
    return true;
  }

  canGoPrevious(): boolean {
    return this.currentStepSubject.value > 0;
  }

  reset(): void {
    this.currentStepSubject.next(0);
  }
}
