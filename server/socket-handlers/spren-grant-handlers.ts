/**
 * Spren Grant Socket Handlers
 *
 * Extracted WebSocket event handlers for spren grant management
 * These are registered in server.ts socket.on('connection') block
 */

import { Socket, Server } from 'socket.io';
import { SprenGrantService, SprenGrantPayload } from '../services/spren-grant-service';

/**
 * Register spren-related socket event handlers
 * @param socket - The socket connection
 * @param io - The socket.io server instance
 * @param sprenGrantService - The spren grant service
 * @param findSocketIdByCharacterId - Function to find socket ID by character ID
 * @param activePlayers - Map of socket ID to player info
 */
export function registerSprenHandlers(
  socket: Socket,
  io: Server,
  sprenGrantService: SprenGrantService,
  findSocketIdByCharacterId: (characterId: string) => string | undefined,
  activePlayers: Map<string, any>
): void {
  /**
   * GM grants spren to a player
   * Payload: { characterId, order, sprenType, surgePair, philosophy }
   */
  socket.on('gm-grant-spren', async (data) => {
    const { characterId, order, sprenType, surgePair, philosophy } = data;
    console.log(`[GM Action] ⭐⭐⭐ RECEIVED GM-GRANT-SPREN REQUEST ⭐⭐⭐`);
    console.log(`[GM Action] Granting ${order} spren to character ${characterId}`);

    try {
      const payload: SprenGrantPayload = {
        characterId,
        order,
        sprenType,
        surgePair,
        philosophy,
      };

      const result = await sprenGrantService.queueSprenGrant(payload, findSocketIdByCharacterId);

      if (!result.success) {
        console.error(`[GM Action] ⭐ Failed to queue spren grant for ${characterId}`);
        socket.emit('gm-grant-error', {
          type: 'spren',
          characterId,
          error: 'Failed to queue spren grant',
        });
      } else if (!result.sent) {
        console.warn(
          `[GM Action] ⚠️ Spren grant queued but player offline - will send on reconnect`
        );
      }
    } catch (error) {
      console.error(`[GM Action] ❌ Error in gm-grant-spren handler:`, error);
      socket.emit('gm-grant-error', {
        type: 'spren',
        characterId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * Player acknowledges receipt of spren grant
   * Payload: { characterId, order }
   */
  socket.on('spren-grant-ack', async ({ characterId, order }) => {
    const player = activePlayers.get(socket.id);
    if (!player || player.characterId !== characterId) {
      console.warn(
        `[Spren] ⚠️ Ack from unknown player/socket ${socket.id} for character ${characterId}`
      );
      return;
    }

    try {
      const result = await sprenGrantService.handleSprenAck(characterId, order);

      if (result.success) {
        console.log(`[Spren] ✅ Successfully processed ack for ${characterId}`);
      } else {
        console.error(`[Spren] ❌ Failed to process ack for ${characterId}`);
      }
    } catch (error) {
      console.error(`[Spren] ❌ Error in spren-grant-ack handler:`, error);
    }
  });
}

/**
 * Helper to resend pending spren grants on player reconnection
 * Call this in the player-join handler
 * @param characterId - Character ID
 * @param socketId - New socket ID
 * @param sprenGrantService - The spren grant service
 */
export async function resendPendingSprenOnReconnect(
  characterId: string,
  socketId: string,
  sprenGrantService: SprenGrantService
): Promise<void> {
  await sprenGrantService.resendPendingOnReconnect(characterId, socketId);
}
