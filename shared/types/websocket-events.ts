/**
 * WebSocket Events - Shared Type Definitions
 * 
 * Event types for real-time communication between client and server
 */

/**
 * Fired when a player joins the game
 */
export interface PlayerJoinedEvent {
  characterId: string;
  name: string;
  level: number;
  ancestry: string | null; // ancestry name or null
  health: { current: number; max: number };
  focus: { current: number; max: number };
  investiture: { current: number; max: number };
  currencyInChips?: number;
  joinedAt: string;
  socketId: string;
}

/**
 * Fired when a player leaves the game
 */
export interface PlayerLeftEvent {
  characterId: string;
  socketId: string;
}

/**
 * Fired when a player's resources (health, focus, investiture) change
 */
export interface PlayerResourceUpdateEvent {
  characterId: string;
  socketId: string;
  health: { current: number; max: number };
  focus: { current: number; max: number };
  investiture: { current: number; max: number };
}

/**
 * Fired when a critical event occurs (character death, dangerous situation, etc.)
 */
export interface PlayerCriticalEvent {
  characterId: string;
  playerName: string;
  message: string;
}

/**
 * Fired when a character is granted a Radiant spren/order
 */
export interface SprenGrantEvent {
  characterId: string;
  order: string;
  sprenType: string;
  surgePair: [string, string];
  philosophy: string;
}

/**
 * Individual item transaction (buy or sell)
 */
export interface ItemTransaction {
  itemId: string;
  quantity: number;
  price: number;
  type: 'buy' | 'sell';
}

/**
 * Fired when a character makes a purchase or sale at a store
 */
export interface StoreTransactionEvent {
  storeId: string;
  characterId: string;
  items: ItemTransaction[];
  totalCost: number;
  timestamp: string;
}

/**
 * Fired when an item is granted to a character (via quest, admin, etc.)
 */
export interface ItemGrantEvent {
  characterId: string;
  itemId: string;
  quantity: number;
  grantedBy: string;
  timestamp: string;
}

/**
 * Fired when a store is toggled enabled/disabled
 */
export interface StoreToggleEvent {
  storeId: string;
  enabled: boolean;
  toggledBy: string;
}

/**
 * Fired when an expertise is granted to a character
 */
export interface ExpertiseGrantEvent {
  characterId: string;
  expertiseName: string;
  grantedBy: string;
  timestamp: string;
}

/**
 * Fired when a character levels up
 */
export interface LevelUpEvent {
  characterId: string;
  newLevel: number;
  grantedBy: string;
  timestamp: string;
}

/**
 * Fired when a highstorm occurs in the game world
 */
export interface HighstormEvent {
  active: boolean;
  triggeredBy: string;
  timestamp: string;
}

/**
 * Fired when combat starts
 */
export interface CombatStartEvent {
  timestamp: string;
}

/**
 * Fired when a character selects their turn speed in combat
 */
export interface TurnSpeedSelectionEvent {
  characterId: string;
  turnSpeed: 'fast' | 'slow';
  timestamp: string;
}

/**
 * Fired when turn groups in combat are updated
 */
export interface TurnGroupsUpdateEvent {
  fastPC: string[];
  fastNPC: string[];
  slowPC: string[];
  slowNPC: string[];
  timestamp: string;
}

/**
 * Fired when a character's data is updated (talents, attributes, etc.)
 */
export interface CharacterUpdatedEvent {
  characterId: string;
  timestamp: string;
}

/**
 * Combat turn phases following the Cosmere RPG rules:
 * 1. Fast PCs → 2. Fast NPCs → 3. Slow PCs → 4. Slow NPCs → Next Round
 */
export type CombatPhase = 'fastPC' | 'fastNPC' | 'slowPC' | 'slowNPC';

/**
 * A participant in combat (PC or NPC group)
 */
export interface CombatParticipant {
  id: string;
  name: string;
  type: 'pc' | 'npc';
}

/**
 * Full combat state broadcast from the server to all clients
 */
export interface CombatStateEvent {
  active: boolean;
  roundsStarted: boolean;
  round: number;
  phase: CombatPhase;
  activeParticipantId: string | null;
  completedInPhase: string[];
  participants: {
    fastPC: CombatParticipant[];
    fastNPC: CombatParticipant[];
    slowPC: CombatParticipant[];
    slowNPC: CombatParticipant[];
  };
  timestamp: string;
}

/**
 * Fired when it's a specific player's turn
 */
export interface YourTurnEvent {
  characterId: string;
  round: number;
  phase: CombatPhase;
  actionsAvailable: number;
  timestamp: string;
}

/**
 * Fired when combat ends
 */
export interface CombatEndEvent {
  timestamp: string;
}
