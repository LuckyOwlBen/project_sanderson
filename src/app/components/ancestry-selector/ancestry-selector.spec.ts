import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AncestrySelector } from './ancestry-selector';
import { CharacterStateService } from '../../character/characterStateService';
import { StepValidationService } from '../../services/step-validation.service';
import { CharacterStorageService } from '../../services/character-storage.service';
import { Ancestry } from '../../character/ancestry/ancestry';
import { Character } from '../../character/character';

describe('AncestrySelector', () => {
  let component: AncestrySelector;
  let fixture: ComponentFixture<AncestrySelector>;
  let characterState: CharacterStateService;
  let validationService: StepValidationService;
  let storageService: any;
  let navigateSpy: any;

  beforeEach(async () => {
    storageService = {
      saveCharacter: vi.fn().mockReturnValue(of({ success: true, id: 'c1' }))
    };

    const routerStub = {
      navigate: vi.fn()
    } as unknown as Router;

    await TestBed.configureTestingModule({
      imports: [AncestrySelector],
      providers: [
        CharacterStateService,
        StepValidationService,
        { provide: CharacterStorageService, useValue: storageService },
        { provide: Router, useValue: routerStub }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AncestrySelector);
    component = fixture.componentInstance;
    characterState = TestBed.inject(CharacterStateService);
    validationService = TestBed.inject(StepValidationService);
    navigateSpy = TestBed.inject(Router).navigate;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize selection from current character snapshot and mark valid', () => {
    const char = new Character();
    char.ancestry = Ancestry.SINGER;
    characterState.updateCharacter(char);

    component.ngOnInit();
    expect(component.selectedAncestry).toBe(Ancestry.SINGER);
    expect(validationService.isStepValid(0)).toBe(true);
  });

  it('should set ancestry and validation when selecting', () => {
    component.selectAncestry(Ancestry.HUMAN);
    expect(component.selectedAncestry).toBe(Ancestry.HUMAN);
    expect(validationService.isStepValid(0)).toBe(true);
  });

  it('should persist when character has an id', () => {
    const char = new Character();
    (char as any).id = 'char-123';
    characterState.updateCharacter(char);

    component.persistStep();
    expect(storageService.saveCharacter).toHaveBeenCalledTimes(1);
    expect(storageService.saveCharacter).toHaveBeenCalledWith(char);
  });

  it('should not persist when character has no id', () => {
    const char = new Character();
    characterState.updateCharacter(char);

    component.persistStep();
    expect(storageService.saveCharacter).not.toHaveBeenCalled();
  });

  it('should navigate to culture on navigateNext', () => {
    component.navigateNext();
    expect(navigateSpy).toHaveBeenCalledWith(['/character-creator-view/culture']);
  });
});
