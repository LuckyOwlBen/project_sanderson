import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { WebsocketService, LevelUpEvent } from './websocket.service';

describe('WebsocketService - Level Up', () => {
  let service: WebsocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WebsocketService]
    });
    service = TestBed.inject(WebsocketService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should have levelUp$ observable', () => {
    expect(service.levelUp$).toBeDefined();
  });

  it('should emit level-up event when received', () => {
    const mockEvent: LevelUpEvent = {
      characterId: 'test-char-123',
      newLevel: 5,
      grantedBy: 'GM',
      timestamp: new Date().toISOString()
    };

    let receivedEvent: LevelUpEvent | undefined;
    service.levelUp$.subscribe(event => {
      receivedEvent = event;
    });

    // Simulate the event being received
    (service as any).levelUpSubject.next(mockEvent);

    expect(receivedEvent).toEqual(mockEvent);
    expect(receivedEvent?.newLevel).toBe(5);
  });

  it('should have grantLevelUp method', () => {
    expect(service.grantLevelUp).toBeDefined();
    expect(typeof service.grantLevelUp).toBe('function');
  });
});
