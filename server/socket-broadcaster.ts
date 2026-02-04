import { Server as SocketIOServer } from 'socket.io';

/**
 * Queued update for offline players
 */
interface QueuedUpdate {
  characterId: string;
  timestamp: string;
}

/**
 * Configuration for the broadcaster
 */
interface BroadcasterConfig {
  debounceMs: number;
  queueExpirationMs: number;
  maxQueueSizePerCharacter: number;
}

/**
 * Default configuration:
 * - 3 second debounce (matches resource updates)
 * - 1 hour expiration (3600000ms)
 * - Max 50 queued updates per character
 */
const DEFAULT_CONFIG: BroadcasterConfig = {
  debounceMs: 3000,
  queueExpirationMs: 3600000, // 1 hour
  maxQueueSizePerCharacter: 50
};

/**
 * SocketBroadcaster manages character update events with debouncing and queuing.
 * 
 * Features:
 * - Per-socket debouncing to prevent update spam
 * - Deduplication - only one queued update per character
 * - Timestamp-based expiration for queued updates
 * - Size limits to prevent memory growth
 * - Targets only player sockets (not GM)
 */
export class SocketBroadcaster {
  private io: SocketIOServer;
  private config: BroadcasterConfig;
  
  // Map of socketId -> characterId -> timer for debouncing
  private debounceTimers: Map<string, Map<string, NodeJS.Timeout>>;
  
  // Map of characterId -> QueuedUpdate for offline players (deduplicated)
  private pendingUpdates: Map<string, QueuedUpdate>;
  
  // Reference to activePlayers Map from server
  private activePlayers: Map<string, any>;

  constructor(
    io: SocketIOServer,
    activePlayers: Map<string, any>,
    config: Partial<BroadcasterConfig> = {}
  ) {
    this.io = io;
    this.activePlayers = activePlayers;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.debounceTimers = new Map();
    this.pendingUpdates = new Map();
    
    console.log('[SocketBroadcaster] Initialized with config:', this.config);
  }

  /**
   * Schedule a character update broadcast with debouncing.
   * 
   * If the player is online, debounces and emits to their socket.
   * If the player is offline, queues the update (deduplicated by characterId).
   * 
   * @param characterId The character that was updated
   */
  scheduleCharacterUpdate(characterId: string): void {
    // Find the socket for this character
    const socketId = this.findSocketByCharacterId(characterId);
    
    if (socketId) {
      // Player is online - debounce and emit
      this.debounceAndEmit(socketId, characterId);
    } else {
      // Player is offline - queue the update (deduplicated)
      this.queueUpdate(characterId);
    }
  }

  /**
   * Deliver any pending updates to a reconnecting player.
   * Called from the player-join WebSocket handler.
   * 
   * @param socketId The socket that just connected
   * @param characterId The character that joined
   */
  deliverPendingUpdates(socketId: string, characterId: string): void {
    const queued = this.pendingUpdates.get(characterId);
    
    if (!queued) {
      return; // No pending updates
    }
    
    // Check if update has expired
    const age = Date.now() - new Date(queued.timestamp).getTime();
    if (age > this.config.queueExpirationMs) {
      console.log(`[SocketBroadcaster] Discarding expired update for ${characterId} (age: ${Math.round(age / 1000)}s)`);
      this.pendingUpdates.delete(characterId);
      return;
    }
    
    // Deliver the update
    console.log(`[SocketBroadcaster] Delivering queued update to ${characterId}`);
    this.emitToSocket(socketId, characterId);
    
    // Remove from queue after delivery
    this.pendingUpdates.delete(characterId);
  }

  /**
   * Clean up expired queued updates.
   * Should be called periodically (e.g., every 5 minutes).
   */
  cleanupExpiredUpdates(): void {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [characterId, update] of this.pendingUpdates.entries()) {
      const age = now - new Date(update.timestamp).getTime();
      if (age > this.config.queueExpirationMs) {
        this.pendingUpdates.delete(characterId);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`[SocketBroadcaster] Cleaned up ${removedCount} expired updates`);
    }
  }

  /**
   * Get statistics about queued updates (for monitoring/debugging).
   */
  getStats(): { queueSize: number; activeTimers: number } {
    let timerCount = 0;
    for (const socketTimers of this.debounceTimers.values()) {
      timerCount += socketTimers.size;
    }
    
    return {
      queueSize: this.pendingUpdates.size,
      activeTimers: timerCount
    };
  }

  /**
   * Find the socket ID for a given character ID by searching activePlayers.
   * Returns null if the character is not currently connected.
   */
  private findSocketByCharacterId(characterId: string): string | null {
    for (const [socketId, player] of this.activePlayers.entries()) {
      if (player.characterId === characterId) {
        return socketId;
      }
    }
    return null;
  }

  /**
   * Debounce and emit an update to a specific socket.
   * Clears any existing timer for this socket+character combination.
   */
  private debounceAndEmit(socketId: string, characterId: string): void {
    // Get or create timer map for this socket
    let socketTimers = this.debounceTimers.get(socketId);
    if (!socketTimers) {
      socketTimers = new Map();
      this.debounceTimers.set(socketId, socketTimers);
    }
    
    // Clear existing timer for this character (if any)
    const existingTimer = socketTimers.get(characterId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Set new timer
    const timer = setTimeout(() => {
      this.emitToSocket(socketId, characterId);
      
      // Clean up timer reference
      socketTimers!.delete(characterId);
      if (socketTimers!.size === 0) {
        this.debounceTimers.delete(socketId);
      }
    }, this.config.debounceMs);
    
    socketTimers.set(characterId, timer);
  }

  /**
   * Emit the character-updated event to a specific socket.
   */
  private emitToSocket(socketId: string, characterId: string): void {
    console.log(`[SocketBroadcaster] Emitting character-updated to socket ${socketId} for character ${characterId}`);
    
    this.io.to(socketId).emit('character-updated', {
      characterId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Queue an update for an offline player (deduplicated by characterId).
   * Only stores the most recent update timestamp per character.
   */
  private queueUpdate(characterId: string): void {
    // Check if we're at the queue size limit
    if (!this.pendingUpdates.has(characterId) && 
        this.pendingUpdates.size >= this.config.maxQueueSizePerCharacter * 10) {
      console.warn(`[SocketBroadcaster] Queue is full (${this.pendingUpdates.size} updates), discarding update for ${characterId}`);
      return;
    }
    
    const update: QueuedUpdate = {
      characterId,
      timestamp: new Date().toISOString()
    };
    
    // Deduplicate - always keep the latest update
    const existing = this.pendingUpdates.get(characterId);
    if (existing) {
      console.log(`[SocketBroadcaster] Updating queued timestamp for ${characterId}`);
    } else {
      console.log(`[SocketBroadcaster] Queuing update for offline character ${characterId}`);
    }
    
    this.pendingUpdates.set(characterId, update);
  }

  /**
   * Clean up timers for a disconnecting socket.
   * Should be called when a socket disconnects.
   */
  cleanupSocket(socketId: string): void {
    const socketTimers = this.debounceTimers.get(socketId);
    if (socketTimers) {
      // Clear all timers for this socket
      for (const timer of socketTimers.values()) {
        clearTimeout(timer);
      }
      this.debounceTimers.delete(socketId);
    }
  }
}
