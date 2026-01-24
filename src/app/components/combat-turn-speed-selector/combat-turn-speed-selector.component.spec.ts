import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CombatTurnSpeedSelectorComponent } from './combat-turn-speed-selector.component';
import { CombatService } from '../../services/combat.service';
import { WebsocketService } from '../../services/websocket.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('CombatTurnSpeedSelectorComponent', () => {
  let component: CombatTurnSpeedSelectorComponent;
  let fixture: ComponentFixture<CombatTurnSpeedSelectorComponent>;
  let combatService: CombatService;
  let websocketService: WebsocketService;

  beforeEach(async () => {
    const mockWebsocketService = {
      selectTurnSpeed: vi.fn(),
      combatStart$: { subscribe: vi.fn() }
    };

    await TestBed.configureTestingModule({
      imports: [CombatTurnSpeedSelectorComponent, CommonModule, MatButtonModule, MatCardModule],
      providers: [
        CombatService,
        {
          provide: WebsocketService,
          useValue: mockWebsocketService
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CombatTurnSpeedSelectorComponent);
    component = fixture.componentInstance;
    combatService = TestBed.inject(CombatService);
    websocketService = TestBed.inject(WebsocketService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be hidden when combat is not active', () => {
    component.characterId = 'player1';
    fixture.detectChanges();

    const element = fixture.nativeElement;
    const selector = element.querySelector('[data-testid="turn-speed-selector"]');

    expect(selector).toBeFalsy();
  });

  it('should display when combat is active', () => {
    component.characterId = 'player1';
    combatService.toggleCombat(true);
    fixture.detectChanges();

    const element = fixture.nativeElement;
    const selector = element.querySelector('[data-testid="turn-speed-selector"]');

    expect(selector).toBeTruthy();
  });

  it('should show fast and slow buttons', () => {
    component.characterId = 'player1';
    combatService.toggleCombat(true);
    fixture.detectChanges();

    const fastButton = fixture.nativeElement.querySelector('[data-testid="fast-button"]');
    const slowButton = fixture.nativeElement.querySelector('[data-testid="slow-button"]');

    expect(fastButton).toBeTruthy();
    expect(slowButton).toBeTruthy();
  });

  it('should highlight selected turn speed', () => {
    component.characterId = 'player1';
    combatService.toggleCombat(true);
    combatService.setTurnSpeed('player1', 'fast');
    fixture.detectChanges();

    const fastButton = fixture.nativeElement.querySelector('[data-testid="fast-button"]');
    expect(fastButton.classList.contains('mat-raised-button')).toBe(true);
  });

  it('should emit turn speed change only on actual change', () => {
    component.characterId = 'player1';
    combatService.toggleCombat(true);
    fixture.detectChanges();

    const fastButton = fixture.nativeElement.querySelector('[data-testid="fast-button"]');
    fastButton.click();
    fixture.detectChanges();

    expect(websocketService.selectTurnSpeed).toHaveBeenCalledWith('player1', 'fast');
    expect(websocketService.selectTurnSpeed).toHaveBeenCalledTimes(1);

    // Click again - should not emit
    fastButton.click();
    fixture.detectChanges();
    expect(websocketService.selectTurnSpeed).toHaveBeenCalledTimes(1);
  });

  it('should update selected speed when button is clicked', () => {
    component.characterId = 'player1';
    combatService.toggleCombat(true);
    fixture.detectChanges();

    const fastButton = fixture.nativeElement.querySelector('[data-testid="fast-button"]');
    fastButton.click();
    fixture.detectChanges();

    expect(combatService.getTurnSpeed('player1')).toBe('fast');
  });

  it('should display action count for selected speed', () => {
    component.characterId = 'player1';
    combatService.toggleCombat(true);
    combatService.setTurnSpeed('player1', 'fast');
    fixture.detectChanges();

    const speedInfo = fixture.nativeElement.querySelector('[data-testid="speed-info"]');
    expect(speedInfo.textContent).toContain('2 actions');
  });

  it('should display 3 actions for slow turn', () => {
    component.characterId = 'player1';
    combatService.toggleCombat(true);
    combatService.setTurnSpeed('player1', 'slow');
    fixture.detectChanges();

    const speedInfo = fixture.nativeElement.querySelector('[data-testid="speed-info"]');
    expect(speedInfo.textContent).toContain('3 actions');
  });
});
