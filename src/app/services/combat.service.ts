import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { WebsocketService } from './websocket.service';

export interface NPCCard {
  id: string;
  name: string;
  count: number;
}

export interface TurnGroup {
  fastPC: string[];
  fastNPC: string[];
  slowPC: string[];
  slowNPC: string[];
  uninitialized: string[];
}

export interface TurnSpeedChangeEvent {
  characterId: string;
  turnSpeed: 'fast' | 'slow';
}

@Injectable({
  providedIn: 'root'
})
export class CombatService {
  // Combat state
  private combatActiveSubject = new BehaviorSubject<boolean>(false);
  public combatActive$ = this.combatActiveSubject.asObservable();

  // Turn speed tracking for players
  private playerTurnSpeeds = new Map<string, 'fast' | 'slow'>();

  // Turn speed tracking for NPCs
  private npcTurnSpeeds = new Map<string, 'fast' | 'slow'>();

  // NPC card management
  private npcCards = new Map<string, NPCCard>();

  // Event streams
  private turnSpeedChangedSubject = new Subject<TurnSpeedChangeEvent>();
  public turnSpeedChanged$ = this.turnSpeedChangedSubject.asObservable();

  private npcCardAddedSubject = new Subject<NPCCard>();
  public npcCardAdded$ = this.npcCardAddedSubject.asObservable();

  private npcCardRemovedSubject = new Subject<string>();
  public npcCardRemoved$ = this.npcCardRemovedSubject.asObservable();

  constructor(private websocketService: WebsocketService) {
    // Listen for turn speed selections from other players (via WebSocket)
    this.websocketService.turnSpeedSelection$.subscribe(event => {
      // Update local state when we receive a turn speed selection from the server
      // This ensures GM sees all players' selections in real-time
      this.setTurnSpeed(event.characterId, event.turnSpeed);
    });
  }

  // Combat Toggle
  toggleCombat(active: boolean): void {
    this.combatActiveSubject.next(active);
  }

  isCombatActive(): boolean {
    return this.combatActiveSubject.value;
  }

  // Turn Speed Management
  setTurnSpeed(characterId: string, turnSpeed: 'fast' | 'slow'): void {
    const currentSpeed = this.playerTurnSpeeds.get(characterId);
    
    // Only emit if speed is actually changing
    if (currentSpeed !== turnSpeed) {
      this.playerTurnSpeeds.set(characterId, turnSpeed);
      this.turnSpeedChangedSubject.next({
        characterId,
        turnSpeed
      });
    }
  }

  getTurnSpeed(characterId: string): 'fast' | 'slow' | null {
    return this.playerTurnSpeeds.get(characterId) || null;
  }

  clearTurnSpeed(characterId: string): void {
    this.playerTurnSpeeds.delete(characterId);
  }

  // NPC Card Management
  addNPCCard(id: string, name: string, count: number): void {
    if (this.npcCards.has(id)) {
      throw new Error(`NPC card with id ${id} already exists`);
    }

    const npcCard: NPCCard = { id, name, count };
    this.npcCards.set(id, npcCard);
    this.npcCardAddedSubject.next(npcCard);
  }

  removeNPCCard(id: string): void {
    this.npcCards.delete(id);
    this.npcTurnSpeeds.delete(id);
    this.npcCardRemovedSubject.next(id);
  }

  getNPCCard(id: string): NPCCard | undefined {
    return this.npcCards.get(id);
  }

  getNPCCards(): NPCCard[] {
    return Array.from(this.npcCards.values());
  }

  updateNPCCardCount(id: string, count: number): void {
    const card = this.npcCards.get(id);
    if (card) {
      card.count = count;
    }
  }

  // NPC Turn Speed
  setNPCTurnSpeed(npcId: string, turnSpeed: 'fast' | 'slow'): void {
    this.npcTurnSpeeds.set(npcId, turnSpeed);
  }

  getNPCTurnSpeed(npcId: string): 'fast' | 'slow' | null {
    return this.npcTurnSpeeds.get(npcId) || null;
  }

  // Turn Groups Organization
  getTurnGroups(): TurnGroup {
    const groups: TurnGroup = {
      fastPC: [],
      fastNPC: [],
      slowPC: [],
      slowNPC: [],
      uninitialized: []
    };

    // Organize players
    for (const [characterId, turnSpeed] of this.playerTurnSpeeds) {
      if (turnSpeed === 'fast') {
        groups.fastPC.push(characterId);
      } else {
        groups.slowPC.push(characterId);
      }
    }

    // Organize NPCs
    for (const [npcId, card] of this.npcCards) {
      const turnSpeed = this.npcTurnSpeeds.get(npcId);
      if (turnSpeed === 'fast') {
        groups.fastNPC.push(npcId);
      } else if (turnSpeed === 'slow') {
        groups.slowNPC.push(npcId);
      }
    }

    return groups;
  }

  // Clear all combat state
  clearCombatState(): void {
    this.combatActiveSubject.next(false);
    this.playerTurnSpeeds.clear();
    this.npcTurnSpeeds.clear();
    this.npcCards.clear();
  }

  // Register player for combat (for tracking uninitialized players)
  registerPlayer(characterId: string): void {
    if (!this.playerTurnSpeeds.has(characterId)) {
      // Player exists but hasn't selected a turn speed yet
    }
  }

  getUninitializedPlayers(allPlayerIds: string[]): string[] {
    return allPlayerIds.filter(id => !this.playerTurnSpeeds.has(id));
  }
}
