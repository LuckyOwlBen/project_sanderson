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

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
