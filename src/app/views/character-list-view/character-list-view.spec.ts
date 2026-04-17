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
import { BehaviorSubject, of } from 'rxjs';
import { Router } from '@angular/router';

import { CharacterListView } from './character-list-view';
import { CharacterStorageService } from '../../services/character-storage.service';
import { CharacterStateService } from '../../character/characterStateService';
import { CharacterIdentityService } from '../../services/character-identity.service';

describe('CharacterListView', () => {
  let component: CharacterListView;
  let fixture: ComponentFixture<CharacterListView>;

  beforeEach(async () => {
    const storageService = {
      listCharacters: vi.fn().mockReturnValue(of([])),
      deleteCharacter: vi.fn().mockReturnValue(of({}))
    };

    const identityId$ = new BehaviorSubject<string | null>(null);
    const identityService = {
      currentCharacterId$: identityId$.asObservable(),
      setCurrentCharacterId: vi.fn(),
      newIdentity: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [CharacterListView],
      providers: [
        { provide: CharacterStorageService, useValue: storageService },
        { provide: CharacterStateService, useValue: {} },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: CharacterIdentityService, useValue: identityService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CharacterListView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
