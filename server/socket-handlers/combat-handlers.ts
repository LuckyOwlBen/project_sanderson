/**
 * Combat Turn Tracker Socket Handlers
 * 
 * Server-side combat state management following Cosmere RPG turn phases:
 * 1. Fast PCs → 2. Fast NPCs → 3. Slow PCs → 4. Slow NPCs → Next Round
 * 
 * The GM advances through individual participants within each phase.
 * PCs receive a targeted "your-turn" event when activated.
 * All state is in-memory (lost on server restart).
 */

import { Socket, Server } from 'socket.io';
import {
  CombatPhase,
  CombatParticipant,
  CombatStateEvent,
  YourTurnEvent,
  CombatEndEvent
} from '../../shared/types/websocket-events';

const PHASE_ORDER: CombatPhase[] = ['fastPC', 'fastNPC', 'slowPC', 'slowNPC'];

interface CombatState {
  active: boolean;
  roundsStarted: boolean;
  round: number;
  phase: CombatPhase;
  activeParticipantId: string | null;
  completedInPhase: Set<string>;
  participants: {
    fastPC: CombatParticipant[];
    fastNPC: CombatParticipant[];
    slowPC: CombatParticipant[];
    slowNPC: CombatParticipant[];
  };
}

// Module-level combat state (in-memory, singleton)
const combatState: CombatState = {
  active: false,
  roundsStarted: false,
  round: 1,
  phase: 'fastPC',
  activeParticipantId: null,
  completedInPhase: new Set(),
  participants: {
    fastPC: [],
    fastNPC: [],
    slowPC: [],
    slowNPC: []
  }
};

function resetCombatState(): void {
  combatState.active = false;
  combatState.roundsStarted = false;
  combatState.round = 1;
  combatState.phase = 'fastPC';
  combatState.activeParticipantId = null;
  combatState.completedInPhase.clear();
  combatState.participants = { fastPC: [], fastNPC: [], slowPC: [], slowNPC: [] };
}

function buildStateEvent(): CombatStateEvent {
  return {
    active: combatState.active,
    roundsStarted: combatState.roundsStarted,
    round: combatState.round,
    phase: combatState.phase,
    activeParticipantId: combatState.activeParticipantId,
    completedInPhase: Array.from(combatState.completedInPhase),
    participants: { ...combatState.participants },
    timestamp: new Date().toISOString()
  };
}

function getActionsForPhase(phase: CombatPhase): number {
  return (phase === 'fastPC' || phase === 'fastNPC') ? 2 : 3;
}

/**
 * Skip empty phases forward until we find one with participants, or wrap to next round.
 * Returns true if we advanced (caller should broadcast).
 */
function advanceToNextNonEmptyPhase(): boolean {
  let advanced = false;
  const startPhase = combatState.phase;
  const startRound = combatState.round;

  // Try up to 4 phases (one full cycle) before giving up
  for (let i = 0; i < PHASE_ORDER.length; i++) {
    const currentParticipants = combatState.participants[combatState.phase];
    if (currentParticipants.length > 0) {
      break; // Found a phase with participants
    }

    // Advance to next phase
    const currentIndex = PHASE_ORDER.indexOf(combatState.phase);
    if (currentIndex >= PHASE_ORDER.length - 1) {
      // Wrap to next round
      combatState.round++;
      combatState.phase = PHASE_ORDER[0];
    } else {
      combatState.phase = PHASE_ORDER[currentIndex + 1];
    }
    combatState.completedInPhase.clear();
    combatState.activeParticipantId = null;
    advanced = true;
  }

  return advanced;
}

/**
 * Register combat turn tracker socket event handlers
 */
