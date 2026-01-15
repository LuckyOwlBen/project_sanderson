import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { WebsocketService, SprenGrantEvent, ExpertiseGrantEvent, ItemGrantEvent } from './websocket.service';

describe('WebsocketService - Grant Acknowledgments', () => {
  let service: WebsocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WebsocketService]
    });
    service = TestBed.inject(WebsocketService);
  });

  describe('Level Up Acknowledgment', () => {
    it('should have ackLevelUp method', () => {
      expect(service.ackLevelUp).toBeDefined();
      expect(typeof service.ackLevelUp).toBe('function');
    });

    it('should not throw when socket is not connected', () => {
      expect(() => {
        service.ackLevelUp('test-char-123', 5);
      }).not.toThrow();
    });
  });

  describe('Spren Grant', () => {
    it('should have sprenGrant$ observable', () => {
      expect(service.sprenGrant$).toBeDefined();
    });

    it('should emit spren grant event when received', () => {
      const mockEvent: SprenGrantEvent = {
        characterId: 'test-char-123',
        order: 'Windrunner',
        sprenType: 'Honorspren',
        surgePair: ['Adhesion', 'Gravitation'],
        philosophy: 'I will protect those who cannot protect themselves'
      };

      let receivedEvent: SprenGrantEvent | undefined;
      service.sprenGrant$.subscribe(event => {
        receivedEvent = event;
      });

      (service as any).sprenGrantSubject.next(mockEvent);

      expect(receivedEvent).toEqual(mockEvent);
      expect(receivedEvent?.order).toBe('Windrunner');
    });

    it('should have ackSprenGrant method', () => {
      expect(service.ackSprenGrant).toBeDefined();
      expect(typeof service.ackSprenGrant).toBe('function');
    });

    it('should not throw when acknowledging spren grant without connection', () => {
      expect(() => {
        service.ackSprenGrant('test-char-123', 'Windrunner');
      }).not.toThrow();
    });
  });

  describe('Expertise Grant', () => {
    it('should have expertiseGrant$ observable', () => {
      expect(service.expertiseGrant$).toBeDefined();
    });

    it('should emit expertise grant event when received', () => {
      const mockEvent: ExpertiseGrantEvent = {
        characterId: 'test-char-123',
        expertiseName: 'Alchemy',
        grantedBy: 'GM',
        timestamp: new Date().toISOString()
      };

      let receivedEvent: ExpertiseGrantEvent | undefined;
      service.expertiseGrant$.subscribe(event => {
        receivedEvent = event;
      });

      (service as any).expertiseGrantSubject.next(mockEvent);

      expect(receivedEvent).toEqual(mockEvent);
      expect(receivedEvent?.expertiseName).toBe('Alchemy');
    });

    it('should have ackExpertiseGrant method', () => {
      expect(service.ackExpertiseGrant).toBeDefined();
      expect(typeof service.ackExpertiseGrant).toBe('function');
    });

    it('should not throw when acknowledging expertise grant without connection', () => {
      expect(() => {
        service.ackExpertiseGrant('test-char-123', 'Alchemy');
      }).not.toThrow();
    });
  });

  describe('Item Grant', () => {
    it('should have itemGrant$ observable', () => {
      expect(service.itemGrant$).toBeDefined();
    });

    it('should emit item grant event when received', () => {
      const mockEvent: ItemGrantEvent = {
        characterId: 'test-char-123',
        itemId: 'iron-sword',
        quantity: 1,
        grantedBy: 'GM',
        timestamp: new Date().toISOString()
      };

      let receivedEvent: ItemGrantEvent | undefined;
      service.itemGrant$.subscribe(event => {
        receivedEvent = event;
      });

      (service as any).itemGrantSubject.next(mockEvent);

      expect(receivedEvent).toEqual(mockEvent);
      expect(receivedEvent?.itemId).toBe('iron-sword');
      expect(receivedEvent?.quantity).toBe(1);
    });

    it('should have ackItemGrant method', () => {
      expect(service.ackItemGrant).toBeDefined();
      expect(typeof service.ackItemGrant).toBe('function');
    });

    it('should not throw when acknowledging item grant without connection', () => {
      expect(() => {
        service.ackItemGrant('test-char-123', 'iron-sword', 1);
      }).not.toThrow();
    });
  });

  describe('Grant Methods', () => {
    it('should have grantSpren method', () => {
      expect(service.grantSpren).toBeDefined();
      expect(typeof service.grantSpren).toBe('function');
    });

    it('should have grantItem method', () => {
      expect(service.grantItem).toBeDefined();
      expect(typeof service.grantItem).toBe('function');
    });

    it('should have grantExpertise method', () => {
      expect(service.grantExpertise).toBeDefined();
      expect(typeof service.grantExpertise).toBe('function');
    });

    it('should have grantLevelUp method', () => {
      expect(service.grantLevelUp).toBeDefined();
      expect(typeof service.grantLevelUp).toBe('function');
    });
  });
});
