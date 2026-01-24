import { TestBed } from '@angular/core/testing';
import { CombatService, TurnGroup, NPCCard } from './combat.service';
import { describe, it, expect, beforeEach } from 'vitest';

describe('CombatService', () => {
  let service: CombatService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CombatService]
    });
    service = TestBed.inject(CombatService);
  });

  describe('Combat Toggle', () => {
    it('should start with combat disabled', () => {
      expect(service.isCombatActive()).toBe(false);
    });

    it('should toggle combat active state', () => {
      service.toggleCombat(true);
      expect(service.isCombatActive()).toBe(true);

      service.toggleCombat(false);
      expect(service.isCombatActive()).toBe(false);
    });

    it('should emit combat state change on toggle', () => {
      return new Promise<void>(resolve => {
        service.combatActive$.subscribe(isActive => {
          if (isActive) {
            expect(isActive).toBe(true);
            resolve();
          }
        });
        service.toggleCombat(true);
      });
    });
  });

  describe('Turn Speed Selection', () => {
    it('should start with no turn speeds selected', () => {
      expect(service.getTurnSpeed('char123')).toBeNull();
    });

    it('should set turn speed for a character', () => {
      service.setTurnSpeed('char123', 'fast');
      expect(service.getTurnSpeed('char123')).toBe('fast');
    });

    it('should update turn speed when changed', () => {
      service.setTurnSpeed('char123', 'fast');
      service.setTurnSpeed('char123', 'slow');
      expect(service.getTurnSpeed('char123')).toBe('slow');
    });

    it('should emit turn speed change only when changed', () => {
      return new Promise<void>((resolve, reject) => {
        let emitCount = 0;
        service.turnSpeedChanged$.subscribe(event => {
          emitCount++;
          try {
            expect(event.characterId).toBe('char123');
            expect(event.turnSpeed).toBe('fast');
            expect(emitCount).toBe(1);
            resolve();
          } catch (err) {
            reject(err);
          }
        });

        // Set initial speed
        service.setTurnSpeed('char123', 'fast');

        // Set same speed again - should not emit
        setTimeout(() => {
          service.setTurnSpeed('char123', 'fast');
          if (emitCount === 1) resolve();
        }, 100);
      });
    });

    it('should clear turn speed for a character', () => {
      service.setTurnSpeed('char123', 'fast');
      service.clearTurnSpeed('char123');
      expect(service.getTurnSpeed('char123')).toBeNull();
    });
  });

  describe('NPC Card Management', () => {
    it('should start with no NPC cards', () => {
      expect(service.getNPCCards().length).toBe(0);
    });

    it('should add an NPC card', () => {
      service.addNPCCard('goblin1', 'Goblin Scout', 3);
      const cards = service.getNPCCards();

      expect(cards.length).toBe(1);
      expect(cards[0].id).toBe('goblin1');
      expect(cards[0].name).toBe('Goblin Scout');
      expect(cards[0].count).toBe(3);
    });

    it('should remove an NPC card', () => {
      service.addNPCCard('goblin1', 'Goblin Scout', 3);
      service.removeNPCCard('goblin1');

      expect(service.getNPCCards().length).toBe(0);
    });

    it('should update NPC card count', () => {
      service.addNPCCard('goblin1', 'Goblin Scout', 3);
      service.updateNPCCardCount('goblin1', 5);

      const card = service.getNPCCard('goblin1');
      expect(card?.count).toBe(5);
    });

    it('should set turn speed for NPC card', () => {
      service.addNPCCard('goblin1', 'Goblin Scout', 3);
      service.setNPCTurnSpeed('goblin1', 'fast');

      expect(service.getNPCTurnSpeed('goblin1')).toBe('fast');
    });

    it('should emit NPC card added event', () => {
      return new Promise<void>((resolve, reject) => {
        service.npcCardAdded$.subscribe(card => {
          try {
            expect(card.name).toBe('Goblin Scout');
            resolve();
          } catch (err) {
            reject(err);
          }
        });
        service.addNPCCard('goblin1', 'Goblin Scout', 3);
      });
    });

    it('should emit NPC card removed event', () => {
      return new Promise<void>((resolve, reject) => {
        service.addNPCCard('goblin1', 'Goblin Scout', 3);
        service.npcCardRemoved$.subscribe(id => {
          try {
            expect(id).toBe('goblin1');
            resolve();
          } catch (err) {
            reject(err);
          }
        });
        service.removeNPCCard('goblin1');
      });
    });

    it('should not allow duplicate NPC card IDs', () => {
      service.addNPCCard('goblin1', 'Goblin Scout', 3);
      expect(() => service.addNPCCard('goblin1', 'Another Goblin', 2)).toThrow();
    });
  });

  describe('Turn Groups', () => {
    it('should organize players into turn groups', () => {
      // Set up player turn speeds
      service.setTurnSpeed('player1', 'fast');
      service.setTurnSpeed('player2', 'slow');
      service.setTurnSpeed('player3', 'fast');

      // Get turn groups
      const groups = service.getTurnGroups();

      expect(groups.fastPC.length).toBe(2);
      expect(groups.slowPC.length).toBe(1);
    });

    it('should organize NPCs into turn groups', () => {
      service.addNPCCard('goblin1', 'Goblin Scout', 3);
      service.addNPCCard('orc1', 'Orc Warrior', 2);
      service.setNPCTurnSpeed('goblin1', 'fast');
      service.setNPCTurnSpeed('orc1', 'slow');

      const groups = service.getTurnGroups();

      expect(groups.fastNPC.length).toBe(1);
      expect(groups.slowNPC.length).toBe(1);
    });

    it('should show uninitialized players in separate group', () => {
      service.registerPlayer('player1');
      service.registerPlayer('player2');
      service.setTurnSpeed('player1', 'fast');
      // player2 has no speed set

      const groups = service.getTurnGroups();

      expect(groups.fastPC.length).toBe(1);
      expect(groups.uninitialized.length).toBe(1);
    });

    it('should return empty groups initially', () => {
      const groups = service.getTurnGroups();

      expect(groups.fastPC.length).toBe(0);
      expect(groups.fastNPC.length).toBe(0);
      expect(groups.slowPC.length).toBe(0);
      expect(groups.slowNPC.length).toBe(0);
    });
  });

  describe('Clear Combat State', () => {
    it('should clear all turn speeds and reset combat', () => {
      service.toggleCombat(true);
      service.setTurnSpeed('player1', 'fast');
      service.setTurnSpeed('player2', 'slow');
      service.addNPCCard('goblin1', 'Goblin Scout', 3);

      service.clearCombatState();

      expect(service.isCombatActive()).toBe(false);
      expect(service.getTurnSpeed('player1')).toBeNull();
      expect(service.getTurnSpeed('player2')).toBeNull();
      expect(service.getNPCCards().length).toBe(0);
    });
  });
});
