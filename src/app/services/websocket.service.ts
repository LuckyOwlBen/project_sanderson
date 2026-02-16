import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { Ancestry } from '../character/ancestry/ancestry';
import {
  PlayerJoinedEvent as SharedPlayerJoinedEvent,
  PlayerLeftEvent,
  PlayerResourceUpdateEvent,
  PlayerCriticalEvent,
  SprenGrantEvent,
  ItemTransaction,
  StoreTransactionEvent,
  ItemGrantEvent,
  StoreToggleEvent,
  ExpertiseGrantEvent,
  LevelUpEvent,
  HighstormEvent,
  CombatStartEvent,
  TurnSpeedSelectionEvent,
  TurnGroupsUpdateEvent,
  CharacterUpdatedEvent
} from '../../../shared/types/websocket-events';

// Extend shared PlayerJoinedEvent to use local Ancestry type
export interface PlayerJoinedEvent extends Omit<SharedPlayerJoinedEvent, 'ancestry'> {
  ancestry: Ancestry | null;
}

// Re-export shared event types
export type { PlayerLeftEvent, PlayerResourceUpdateEvent, PlayerCriticalEvent, SprenGrantEvent };
export type { ItemTransaction, StoreTransactionEvent, ItemGrantEvent };
export type { StoreToggleEvent, ExpertiseGrantEvent, LevelUpEvent };
export type { HighstormEvent, CombatStartEvent, TurnSpeedSelectionEvent };
export type { TurnGroupsUpdateEvent, CharacterUpdatedEvent };

@Injectable({
  providedIn: 'root'
})
export class WebsocketService implements OnDestroy {
  private socket: Socket | null = null;
  private serverUrl = 'http://localhost:80'; // Will use same host in production

  // Connection state
  private connectedSubject = new BehaviorSubject<boolean>(false);
  public connected$ = this.connectedSubject.asObservable();

  // Event streams
  private playerJoinedSubject = new Subject<PlayerJoinedEvent>();
  public playerJoined$ = this.playerJoinedSubject.asObservable();

  private playerLeftSubject = new Subject<PlayerLeftEvent>();
  public playerLeft$ = this.playerLeftSubject.asObservable();

  private playerResourceUpdateSubject = new Subject<PlayerResourceUpdateEvent>();
  public playerResourceUpdate$ = this.playerResourceUpdateSubject.asObservable();

  private playerCriticalSubject = new Subject<PlayerCriticalEvent>();
  public playerCritical$ = this.playerCriticalSubject.asObservable();

  private activePlayersSubject = new Subject<PlayerJoinedEvent[]>();
  public activePlayers$ = this.activePlayersSubject.asObservable();

  private sprenGrantSubject = new Subject<SprenGrantEvent>();
  public sprenGrant$ = this.sprenGrantSubject.asObservable();

  private storeTransactionSubject = new Subject<StoreTransactionEvent>();
  public storeTransaction$ = this.storeTransactionSubject.asObservable();

  private itemGrantSubject = new Subject<ItemGrantEvent>();
  public itemGrant$ = this.itemGrantSubject.asObservable();

  private storeToggleSubject = new Subject<StoreToggleEvent>();
  public storeToggle$ = this.storeToggleSubject.asObservable();

  private expertiseGrantSubject = new Subject<ExpertiseGrantEvent>();
  public expertiseGrant$ = this.expertiseGrantSubject.asObservable();

  private levelUpSubject = new Subject<LevelUpEvent>();
  public levelUp$ = this.levelUpSubject.asObservable();

  private highstormSubject = new Subject<HighstormEvent>();
  public highstorm$ = this.highstormSubject.asObservable();

  private combatStartSubject = new Subject<CombatStartEvent>();
  public combatStart$ = this.combatStartSubject.asObservable();

  private turnSpeedSelectionSubject = new Subject<TurnSpeedSelectionEvent>();
  public turnSpeedSelection$ = this.turnSpeedSelectionSubject.asObservable();

