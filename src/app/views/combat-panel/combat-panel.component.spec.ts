import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CombatPanelComponent } from './combat-panel.component';
import { CombatService } from '../../services/combat.service';
import { WebsocketService } from '../../services/websocket.service';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('CombatPanelComponent', () => {
  let component: CombatPanelComponent;
  let fixture: ComponentFixture<CombatPanelComponent>;
  let combatService: CombatService;
  let matDialog: MatDialog;

  beforeEach(async () => {
    const mockDialog = {
      open: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [
        CombatPanelComponent,
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatDividerModule,
        MatSlideToggleModule,
        MatInputModule,
        FormsModule
      ],
      providers: [
        CombatService,
        WebsocketService,
        {
          provide: MatDialog,
          useValue: mockDialog
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CombatPanelComponent);
    component = fixture.componentInstance;
    combatService = TestBed.inject(CombatService);
    matDialog = TestBed.inject(MatDialog);

    // Trigger component lifecycle (ngOnInit subscription to combatActive$)
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Combat Toggle', () => {
    it('should toggle combat on', () => {
      component.toggleCombat(true);
      expect(component.isCombatActive).toBe(true);
      expect(combatService.isCombatActive()).toBe(true);
    });

    it('should toggle combat off', () => {
      component.toggleCombat(true);
      component.toggleCombat(false);
      expect(component.isCombatActive).toBe(false);
    });

    it('should clear combat state when turning off', () => {
      combatService.setTurnSpeed('player1', 'fast');
      combatService.addNPCCard('goblin1', 'Goblin', 3);

      component.toggleCombat(true);
      component.toggleCombat(false);

      expect(combatService.getNPCCards().length).toBe(0);
    });
  });

  describe('NPC Card Management', () => {
    it('should add NPC card', () => {
      component.npcName = 'Goblin Scout';
      component.npcCount = 3;

      component.addNPCCard();

      const cards = combatService.getNPCCards();
      expect(cards.length).toBe(1);
      expect(cards[0].name).toBe('Goblin Scout');
      expect(cards[0].count).toBe(3);
    });

    it('should clear NPC form after adding', () => {
      component.npcName = 'Goblin Scout';
      component.npcCount = 3;

      component.addNPCCard();

      expect(component.npcName).toBe('');
      expect(component.npcCount).toBe(1);
    });

    it('should not add NPC without name', () => {
      component.npcName = '';
      component.npcCount = 3;

      expect(() => component.addNPCCard()).toThrow();
    });

    it('should remove NPC card', () => {
      combatService.addNPCCard('goblin1', 'Goblin', 3);

      component.removeNPCCard('goblin1');

      expect(combatService.getNPCCards().length).toBe(0);
    });

    it('should update NPC card count', () => {
      combatService.addNPCCard('goblin1', 'Goblin', 3);

      component.updateNPCCardCount('goblin1', 5);

      const card = combatService.getNPCCard('goblin1');
      expect(card?.count).toBe(5);
    });
  });

  describe('Turn Groups Display', () => {
    it('should organize and display turn groups', () => {
      combatService.setTurnSpeed('player1', 'fast');
      combatService.setTurnSpeed('player2', 'slow');
      combatService.addNPCCard('goblin1', 'Goblin', 3);
      combatService.setNPCTurnSpeed('goblin1', 'fast');

      const groups = component.getTurnGroups();

      expect(groups.fastPC.length).toBe(1);
      expect(groups.slowPC.length).toBe(1);
      expect(groups.fastNPC.length).toBe(1);
    });

    it('should filter uninitialized players', () => {
      component.registerPlayer('player1');
      component.registerPlayer('player2');
      combatService.setTurnSpeed('player1', 'fast');

      const groups = component.getTurnGroups();

      expect(groups.uninitialized.length).toBe(1);
    });
  });

  describe('Turn Speed Assignment for NPCs', () => {
    it('should set NPC turn speed', () => {
      combatService.addNPCCard('goblin1', 'Goblin', 3);

      component.setNPCTurnSpeed('goblin1', 'fast');

      expect(combatService.getNPCTurnSpeed('goblin1')).toBe('fast');
    });

    it('should toggle NPC turn speed', () => {
      combatService.addNPCCard('goblin1', 'Goblin', 3);

      component.setNPCTurnSpeed('goblin1', 'fast');
      expect(combatService.getNPCTurnSpeed('goblin1')).toBe('fast');

      component.setNPCTurnSpeed('goblin1', 'slow');
      expect(combatService.getNPCTurnSpeed('goblin1')).toBe('slow');
    });
  });
});
