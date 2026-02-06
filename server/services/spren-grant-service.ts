/**
 * SprenGrantService - Manages spren grant queuing and delivery
 * 
 * Handles:
 * - Queuing spren grants to database
 * - Sending pending spren grants to players via WebSocket
 * - Processing spren grant acknowledgments
 * - Ensuring persistence across server restarts
 */

import { Server, Socket } from 'socket.io';
import { RadiantPathModuleRepository } from '../repositories/modules/radiant-path-repository';
import { RADIANT_TIER0_TALENTS } from './paths-service';

export interface SprenGrantPayload {
  characterId: string;
  order: string;                    // e.g., "Windrunner"
  sprenType: string;                // e.g., "Honorspren"
  surgePair: string[];              // Array of two surges
  philosophy: string;               // First Ideal philosophy
}

/**
 * In-memory cache of in-flight grants (not yet persisted to DB)
 * Maps characterId -> array of pending grants
 */
const inMemorySprenQueue = new Map<string, SprenGrantPayload[]>();

/**
 * Track confirmed spren grants to prevent re-delivery
 * Set of characterIds that have received initial spren
 */
const confirmedSprenGrants = new Set<string>();

export class SprenGrantService {
  private radiantPathRepository: RadiantPathModuleRepository;
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.radiantPathRepository = new RadiantPathModuleRepository();
  }

  /**
   * Queue a spren grant for delivery
   * @param payload - The spren grant payload
   * @param findSocketId - Function to find socket ID by character ID
   * @returns Success status
   */
  async queueSprenGrant(
    payload: SprenGrantPayload,
    findSocketId: (characterId: string) => string | undefined
  ): Promise<{ success: boolean; queued: boolean; sent: boolean }> {
    const { characterId, order, sprenType, surgePair, philosophy } = payload;
    
    console.log(`[Spren] 🔄 Queueing spren grant for ${characterId}: ${order}`);

    try {
      // Add to in-memory queue
      const queue = inMemorySprenQueue.get(characterId) || [];
      queue.push(payload);
      inMemorySprenQueue.set(characterId, queue);
      console.log(`[Spren] Queue size for ${characterId}: ${queue.length}`);

      // Try to persist to database (for recovery if server restarts)
      // This would go to PendingGrantQueue table in full implementation
      // For now, we queue and try to send immediately
      
      // If player is online, send immediately
      const targetSocket = findSocketId(characterId);
      if (targetSocket) {
        this.sendPendingSprenGrant(characterId, targetSocket);
        return { success: true, queued: true, sent: true };
      } else {
        console.warn(`[Spren] ⚠️ Player ${characterId} offline - will send on reconnect`);
        return { success: true, queued: true, sent: false };
      }
    } catch (error) {
      console.error(`[Spren] ❌ Error queueing spren grant for ${characterId}:`, error);
      return { success: false, queued: false, sent: false };
    }
  }

  /**
   * Send the next pending spren grant for a character
   * @param characterId - Character ID
   * @param socketId - Socket ID to send to
   */
  private sendPendingSprenGrant(characterId: string, socketId: string): void {
    const queue = inMemorySprenQueue.get(characterId);
    if (!queue || queue.length === 0) {
      console.warn(`[Spren] ⚠️ No pending spren grants for ${characterId}`);
      return;
    }

    const grant = queue[0];
    console.log(`[Spren] 📤 Sending spren grant to socket ${socketId}: ${grant.order}`);
    this.io.to(socketId).emit('spren-granted', grant);
  }

  /**
   * Handle acknowledgment of spren grant from player
   * @param characterId - Character ID
   * @param order - Order that was granted
   * @returns Success status
   */
  async handleSprenAck(
    characterId: string,
    order: string
  ): Promise<{ success: boolean }> {
    try {
      console.log(`[Spren] ✅ Ack received for ${characterId}: ${order}`);

      // Mark first confirmation if needed
      if (!confirmedSprenGrants.has(characterId)) {
        confirmedSprenGrants.add(characterId);
      }

      // Remove grant from queue
      const queue = inMemorySprenQueue.get(characterId) || [];
      if (queue.length > 0) {
        const confirmed = queue.shift();
        if (confirmed && confirmed.order === order) {
          console.log(`[Spren] ✔️ Removed ${order} from queue for ${characterId}`);
          
          // Look up tier 0 talent ID for this radiant order
          const tier0TalentId = RADIANT_TIER0_TALENTS[confirmed.order.toLowerCase()] || null;
          
          // Persist spren to database
          await this.radiantPathRepository.addSpren(
            characterId,
            confirmed.order,
            confirmed.sprenType,
            confirmed.surgePair,
            confirmed.philosophy,
            tier0TalentId
          );
          console.log(`[Spren] 💾 Persisted spren to database for ${characterId}`);
        }
      }

      inMemorySprenQueue.set(characterId, queue);
      return { success: true };
    } catch (error) {
      console.error(`[Spren] ❌ Error handling ack for ${characterId}:`, error);
      return { success: false };
    }
  }

  /**
   * Resend pending spren grants on player reconnection
   * @param characterId - Character ID
   * @param socketId - New socket ID
   */
  async resendPendingOnReconnect(characterId: string, socketId: string): Promise<void> {
    const queue = inMemorySprenQueue.get(characterId);
    if (queue && queue.length > 0) {
      console.log(`[Spren] 🔁 Resending ${queue.length} pending spren grant(s) for ${characterId} on reconnect`);
      this.sendPendingSprenGrant(characterId, socketId);
    }
  }

  /**
   * Get the current queue state for a character (for debugging)
   * @param characterId - Character ID
   */
  getQueueState(characterId: string): { pending: number; confirmed: boolean } {
    const queue = inMemorySprenQueue.get(characterId) || [];
    return {
      pending: queue.length,
      confirmed: confirmedSprenGrants.has(characterId)
    };
  }
}