  private turnGroupsUpdateSubject = new Subject<TurnGroupsUpdateEvent>();
  public turnGroupsUpdate$ = this.turnGroupsUpdateSubject.asObservable();

  private characterUpdatedSubject = new Subject<CharacterUpdatedEvent>();
  public characterUpdated$ = this.characterUpdatedSubject.asObservable();

  constructor() {
    // Determine server URL based on current location
    if (typeof window !== 'undefined') {
      // In development (port 4200), connect to backend at port 3000
      // In production (port 80), connect to same port
      const isDevelopment = window.location.port === '4200';
      const port = isDevelopment ? '3000' : (window.location.port || '80');
      this.serverUrl = `${window.location.protocol}//${window.location.hostname}:${port}`;
    }
  }

  connect(): void {
    if (this.socket?.connected) {
      console.log('[WebSocket] Already connected');
      this.connectedSubject.next(true);
      return;
    }

    // Clean up existing socket if present but not connected
    if (this.socket) {
      console.log('[WebSocket] Cleaning up old socket');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    console.log('[WebSocket] Connecting to:', this.serverUrl);
    
    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      timeout: 10000
    });

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected! Socket ID:', this.socket?.id);
      console.log('[WebSocket] Socket connected state:', this.socket?.connected);
      this.connectedSubject.next(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      this.connectedSubject.next(false);
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('[WebSocket] Connection error:', error);
      this.connectedSubject.next(false);
    });

    // Listen for player events
    this.socket.on('player-joined', (data: PlayerJoinedEvent) => {
      console.log('[WebSocket] Player joined:', data);
      this.playerJoinedSubject.next(data);
    });

    this.socket.on('player-left', (data: PlayerLeftEvent) => {
      console.log('[WebSocket] Player left:', data);
      this.playerLeftSubject.next(data);
    });

    this.socket.on('player-resource-update', (data: PlayerResourceUpdateEvent) => {
      this.playerResourceUpdateSubject.next(data);
    });

    this.socket.on('player-critical', (data: PlayerCriticalEvent) => {
      console.log('[WebSocket] CRITICAL:', data);
      this.playerCriticalSubject.next(data);
    });

    this.socket.on('active-players', (data: PlayerJoinedEvent[]) => {
      console.log('[WebSocket] Active players update:', data);
      this.activePlayersSubject.next(data);
    });

    this.socket.on('spren-granted', (data: SprenGrantEvent) => {
      console.log('[WebSocket] ⭐⭐⭐ SPREN GRANTED EVENT RECEIVED ⭐⭐⭐');
      console.log('[WebSocket] ⭐ Spren granted event received:', data);
      console.log('[WebSocket] ⭐ Broadcasting to sprenGrantSubject');
      this.sprenGrantSubject.next(data);
    });

    // Listen for inventory/store events
    this.socket.on('store-transaction', (data: StoreTransactionEvent) => {
      console.log('[WebSocket] Store transaction:', data);
      this.storeTransactionSubject.next(data);
    });

    this.socket.on('item-granted', (data: ItemGrantEvent) => {
      console.log('[WebSocket] 🎁 Item granted:', data);
      this.itemGrantSubject.next(data);
    });

    this.socket.on('store-toggle', (data: StoreToggleEvent) => {
      console.log('[WebSocket] 🏪 Store toggled:', data);
      this.storeToggleSubject.next(data);
    });

    this.socket.on('expertise-granted', (data: ExpertiseGrantEvent) => {
      console.log('[WebSocket] 📚📚📚 EXPERTISE-GRANTED EVENT RECEIVED 📚📚📚');
      console.log('[WebSocket] 📚 Expertise granted event data:', data);
      console.log('[WebSocket] 📚 Broadcasting to expertiseGrantSubject');
      this.expertiseGrantSubject.next(data);
      console.log('[WebSocket] 📚 Broadcast complete');
    });

    this.socket.on('level-up-granted', (data: LevelUpEvent) => {
      console.log('[WebSocket] 🆙🆙🆙 LEVEL-UP EVENT RECEIVED 🆙🆙🆙');
      console.log('[WebSocket] 🆙 Level-up event data:', data);
      console.log('[WebSocket] 🆙 Broadcasting to levelUpSubject');
      this.levelUpSubject.next(data);
      console.log('[WebSocket] 🆙 Broadcast complete');
    });

    this.socket.on('highstorm-toggle', (data: HighstormEvent) => {
      console.log('[WebSocket] ⚡⚡⚡ HIGHSTORM EVENT RECEIVED ⚡⚡⚡');
      console.log('[WebSocket] ⚡ Highstorm event data:', data);
      this.highstormSubject.next(data);
    });

    // Listen for combat events
    this.socket.on('combat-start', (data: CombatStartEvent) => {
      console.log('[WebSocket] ⚔️ Combat started');
      this.combatStartSubject.next(data);
    });

    this.socket.on('turn-speed-selection', (data: TurnSpeedSelectionEvent) => {
      console.log('[WebSocket] 🔄 Turn speed selected:', data);
      this.turnSpeedSelectionSubject.next(data);
    });

    this.socket.on('turn-groups-update', (data: TurnGroupsUpdateEvent) => {
      console.log('[WebSocket] 📋 Turn groups updated:', data);
      this.turnGroupsUpdateSubject.next(data);
    });
    
    this.socket.on('character-updated', (data: CharacterUpdatedEvent) => {
      console.log('[WebSocket] 🔄 Character updated:', data);
      this.characterUpdatedSubject.next(data);
    });
    
    console.log('[WebSocket] ✅ All event listeners registered');
  }

  disconnect(): void {
    if (this.socket) {
      console.log('[WebSocket] Disconnecting');
      this.socket.disconnect();
      this.socket = null;
      this.connectedSubject.next(false);
    }
  }

  emitPlayerJoin(data: {
    characterId: string;
    name: string;
    level: number;
    ancestry: Ancestry | null;
    health: { current: number; max: number };
    focus: { current: number; max: number };
    investiture: { current: number; max: number };
  }): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot emit player-join: not connected');
      return;
    }

    console.log('[WebSocket] Emitting player-join:', data.name);
    this.socket.emit('player-join', {
      characterId: data.characterId,
      name: data.name,
      level: data.level,
      ancestry: data.ancestry,
      health: data.health,
      focus: data.focus,
      investiture: data.investiture
    });
  }

  emitPlayerLeave(characterId: string): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot emit player-leave: not connected');
      return;
    }

    console.log('[WebSocket] Emitting player-leave:', characterId);
    this.socket.emit('player-leave', { characterId });
  }

  emitResourceUpdate(data: {
    characterId: string;
    health: { current: number; max: number };
    focus: { current: number; max: number };
    investiture: { current: number; max: number };
  }): void {
    if (!this.socket?.connected) {
      return; // Silently fail if not connected (resources still save locally)
    }

    this.socket.emit('resource-update', data);
  }

  requestActivePlayers(): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot request active players: not connected');
      return;
    }

    console.log('[WebSocket] Requesting active players');
    this.socket.emit('get-active-players');
  }

  grantSpren(characterId: string, order: string, orderInfo: any): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot grant spren: not connected');
      return;
    }

    console.log('[WebSocket] Granting spren:', { characterId, order });
    this.socket.emit('gm-grant-spren', {
      characterId,
      order,
      sprenType: orderInfo.sprenType,
      surgePair: orderInfo.surgePair,
      philosophy: orderInfo.philosophy
    });
  }

  emitStoreTransaction(data: StoreTransactionEvent): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot emit store-transaction: not connected');
      return;
    }

    console.log('[WebSocket] Emitting store transaction:', data);
    this.socket.emit('store-transaction', data);
  }

  grantItem(characterId: string, itemId: string, quantity: number): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot grant item: not connected');
      return;
    }

    console.log('[WebSocket] Granting item:', { characterId, itemId, quantity });
    this.socket.emit('gm-grant-item', {
      characterId,
      itemId,
      quantity,
      timestamp: new Date().toISOString()
    });
  }

  toggleStore(storeId: string, enabled: boolean): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot toggle store: not connected');
      return;
    }

    console.log('[WebSocket] Toggling store:', { storeId, enabled });
    this.socket.emit('gm-toggle-store', {
      storeId,
      enabled
    });
  }

  requestStoreState(): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot request store state: not connected');
      return;
    }

    console.log('[WebSocket] 📥 Requesting current store state');
    this.socket.emit('request-store-state');
  }

  grantExpertise(characterId: string, expertiseName: string): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot grant expertise: not connected');
      return;
    }

    console.log('[WebSocket] 📤 Granting expertise:', { characterId, expertiseName });
    console.log('[WebSocket] 📤 Socket ID:', this.socket.id);
    console.log('[WebSocket] 📤 Socket connected:', this.socket.connected);
    this.socket.emit('gm-grant-expertise', {
      characterId,
      expertiseName,
      timestamp: new Date().toISOString()
    });
    console.log('[WebSocket] 📤 gm-grant-expertise event emitted');
  }

  grantMoney(characterId: string, amount: number, operation: 'add' | 'set'): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot grant money: not connected');
      return;
    }

    console.log('[WebSocket] 💰 Granting money:', { characterId, amount, operation });
    this.socket.emit('gm-grant-money', {
      characterId,
      amount,
      operation,
      timestamp: new Date().toISOString()
    });
    console.log('[WebSocket] 💰 gm-grant-money event emitted');
  }

  grantLevelUp(characterId: string): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot grant level up: not connected');
      return;
    }

    console.log('[WebSocket] 📤🆙 Granting level up:', { characterId });
    console.log('[WebSocket] 📤 Socket ID:', this.socket.id);
    console.log('[WebSocket] 📤 Socket connected:', this.socket.connected);
    this.socket.emit('gm-grant-level-up', {
      characterId,
      timestamp: new Date().toISOString()
    });
    console.log('[WebSocket] 📤 gm-grant-level-up event emitted');
  }

  ackLevelUp(characterId: string, newLevel: number): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot ack level up: not connected');
      return;
    }

    console.log('[WebSocket] 📬 Acking level up:', { characterId, newLevel });
    this.socket.emit('level-up-ack', { characterId, newLevel });
  }

  ackSprenGrant(characterId: string, order: string): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot ack spren grant: not connected');
      return;
    }

    console.log('[WebSocket] ⭐✅ Acking spren grant:', { characterId, order });
    this.socket.emit('spren-grant-ack', { characterId, order });
  }

  ackExpertiseGrant(characterId: string, expertiseName: string): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot ack expertise grant: not connected');
      return;
    }

    console.log('[WebSocket] 📚✅ Acking expertise grant:', { characterId, expertiseName });
    this.socket.emit('expertise-grant-ack', { characterId, expertiseName });
  }

  ackItemGrant(characterId: string, itemId: string, quantity: number): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot ack item grant: not connected');
      return;
    }

    console.log('[WebSocket] 🎁✅ Acking item grant:', { characterId, itemId, quantity });
    this.socket.emit('item-grant-ack', { characterId, itemId, quantity });
  }

  toggleHighstorm(active: boolean): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot toggle highstorm: not connected');
      return;
    }

    console.log('[WebSocket] ⚡ Toggling highstorm:', { active });
    this.socket.emit('gm-toggle-highstorm', {
      active,
      timestamp: new Date().toISOString()
    });
  }

  // Combat event emissions
  startCombat(): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot start combat: not connected');
      return;
    }

    console.log('[WebSocket] ⚔️ Starting combat');
    this.socket.emit('gm-start-combat', {
      timestamp: new Date().toISOString()
    });
  }

  selectTurnSpeed(characterId: string, turnSpeed: 'fast' | 'slow'): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot select turn speed: not connected');
      return;
    }

    console.log('[WebSocket] 🔄 Selecting turn speed:', { characterId, turnSpeed });
    this.socket.emit('player-select-turn-speed', {
      characterId,
      turnSpeed,
      timestamp: new Date().toISOString()
    });
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
