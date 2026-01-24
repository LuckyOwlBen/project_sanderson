import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CharacterSheetView } from './character-sheet-view';
import { CharacterStorageService } from '../../services/character-storage.service';
import { CharacterStateService } from '../../character/characterStateService';
import { WebsocketService } from '../../services/websocket.service';
import { CombatService } from '../../services/combat.service';
import { Character } from '../../character/character';

describe('CharacterSheetView - No character$ Subscription', () => {
  let component: CharacterSheetView;
  let fixture: ComponentFixture<CharacterSheetView>;
  let characterStorageService: any;
  let characterStateService: CharacterStateService;
  let paramsSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    const testCharacter = new Character();
    testCharacter.id = 'char-123';
    testCharacter.name = 'Test Hero';

    characterStorageService = {
      loadCharacter: vi.fn().mockReturnValue(of(testCharacter)),
      saveCharacter: vi.fn().mockReturnValue(of({}))
    };

    const websocketServiceMock = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      connected$: of(false),
      isConnected: vi.fn().mockReturnValue(false),
      emitPlayerJoin: vi.fn(),
      emitPlayerLeave: vi.fn(),
      ackItemGrant: vi.fn(),
      ackSprenGrant: vi.fn(),
      ackExpertiseGrant: vi.fn(),
      ackLevelUp: vi.fn(),
      itemGrant$: of(null),
      expertiseGrant$: of(null),
      sprenGrant$: of(null),
      levelUp$: of(null),
      highstorm$: of({ active: false }),
      combatStart$: new Subject<any>()
    };

    paramsSubject = new BehaviorSubject({ id: 'char-123' });

    await TestBed.configureTestingModule({
      imports: [CharacterSheetView],
      providers: [
        CharacterStateService,
        CombatService,
        { provide: CharacterStorageService, useValue: characterStorageService },
        { provide: WebsocketService, useValue: websocketServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            params: paramsSubject.asObservable(),
            snapshot: { params: { id: 'char-123' } }
          }
        }
      ]
    }).compileComponents();

    characterStateService = TestBed.inject(CharacterStateService);
    fixture = TestBed.createComponent(CharacterSheetView);
    component = fixture.componentInstance;
  });

  it('should load character from route params without subscribing to character$', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    // Should load character from storage
    expect(characterStorageService.loadCharacter).toHaveBeenCalledWith('char-123');
    expect(component.character).toBeTruthy();
    expect(component.character?.name).toBe('Test Hero');
  });

  it('should not react to character$ emissions after initial load', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const initialCharacter = component.character;
    expect(initialCharacter).toBeTruthy();

    // Emit a different character via character$
    const updatedCharacter = new Character();
    updatedCharacter.id = 'different-char';
    updatedCharacter.name = 'Different Hero';
    characterStateService.updateCharacter(updatedCharacter);
    await fixture.whenStable();

    // Component should still have the original character from route params
    expect(component.character).toBe(initialCharacter);
    expect(component.character?.id).toBe('char-123');
  });

  it('should reload character when route params change', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.character?.id).toBe('char-123');

    // Change route params to different character
    const newCharacter = new Character();
    newCharacter.id = 'char-456';
    newCharacter.name = 'New Hero';
    characterStorageService.loadCharacter.mockReturnValue(of(newCharacter));

    paramsSubject.next({ id: 'char-456' });
    await fixture.whenStable();

    // Should have loaded the new character
    expect(characterStorageService.loadCharacter).toHaveBeenCalledWith('char-456');
    expect(component.character?.id).toBe('char-456');
    expect(component.character?.name).toBe('New Hero');
  });
});
