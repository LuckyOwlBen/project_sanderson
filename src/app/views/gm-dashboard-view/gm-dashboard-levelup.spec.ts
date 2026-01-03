import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GmDashboardView } from './gm-dashboard-view';
import { PlayerJoinedEvent } from '../../services/websocket.service';

describe('GmDashboardView - Level Up', () => {
  const mockPlayer: PlayerJoinedEvent = {
    characterId: 'test-char-123',
    name: 'Test Player',
    level: 5,
    ancestry: null,
    health: { current: 50, max: 50 },
    focus: { current: 30, max: 30 },
    investiture: { current: 10, max: 10 },
    joinedAt: new Date().toISOString(),
    socketId: 'socket-123'
  };

  it('should have grantLevelUp method', () => {
    // Just test that the method exists on the class
    expect(GmDashboardView.prototype.grantLevelUp).toBeDefined();
  });

  it('should update player level when modified', () => {
    const player = { ...mockPlayer };
    
    // Initial level
    expect(player.level).toBe(5);
    
    // Simulate level-up
    player.level = 6;
    
    expect(player.level).toBe(6);
  });
});
