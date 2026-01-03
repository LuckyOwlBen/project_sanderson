import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CreationProgressComponent } from './creation-progress';
import { CharacterCreationFlowService } from '../../services/character-creation-flow-service';
import { Character } from '../../character/character';
import { SkillType } from '../../character/skills/skillTypes';
import { BehaviorSubject } from 'rxjs';

describe('CreationProgressComponent', () => {
  let component: CreationProgressComponent;
  let mockRouter: any;
  let mockFlowService: any;
  let currentStepSubject: BehaviorSubject<number>;

  beforeEach(() => {
    currentStepSubject = new BehaviorSubject<number>(0);

    mockRouter = {
      navigate: vi.fn()
    };

    mockFlowService = {
      currentStep$: currentStepSubject.asObservable(),
      getCurrentStep: vi.fn(() => currentStepSubject.value)
    };

    TestBed.configureTestingModule({
      imports: [CreationProgressComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: CharacterCreationFlowService, useValue: mockFlowService }
      ]
    });

    const fixture = TestBed.createComponent(CreationProgressComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with 10 steps', () => {
    component.ngOnInit();
    expect(component.steps.length).toBe(10);
  });

  it('should have correct step routes', () => {
    component.ngOnInit();
    const routes = component.steps.map(s => s.route);
    expect(routes).toEqual([
      'ancestry', 'culture', 'name', 'attributes', 'skills', 
      'expertises', 'paths', 'talents', 'equipment', 'review'
    ]);
  });

  it('should update current step when flow service emits', () => {
    component.ngOnInit();
    expect(component.currentStepIndex).toBe(0);

    currentStepSubject.next(3);
    expect(component.currentStepIndex).toBe(3);
  });

  it('should navigate to step when navigateToStep is called', () => {
    component.ngOnInit();
    const step = component.steps[3];
    
    component.navigateToStep(step);
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/character-creator-view', 'attributes']);
  });

  it('should identify current step correctly', () => {
    component.ngOnInit();
    component.currentStepIndex = 2;

    expect(component.isCurrentStep(component.steps[2])).toBe(true);
    expect(component.isCurrentStep(component.steps[3])).toBe(false);
  });

  it('should update step completion status for ancestry', () => {
    component.ngOnInit();
    const character = new Character();
    character.name = 'Test';
    character.ancestry = 'human' as any;
    component.character = character;
    component['updateStepStatuses']();

    expect(component.steps[0].completed).toBe(true);
  });

  it('should update step completion status for culture', () => {
    component.ngOnInit();
    const character = new Character();
    character.name = 'Test';
    character.cultures = [{ name: 'Alethi', description: 'Test' }] as any;
    component.character = character;
    component['updateStepStatuses']();

    expect(component.steps[1].completed).toBe(true);
  });

  it('should update step completion status for name', () => {
    component.ngOnInit();
    const character = new Character();
    character.name = 'TestName';
    component.character = character;
    component['updateStepStatuses']();

    expect(component.steps[2].completed).toBe(true);
  });

  it('should update step completion status for attributes', () => {
    component.ngOnInit();
    const character = new Character();
    character.name = 'Test';
    character.attributes.strength = 5;
    component.character = character;
    component['updateStepStatuses']();

    expect(component.steps[3].completed).toBe(true);
  });

  it('should update step completion status for skills', () => {
    component.ngOnInit();
    const character = new Character();
    character.name = 'Test';
    character.skills.setSkillRank(SkillType.ATHLETICS, 2);
    component.character = character;
    component['updateStepStatuses']();

    expect(component.steps[4].completed).toBe(true);
  });

  it('should update step pending status', () => {
    component.ngOnInit();

    component.updateStepPending(3, true);
    expect(component.steps[3].hasPending).toBe(true);

    component.updateStepPending(3, false);
    expect(component.steps[3].hasPending).toBe(false);
  });

  it('should handle display mode navigation-grid', () => {
    component.displayMode = 'navigation-grid';
    expect(component.displayMode).toBe('navigation-grid');
  });

  it('should handle display mode inline-progress', () => {
    component.displayMode = 'inline-progress';
    expect(component.displayMode).toBe('inline-progress');
  });

  it('should handle level-up mode', () => {
    component.isLevelUpMode = true;
    expect(component.isLevelUpMode).toBe(true);
  });

  it('should clean up subscriptions on destroy', () => {
    component.ngOnInit();
    const destroySpy = vi.spyOn(component['destroy$'], 'next');
    const completeSpy = vi.spyOn(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });
});
