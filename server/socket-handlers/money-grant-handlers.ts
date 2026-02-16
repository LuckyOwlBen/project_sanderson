/**
 * Money Grant Socket Handlers
 * 
 * Extracted WebSocket event handlers for money grant management
 * These are registered in server.ts socket.on('connection') block
 */

import { Socket, Server } from 'socket.io';
import { loadCharacter, saveCharacter } from '../database';

/**
 * Register money grant-related socket event handlers
 * @param socket - The socket connection
 * @param io - The socket.io server instance
 * @param findSocketIdByCharacterId - Function to find socket ID by character ID
 * @param activePlayers - Map of socket ID to player info
 */
export function registerMoneyGrantHandlers(
  socket: Socket,
  io: Server,
  findSocketIdByCharacterId: (characterId: string) => string | undefined,
  activePlayers: Map<string, any>
): void {
  /**
   * GM grants money to a player
   * Payload: { characterId, amount, operation, timestamp }
   * operation: 'add' (add to current balance) or 'set' (set absolute balance)
   */
  socket.on('gm-grant-money', async (data) => {
    const { characterId, amount, operation, timestamp } = data;
    console.log(`[GM Action] 💰 Granting money: ${amount} (${operation}) to character ${characterId}`);

    try {
      // Load character
      const character = await loadCharacter(characterId);
      if (!character) {
        console.error(`[GM Action] ❌ Character ${characterId} not found`);
        socket.emit('gm-grant-error', {
          type: 'money',
          characterId,
          error: 'Character not found'
        });
        return;
      }

      // Initialize inventory if needed
      if (!character.inventory) {
        character.inventory = {
          items: [],
          currencyInChips: 0
        };
      }

      // Get current balance
      const currentBalance = character.inventory.currencyInChips || 0;
      let newBalance = currentBalance;

      // Apply operation
      if (operation === 'add') {
        newBalance = currentBalance + amount;
      } else if (operation === 'set') {
        newBalance = amount;
      }

      // Update character
      character.inventory.currencyInChips = newBalance;
      await saveCharacter(character);

      console.log(`[GM Action] ✅ Money updated for ${characterId}: ${currentBalance} → ${newBalance}`);

      // Find player's socket and notify them
      const targetSocketId = findSocketIdByCharacterId(characterId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('money-granted', {
          amount: operation === 'add' ? amount : 0,
          newBalance,
          operation,
          timestamp: timestamp || new Date().toISOString()
        });
        console.log(`[GM Action] 💬 Notified player of money grant`);
      } else {
        console.warn(`[GM Action] ⚠️ Player ${characterId} offline - money still saved to character`);
      }

      // Broadcast updated player info to GM
      const updatedPlayer = activePlayers.get(targetSocketId || '');
      if (updatedPlayer) {
        updatedPlayer.currencyInChips = newBalance;
      }

      socket.emit('gm-grant-success', {
        type: 'money',
        characterId,
        amount,
        operation,
        newBalance
      });
    } catch (error) {
      console.error(`[GM Action] ❌ Error in gm-grant-money handler:`, error);
      socket.emit('gm-grant-error', {
        type: 'money',
        characterId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}
