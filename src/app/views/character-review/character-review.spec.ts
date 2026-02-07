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
import { CharacterReview } from './character-review';
import { CharacterIdentityService } from '../../services/character-identity.service';
import { FinalizeApiService, CompleteCharacterView } from '../../services/finalize-api.service';
import { NavFinalizedService } from '../../services/nav-finalized.service';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { of, BehaviorSubject } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('CharacterReview', () => {
  let component: CharacterReview;
  let fixture: ComponentFixture<CharacterReview>;
  let mockIdentityService: any;
  let mockFinalizeApi: any;
  let mockNavFinalized: any;
  let mockRouter: any;
  let activatedRouteSubject: BehaviorSubject<any>;
  let identityServiceSubject: BehaviorSubject<string | null>;

  beforeEach(async () => {
    // Create mock character view
    const mockCompleteCharacter: CompleteCharacterView = {
      id: 'test-character-id',
      name: 'Test Character',
      level: 1,
      ancestry: 'Human',
      cultures: ['test-culture'],
      paths: {
        main: 'Radiant',
        specialization: 'Windrunner'
      },
      attributes: {
        strength: 10,
        speed: 10,
        intellect: 10,
        willpower: 10,
        awareness: 10,
        presence: 10
      },
      skills: {
        total: 5,
        allocated: 5
      },
      talents: {
        total: 2,
        selected: ['talent1', 'talent2']
      },
      expertises: {
        total: 1,
        selected: ['expertise1']
      }
    };

    identityServiceSubject = new BehaviorSubject<string | null>('test-character-id');

    mockIdentityService = {
      getCurrentCharacterId: vi.fn(() => 'test-character-id'),
      setCurrentCharacterId: vi.fn(),
      clearCurrentCharacterId: vi.fn(),
      currentCharacterId$: identityServiceSubject.asObservable(),
      waitingForIdentity$: of(false)
    };

    mockFinalizeApi = {
      getCompleteCharacter: vi.fn(() => of(mockCompleteCharacter)),
      finalizeCharacter: vi.fn(() => of(true))
    };

    mockNavFinalized = {
      loadNavFinalized: vi.fn(() => of({}))
    };

    mockRouter = {
      navigate: vi.fn()
    };

    activatedRouteSubject = new BehaviorSubject({});

    await TestBed.configureTestingModule({
      imports: [
        CharacterReview,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        MatProgressSpinnerModule
      ],
      providers: [
        { provide: CharacterIdentityService, useValue: mockIdentityService },
        { provide: FinalizeApiService, useValue: mockFinalizeApi },
        { provide: NavFinalizedService, useValue: mockNavFinalized },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: activatedRouteSubject.asObservable()
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CharacterReview);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load complete character from API on init using synchronously available ID', () => {
    fixture.detectChanges();

    expect(mockFinalizeApi.getCompleteCharacter).toHaveBeenCalledWith('test-character-id');
    expect(component.completeCharacter).toBeTruthy();
    expect(component.completeCharacter?.name).toBe('Test Character');
  });

  it('should set level-up mode based on query params', () => {
    activatedRouteSubject.next({ levelUp: 'true' });
    fixture.detectChanges();

    expect(component.isLevelUpMode).toBe(true);
  });

  it('should finalize character and navigate to character-sheet on success', async () => {
    fixture.detectChanges();

    component.finalizeCharacter();

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockFinalizeApi.finalizeCharacter).toHaveBeenCalledWith('test-character-id');
    expect(mockNavFinalized.loadNavFinalized).toHaveBeenCalledWith('test-character-id');
    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['/character-sheet', 'test-character-id'],
      expect.objectContaining({
        queryParams: { created: 'true' }
      })
    );
  });

  it('should handle finalization error gracefully', async () => {
    mockFinalizeApi.finalizeCharacter.mockReturnValue(of(false));

    fixture.detectChanges();
    component.finalizeCharacter();

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(component.characterLoadError).toContain('Failed to finalize');
  });

  it('should load asynchronously arriving character ID', async () => {
    // Start with no ID synchronously
    mockIdentityService.getCurrentCharacterId.mockReturnValueOnce(null);
    mockIdentityService.getCurrentCharacterId.mockReturnValueOnce('test-character-id');

    fixture.detectChanges();

    // Simulate ID arriving asynchronously
    identityServiceSubject.next('test-character-id');

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockFinalizeApi.getCompleteCharacter).toHaveBeenCalledWith('test-character-id');
    expect(component.completeCharacter).toBeTruthy();
  });
});
