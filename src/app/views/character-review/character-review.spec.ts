import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CharacterReview } from './character-review';
import { CharacterStateService } from '../../character/characterStateService';
import { CharacterStorageService } from '../../services/character-storage.service';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule } from '@angular/material/dialog';
import { of, BehaviorSubject } from 'rxjs';
import { Character } from '../../character/character';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('CharacterReview', () => {
  let component: CharacterReview;
  let fixture: ComponentFixture<CharacterReview>;
  let mockCharacterState: any;
  let mockCharacterStorage: any;
  let mockRouter: any;
  let mockDialog: any;
  let activatedRouteSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    // Create mock character
    const mockCharacter = new Character();
    (mockCharacter as any).id = 'test-character-id';
    mockCharacter.name = 'Test Character';

    // Create mock services using vitest
    mockCharacterState = {
      getCharacter: vi.fn(() => mockCharacter),
      updateCharacter: vi.fn()
    };

    mockCharacterStorage = {
      loadCharacter: vi.fn(() => of(mockCharacter)),
      saveCharacter: vi.fn(() => of({ success: true, id: 'test-character-id' }))
    };

    mockRouter = {
      navigate: vi.fn()
    };

    mockDialog = {
      open: vi.fn()
    };

    activatedRouteSubject = new BehaviorSubject({});

    await TestBed.configureTestingModule({
      imports: [
        CharacterReview,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        MatDialogModule
      ],
      providers: [
        { provide: CharacterStateService, useValue: mockCharacterState },
        { provide: CharacterStorageService, useValue: mockCharacterStorage },
        { provide: Router, useValue: mockRouter },
        { provide: MatDialog, useValue: mockDialog },
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

  it('should load character from API on init', () => {
    fixture.detectChanges();

    expect(mockCharacterStorage.loadCharacter).toHaveBeenCalledWith('test-character-id');
    expect(component.character).toBeTruthy();
    expect(component.character?.name).toBe('Test Character');
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

    expect(mockCharacterStorage.saveCharacter).toHaveBeenCalledWith(component.character);
    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['/character-sheet', 'test-character-id'],
      expect.objectContaining({
        queryParams: { created: 'true' }
      })
    );
  });

  it('should handle finalization error gracefully', async () => {
    mockCharacterStorage.saveCharacter.mockReturnValue(
      of({ success: false, id: '' })
    );

    fixture.detectChanges();
    component.finalizeCharacter();

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(component.characterLoadError).toContain('Failed to finalize');
  });

  it('should sync to local state if no character ID in route params', () => {
    mockCharacterState.getCharacter.mockReturnValue(
      new Character() // Default empty character
    );

    fixture.detectChanges();

    expect(component.character).toBeTruthy();
  });
});
