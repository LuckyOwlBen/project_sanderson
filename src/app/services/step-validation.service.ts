import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Character } from '../character/character';

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

  // Validate all steps based on character state
  validateAllSteps(character: Character): void {
    this.validateAncestry(character);
    this.validateCulture(character);
    this.validateName(character);
    this.validateAttributes(character);
    this.validateSkills(character);
    this.validatePath(character);
    this.validateTalents(character);
    this.validateReview(character);
  }

  private validateAncestry(character: Character): void {
    const isValid = !!character.ancestry;
    this.setStepValid(0, isValid);
  }

  private validateCulture(character: Character): void {
    const isValid = character.cultures && character.cultures.length > 0;
    this.setStepValid(1, isValid);
  }

  private validateName(character: Character): void {
    const isValid = !!character.name && character.name.trim().length >= 2;
    this.setStepValid(2, isValid);
  }

  private validateAttributes(character: Character): void {
    if (!character.attributes) {
      this.setStepValid(3, false);
      return;
    }
    
    // Check if all points are allocated
    const attrs = character.attributes;
    const totalAllocated = attrs.strength + attrs.speed + attrs.intellect + 
                          attrs.willpower + attrs.awareness + attrs.presence;
    const baseTotal = 18; // 6 attributes * 3 base
    const level = character.level || 1;
    const pointsToAllocate = 12; // At level 1
    const expectedTotal = baseTotal + pointsToAllocate;
    
    const isValid = totalAllocated === expectedTotal;
    this.setStepValid(3, isValid);
  }

  private validateSkills(character: Character): void {
    if (!character.skills) {
      this.setStepValid(4, false);
      return;
    }
    
    // Check if all skill points are allocated
    const level = character.level || 1;
    const totalPoints = 8 + (level * 2); // Base 8 + 2 per level
    
    let allocatedPoints = 0;
    const skillRanks = character.skills.getAllSkillRanks();
    Object.values(skillRanks).forEach((rank: any) => {
      allocatedPoints += rank;
    });
    
    const isValid = allocatedPoints === totalPoints;
    this.setStepValid(4, isValid);
  }

  private validatePath(character: Character): void {
    const isValid = character.paths && character.paths.length > 0;
    this.setStepValid(5, isValid);
  }

  private validateTalents(character: Character): void {
    if (!character.unlockedTalents) {
      this.setStepValid(6, false);
      return;
    }

    // Count tier 1+ talents (talents that cost points)
    let paidTalentCount = 0;
    // We need to check the actual talent tiers, but for now approximate
    // Assume Change Form is tier 0, so count total - 1 for singers
    paidTalentCount = character.unlockedTalents.size;
    
    // At level 1, require based on ancestry
    let requiredTalents = character.level || 1;
    if (character.ancestry === 'singer' || character.ancestry === 'human') {
      requiredTalents += 1;
    }
    
    const isValid = paidTalentCount >= requiredTalents;
    this.setStepValid(6, isValid);
  }

  private validateReview(character: Character): void {
    // Review is always valid if you can get there
    this.setStepValid(7, true);
  }
}
