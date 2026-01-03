import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { Ancestry } from '../character/ancestry/ancestry';

export interface PlayerJoinedEvent {
  characterId: string;
  name: string;
  level: number;
  ancestry: Ancestry | null;
  health: { current: number; max: number };
  focus: { current: number; max: number };
  investiture: { current: number; max: number };
  joinedAt: string;
  socketId: string;
}

export interface PlayerLeftEvent {
  characterId: string;
  socketId: string;
}

export interface PlayerResourceUpdateEvent {
  characterId: string;
  socketId: string;
  health: { current: number; max: number };
  focus: { current: number; max: number };
  investiture: { current: number; max: number };
}

export interface PlayerCriticalEvent {
  characterId: string;
  playerName: string;
  message: string;
}

export interface SprenGrantEvent {
  characterId: string;
  order: string;
  sprenType: string;
  surgePair: [string, string];
  philosophy: string;
}

export interface ItemTransaction {
  itemId: string;
  quantity: number;
  price: number;
  type: 'buy' | 'sell';
}

export interface StoreTransactionEvent {
  storeId: string;
  characterId: string;
  items: ItemTransaction[];
  totalCost: number;
  timestamp: string;
}

export interface ItemGrantEvent {
  characterId: string;
  itemId: string;
  quantity: number;
  grantedBy: string;
  timestamp: string;
}

export interface StoreToggleEvent {
  storeId: string;
  enabled: boolean;
  toggledBy: string;
}

export interface ExpertiseGrantEvent {
  characterId: string;
  expertiseName: string;
  grantedBy: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebsocketService implements OnDestroy {
  private socket: Socket | null = null;
  private serverUrl = 'http://localhost:3000'; // Will use same host in production

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

  constructor() {
    // Determine server URL based on current location
    if (typeof window !== 'undefined') {
      // In development (port 4200), connect to backend at port 3000
      // In production (port 3000), connect to same port
      const isDevelopment = window.location.port === '4200';
      const port = isDevelopment ? '3000' : (window.location.port || '3000');
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

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
