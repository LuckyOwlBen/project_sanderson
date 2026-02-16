/**
 * Item Grant Socket Handlers
 *
 * Extracted WebSocket event handlers for item grant management
 * These are registered in server.ts socket.on('connection') block
 */

import { Socket, Server } from 'socket.io';
import { ItemGrantRepository, ItemGrantPayload } from '../repositories/item-grant-repository';

/**
 * In-memory cache of in-flight item grants
 * Maps characterId -> array of pending grants
 */
const inMemoryItemQueue = new Map<string, ItemGrantPayload[]>();

/**
 * Register item grant-related socket event handlers
 * @param socket - The socket connection
 * @param io - The socket.io server instance
 * @param itemGrantRepository - The item grant repository
 * @param findSocketIdByCharacterId - Function to find socket ID by character ID
 * @param activePlayers - Map of socket ID to player info
 */
export function registerItemGrantHandlers(
  socket: Socket,
  io: Server,
  itemGrantRepository: ItemGrantRepository,
  findSocketIdByCharacterId: (characterId: string) => string | undefined,
  activePlayers: Map<string, any>
): void {
  /**
   * GM grants an item to a player
   * Payload: { characterId, itemId, quantity, timestamp }
   */
  socket.on('gm-grant-item', async (data) => {
    const { characterId, itemId, quantity, timestamp } = data;
    console.log(`[GM Action] 🎁 Granting ${quantity}x ${itemId} to character ${characterId}`);

    try {
      const payload: ItemGrantPayload = {
        characterId,
        itemId,
        quantity,
        grantedBy: 'GM',
        timestamp: timestamp || new Date().toISOString(),
      };

      // Add to in-memory queue
      const queue = inMemoryItemQueue.get(characterId) || [];
      queue.push(payload);
      inMemoryItemQueue.set(characterId, queue);
      console.log(`[GM Action] 🎁 Item queued. Queue size: ${queue.length}`);

      // Try to add item to character immediately (may fail if offline)
      const targetSocket = findSocketIdByCharacterId(characterId);
      if (targetSocket) {
        sendPendingItemGrant(characterId, io);
      } else {
        console.warn(`[GM Action] ⚠️ Player ${characterId} offline - will send on reconnect`);
      }
    } catch (error) {
      console.error(`[GM Action] ❌ Error in gm-grant-item handler:`, error);
      socket.emit('gm-grant-error', {
        type: 'item',
        characterId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * Player acknowledges receipt and processing of item grant
   * Payload: { characterId, itemId, quantity }
   */
  socket.on('item-grant-ack', async ({ characterId, itemId, quantity }) => {
    const player = activePlayers.get(socket.id);
    if (!player || player.characterId !== characterId) {
      console.warn(
        `[Item] ⚠️ Ack from unknown player/socket ${socket.id} for character ${characterId}`
      );
      return;
    }

    try {
      const queue = inMemoryItemQueue.get(characterId) || [];

      // Find and remove the matching grant from queue
      if (queue.length > 0 && queue[0].itemId === itemId && queue[0].quantity === quantity) {
        queue.shift();
      } else {
        const idx = queue.findIndex(
          (entry) => entry.itemId === itemId && entry.quantity === quantity
        );
        if (idx !== -1) {
          queue.splice(idx, 1);
        } else {
          console.warn(
            `[Item] ⚠️ Received ack for unexpected item ${itemId} x${quantity} on character ${characterId}`
          );
        }
      }

      inMemoryItemQueue.set(characterId, queue);
      console.log(
        `[Item] ✅ Ack received for ${characterId} item: ${itemId} x${quantity}. Remaining queue: ${queue.length}`
      );

      // Persist item grant to database
      const result = await itemGrantRepository.addItemToCharacter(characterId, itemId, quantity);
      if (!result.success) {
        console.error(`[Item] ❌ Failed to persist item grant: ${result.error}`);
      }

      // Send next queued item if any
      if (queue.length > 0) {
        sendPendingItemGrant(characterId, io);
      }
    } catch (error) {
      console.error(`[Item] ❌ Error in item-grant-ack handler:`, error);
    }
  });
}

/**
 * Send the next pending item grant for a character
 * @param characterId - Character ID
 * @param io - Socket.io server instance
 */
function sendPendingItemGrant(characterId: string, io: Server): void {
  const queue = inMemoryItemQueue.get(characterId);
  if (!queue || queue.length === 0) {
    console.warn(`[Item] ⚠️ No pending item grants for ${characterId}`);
    return;
  }

  // Find the socket for this character
  // This would normally use findSocketIdByCharacterId helper
  // For now, we emit to characterId - the client side will listen
  const grant = queue[0];
  console.log(
    `[GM Action] 🎁 Sending pending item grant to ${characterId}: ${grant.itemId} x${grant.quantity}`
  );
  io.emit('item-granted', grant);
}

/**
 * Resend pending item grants on player reconnection
 * @param characterId - Character ID
 * @param io - Socket.io server instance
 */
export function resendPendingItemsOnReconnect(characterId: string, io: Server): void {
  const queue = inMemoryItemQueue.get(characterId);
  if (queue && queue.length > 0) {
    console.log(
      `[Item] 🔁 Resending ${queue.length} pending item grant(s) for ${characterId} on reconnect`
    );
    sendPendingItemGrant(characterId, io);
  }
}

/**
 * Get the current queue state for a character (for debugging)
 */
export function getItemGrantQueueState(characterId: string): { pending: number } {
  const queue = inMemoryItemQueue.get(characterId) || [];
  return {
    pending: queue.length,
  };
}
