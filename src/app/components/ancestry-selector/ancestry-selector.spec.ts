import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

// Initialize TestBed before anything else
const testBed = getTestBed();
try {
  testBed.initTestEnvironment(
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting(),
  );
} catch (e) {
  // Already initialized, that's fine
}

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AncestrySelector } from './ancestry-selector';
import { CharacterStateService } from '../../character/characterStateService';
import { StepValidationService } from '../../services/step-validation.service';
import { CharacterStorageService } from '../../services/character-storage.service';
import { AncestryApiService } from '../../services/ancestry-api.service';
import { CharacterIdentityService } from '../../services/character-identity.service';
import { Ancestry } from '../../character/ancestry/ancestry';
import { Character } from '../../character/character';

describe('AncestrySelector', () => {
  let component: AncestrySelector;
  let fixture: ComponentFixture<AncestrySelector>;
  let characterState: CharacterStateService;
  let validationService: StepValidationService;
  let storageService: any;
  let ancestryApiService: any;
  let identityService: any;
  let navigateSpy: any;

  beforeEach(async () => {
    storageService = {
      saveCharacter: vi.fn().mockReturnValue(of({ success: true, id: 'c1' }))
    };

    ancestryApiService = {
      getAncestry: vi.fn().mockReturnValue(of(Ancestry.SINGER)),
      saveAncestry: vi.fn().mockReturnValue(of(Ancestry.HUMAN))
    };

    const identityId$ = new BehaviorSubject<string | null>('char-123');
    const waiting$ = new BehaviorSubject<boolean>(false);
    identityService = {
      currentCharacterId$: identityId$.asObservable(),
      waitingForIdentity$: waiting$.asObservable(),
      getCurrentCharacterId: vi.fn().mockReturnValue('char-123'),
      setCurrentCharacterId: vi.fn(),
      newIdentity: vi.fn()
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
        { provide: AncestryApiService, useValue: ancestryApiService },
        { provide: CharacterIdentityService, useValue: identityService },
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
    (char as any).id = 'char-123';
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
    char.ancestry = Ancestry.HUMAN;
    characterState.updateCharacter(char);
    component.selectedAncestry = Ancestry.HUMAN;

    component.persistStep();
    expect(ancestryApiService.saveAncestry).toHaveBeenCalledTimes(1);
    expect(ancestryApiService.saveAncestry).toHaveBeenCalledWith('char-123', Ancestry.HUMAN);
  });

  it('should not persist when character has no id', () => {
    const char = new Character();
    characterState.updateCharacter(char);
    component.selectedAncestry = Ancestry.HUMAN;

    component.persistStep();
    expect(ancestryApiService.saveAncestry).not.toHaveBeenCalled();
  });

  it('should navigate to culture on navigateNext', () => {
    component.navigateNext();
    expect(navigateSpy).toHaveBeenCalledWith(['/character-creator-view/culture']);
  });
});