export function registerCombatHandlers(
  socket: Socket,
  io: Server,
  findSocketIdByCharacterId: (characterId: string) => string | undefined,
  activePlayers: Map<string, any>
): void {

  /**
   * GM begins round-by-round tracking.
   * Locks in current participants from the provided turn groups.
   * Payload: { participants: { fastPC: [{id, name}], fastNPC: [...], slowPC: [...], slowNPC: [...] } }
   */
  socket.on('gm-begin-rounds', (data) => {
    console.log(`[Combat] 🎯 GM beginning round tracking`);

    combatState.active = true;
    combatState.roundsStarted = true;
    combatState.round = 1;
    combatState.phase = 'fastPC';
    combatState.activeParticipantId = null;
    combatState.completedInPhase.clear();

    // Lock in participants
    combatState.participants = {
      fastPC: data.participants.fastPC || [],
      fastNPC: data.participants.fastNPC || [],
      slowPC: data.participants.slowPC || [],
      slowNPC: data.participants.slowNPC || []
    };

    // Skip empty phases
    advanceToNextNonEmptyPhase();

    io.emit('combat-state', buildStateEvent());
    console.log(`[Combat] 🎯 Round 1 started, phase: ${combatState.phase}`);
  });

  /**
   * GM activates a specific participant's turn.
   * Auto-completes the previously active participant if any.
   * Payload: { participantId: string }
   */
  socket.on('gm-set-active-turn', ({ participantId }) => {
    if (!combatState.roundsStarted) return;

    console.log(`[Combat] ▶️ Activating turn for: ${participantId}`);

    // Auto-complete previous active participant
    if (combatState.activeParticipantId && combatState.activeParticipantId !== participantId) {
      combatState.completedInPhase.add(combatState.activeParticipantId);
    }

    combatState.activeParticipantId = participantId;

    // Send targeted your-turn event to PCs
    const currentParticipants = combatState.participants[combatState.phase];
    const participant = currentParticipants.find(p => p.id === participantId);
    if (participant && participant.type === 'pc') {
      const targetSocketId = findSocketIdByCharacterId(participantId);
      if (targetSocketId) {
        const yourTurnPayload: YourTurnEvent = {
          characterId: participantId,
          round: combatState.round,
          phase: combatState.phase,
          actionsAvailable: getActionsForPhase(combatState.phase),
          timestamp: new Date().toISOString()
        };
        io.to(targetSocketId).emit('your-turn', yourTurnPayload);
        console.log(`[Combat] 📣 Sent your-turn to ${participant.name} (${targetSocketId})`);
      }
    }

    io.emit('combat-state', buildStateEvent());
  });

  /**
   * GM marks a participant's turn as complete.
   * If all participants in the phase are done, auto-advances to the next phase.
   * If all phases done, advances to the next round.
   * Payload: { participantId: string }
   */
  socket.on('gm-complete-turn', ({ participantId }) => {
    if (!combatState.roundsStarted) return;

    console.log(`[Combat] ✅ Completing turn for: ${participantId}`);

    combatState.completedInPhase.add(participantId);

    // Clear active if this was the active participant
    if (combatState.activeParticipantId === participantId) {
      combatState.activeParticipantId = null;
    }

    // Check if all participants in current phase are done
    const currentParticipants = combatState.participants[combatState.phase];
    const allDone = currentParticipants.every(p => combatState.completedInPhase.has(p.id));

    if (allDone && currentParticipants.length > 0) {
      console.log(`[Combat] 📦 Phase ${combatState.phase} complete`);

      // Advance to next phase
      const currentIndex = PHASE_ORDER.indexOf(combatState.phase);
      if (currentIndex >= PHASE_ORDER.length - 1) {
        // All phases done — next round
        combatState.round++;
        combatState.phase = PHASE_ORDER[0];
        console.log(`[Combat] 🔄 Round ${combatState.round} starting`);
      } else {
        combatState.phase = PHASE_ORDER[currentIndex + 1];
      }

      combatState.completedInPhase.clear();
      combatState.activeParticipantId = null;

      // Skip empty phases
      advanceToNextNonEmptyPhase();
    }

    io.emit('combat-state', buildStateEvent());
  });

  /**
   * GM ends combat entirely.
   */
  socket.on('gm-end-combat', () => {
    console.log(`[Combat] 🛑 GM ending combat`);

    resetCombatState();

    const payload: CombatEndEvent = {
      timestamp: new Date().toISOString()
    };

    io.emit('combat-end', payload);
    console.log(`[Combat] 🛑 Combat ended`);
  });

  /**
   * Client requests current combat state (e.g., on reconnect)
   */
  socket.on('request-combat-state', () => {
    if (combatState.active) {
      socket.emit('combat-state', buildStateEvent());
    }
  });
}
