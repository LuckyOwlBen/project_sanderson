import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface StepValidation {
  stepIndex: number;
  isValid: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StepValidationService {
  private validationState = new Map<number, boolean>();
  private validationSubject = new BehaviorSubject<Map<number, boolean>>(new Map());
  
  public validation$: Observable<Map<number, boolean>> = this.validationSubject.asObservable();

  setStepValid(stepIndex: number, isValid: boolean): void {
    this.validationState.set(stepIndex, isValid);
    this.validationSubject.next(new Map(this.validationState));
  }

  isStepValid(stepIndex: number): boolean {
    return this.validationState.get(stepIndex) ?? false;
  }

  clearStep(stepIndex: number): void {
    this.validationState.delete(stepIndex);
    this.validationSubject.next(new Map(this.validationState));
  }

  reset(): void {
    this.validationState.clear();
    this.validationSubject.next(new Map());
  }
}
