import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { CombatService, TurnGroup } from '../../services/combat.service';
import { WebsocketService } from '../../services/websocket.service';
import { CombatPhase, CombatParticipant } from '../../../../shared/types/websocket-events';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

const PHASE_LABELS: Record<CombatPhase, string> = {
  fastPC: '⚡ Fast PC Turns (2 Actions)',
  fastNPC: '⚡ Fast NPC Turns (2 Actions)',
  slowPC: '📋 Slow PC Turns (3 Actions)',
  slowNPC: '📋 Slow NPC Turns (3 Actions)'
};

const PHASE_ORDER: CombatPhase[] = ['fastPC', 'fastNPC', 'slowPC', 'slowNPC'];

@Component({
  selector: 'app-combat-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatInputModule,
    MatDividerModule,
    MatIconModule,
    MatBadgeModule
  ],
  template: `
    <mat-card class="combat-panel">
      <mat-card-header>
        <mat-card-title>
          ⚔️ Combat Control Panel
          <mat-slide-toggle
            [(ngModel)]="isCombatActive"
            (change)="toggleCombat(isCombatActive)"
            class="combat-toggle"
          >
            {{ isCombatActive ? 'COMBAT ACTIVE' : 'Combat Off' }}
          </mat-slide-toggle>
        </mat-card-title>
      </mat-card-header>

      <mat-card-content>
        <!-- NPC Management Section -->
        <div class="npc-management-section" *ngIf="isCombatActive && !roundsStarted">
          <h3>🧌 Add Opponents</h3>
          <mat-divider></mat-divider>

          <div class="npc-form">
            <mat-form-field class="full-width">
              <mat-label>Opponent Type</mat-label>
              <input
                matInput
                [(ngModel)]="npcName"
                placeholder="e.g., Goblin Scout, Orc Warrior"
                data-testid="npc-name-input"
              />
            </mat-form-field>

            <mat-form-field class="count-field">
              <mat-label>Count</mat-label>
              <input
                matInput
                type="number"
                [(ngModel)]="npcCount"
                min="1"
                data-testid="npc-count-input"
              />
            </mat-form-field>

            <button
              mat-raised-button
              color="primary"
              (click)="addNPCCard()"
              data-testid="add-npc-button"
            >
              <mat-icon>add</mat-icon>
              Add
            </button>
          </div>

          <!-- NPC Cards List -->
          <div *ngIf="getNPCCards().length > 0" class="npc-cards-list">
            <div *ngFor="let npc of getNPCCards()" class="npc-card">
              <div class="npc-header">
                <span class="npc-name">{{ npc.name }}</span>
                <span class="npc-count" matBadge="{{ npc.count }}" matBadgeColor="accent">
                  enemies
                </span>
              </div>

              <div class="npc-controls">
                <button
                  mat-mini-fab
                  [color]="getNPCTurnSpeed(npc.id) === 'fast' ? 'primary' : ''"
                  (click)="setNPCTurnSpeed(npc.id, 'fast')"
                  [attr.data-testid]="'npc-fast-' + npc.id"
                  title="Fast Turn (2 actions)"
                >
                  <mat-icon>lightning_bolt</mat-icon>
                </button>

                <button
                  mat-mini-fab
                  [color]="getNPCTurnSpeed(npc.id) === 'slow' ? 'accent' : ''"
                  (click)="setNPCTurnSpeed(npc.id, 'slow')"
                  [attr.data-testid]="'npc-slow-' + npc.id"
                  title="Slow Turn (3 actions)"
                >
                  <mat-icon>schedule</mat-icon>
                </button>

                <mat-form-field class="count-update-field">
                  <mat-label>Update Count</mat-label>
                  <input
                    matInput
                    type="number"
                    [value]="npc.count"
                    (change)="updateNPCCardCount(npc.id, $event)"
                    [attr.data-testid]="'npc-count-' + npc.id"
                  />
                </mat-form-field>

                <button
                  mat-icon-button
                  color="warn"
                  (click)="removeNPCCard(npc.id)"
                  [attr.data-testid]="'remove-npc-' + npc.id"
                >
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </div>

        <mat-divider *ngIf="isCombatActive"></mat-divider>

        <!-- Pre-Rounds: Turn Order Display + Begin Rounds Button -->
        <div *ngIf="isCombatActive && !roundsStarted" class="turn-order-section">
          <h3>📋 Turn Order</h3>
          <mat-divider></mat-divider>

          <div *ngIf="getTurnGroups().fastPC.length > 0" class="turn-group">
            <h4 class="group-header">⚡ Fast PC Turns (2 Actions)</h4>
            <div class="group-content">
              <span *ngFor="let pid of getTurnGroups().fastPC" class="player-badge">
                {{ getPlayerName(pid) }}
              </span>
            </div>
          </div>

          <div *ngIf="getTurnGroups().fastNPC.length > 0" class="turn-group">
            <h4 class="group-header">⚡ Fast NPC Turns (2 Actions)</h4>
            <div class="group-content">
              <span *ngFor="let npcId of getTurnGroups().fastNPC" class="npc-badge">
                {{ getNPCName(npcId) }}
              </span>
            </div>
          </div>

          <div *ngIf="getTurnGroups().slowPC.length > 0" class="turn-group">
            <h4 class="group-header">📋 Slow PC Turns (3 Actions)</h4>
            <div class="group-content">
              <span *ngFor="let pid of getTurnGroups().slowPC" class="player-badge">
                {{ getPlayerName(pid) }}
              </span>
            </div>
          </div>

          <div *ngIf="getTurnGroups().slowNPC.length > 0" class="turn-group">
            <h4 class="group-header">📋 Slow NPC Turns (3 Actions)</h4>
            <div class="group-content">
              <span *ngFor="let npcId of getTurnGroups().slowNPC" class="npc-badge">
                {{ getNPCName(npcId) }}
              </span>
            </div>
          </div>

          <div *ngIf="getTurnGroups().uninitialized.length > 0" class="turn-group uninitialized">
            <h4 class="group-header">⏳ Awaiting Selection</h4>
            <div class="group-content">
              <span *ngFor="let pid of getTurnGroups().uninitialized" class="player-badge awaiting">
                {{ getPlayerName(pid) }}
              </span>
            </div>
          </div>

          <!-- Begin Rounds Button -->
          <button
            *ngIf="canBeginRounds()"
            mat-raised-button
            color="accent"
            (click)="beginRounds()"
            class="begin-rounds-button"
            data-testid="begin-rounds-button"
          >
            <mat-icon>play_arrow</mat-icon>
            Begin Rounds
          </button>
        </div>

        <!-- Active Rounds: Turn Tracker -->
        <div *ngIf="isCombatActive && roundsStarted" class="turn-tracker-section">
          <div class="round-header">
            <h3>🎯 Round {{ currentRound }}</h3>
            <span class="phase-label">{{ getPhaseLabel(currentPhase) }}</span>
          </div>
          <mat-divider></mat-divider>

          <!-- Phase groups -->
          <ng-container *ngFor="let phase of phaseOrder">
            <div
              class="turn-group"
              [class.active-phase]="phase === currentPhase"
              [class.completed-phase]="isPhaseCompleted(phase)"
              [class.upcoming-phase]="isPhaseUpcoming(phase)"
              *ngIf="getParticipantsForPhase(phase).length > 0"
            >
              <h4 class="group-header">
                <span *ngIf="phase === currentPhase">▶ </span>
                <span *ngIf="isPhaseCompleted(phase)">✅ </span>
                {{ getPhaseLabel(phase) }}
              </h4>

              <!-- Current phase: show individual participants -->
              <div *ngIf="phase === currentPhase" class="group-content participants-list">
                <div
                  *ngFor="let p of getParticipantsForPhase(phase)"
                  class="participant-row"
                  [class.participant-active]="combatService.isParticipantActive(p.id)"
                  [class.participant-complete]="combatService.isParticipantComplete(p.id)"
                  [class.participant-pc]="p.type === 'pc'"
                  [class.participant-npc]="p.type === 'npc'"
                >
                  <span class="participant-name">
                    <mat-icon *ngIf="combatService.isParticipantComplete(p.id)" class="done-icon">check_circle</mat-icon>
                    <mat-icon *ngIf="combatService.isParticipantActive(p.id)" class="active-icon">arrow_right</mat-icon>
                    {{ p.name }}
                  </span>
                  <div class="participant-actions" *ngIf="!combatService.isParticipantComplete(p.id)">
                    <button
                      *ngIf="!combatService.isParticipantActive(p.id)"
                      mat-stroked-button
                      (click)="activateTurn(p.id)"
                      class="activate-btn"
                    >
                      Start Turn
                    </button>
                    <button
                      *ngIf="combatService.isParticipantActive(p.id)"
                      mat-raised-button
                      color="primary"
                      (click)="completeTurn(p.id)"
                      class="complete-btn"
                    >
                      <mat-icon>done</mat-icon>
                      Done
                    </button>
                  </div>
                </div>
              </div>

              <!-- Other phases: show summary badges -->
              <div *ngIf="phase !== currentPhase" class="group-content">
                <span
                  *ngFor="let p of getParticipantsForPhase(phase)"
                  [class.player-badge]="p.type === 'pc'"
                  [class.npc-badge]="p.type === 'npc'"
                  [class.badge-dimmed]="isPhaseCompleted(phase)"
                >
                  {{ p.name }}
                </span>
              </div>
            </div>
          </ng-container>
        </div>

        <!-- End Combat Button -->
        <button
          *ngIf="isCombatActive"
          mat-raised-button
          color="warn"
          (click)="endCombat()"
          class="end-combat-button"
        >
          <mat-icon>close</mat-icon>
          End Combat
        </button>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .combat-panel {
      margin: 20px;
      max-width: 600px;
      background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(20, 20, 40, 0.9) 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #e8e8e8;
    }

    mat-card-header {
      margin-bottom: 20px;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 20px;
      margin: 0;
      color: #e8e8e8;
    }

    .combat-toggle {
      margin-left: 16px;
    }

    .npc-management-section h3 {
      margin-top: 20px;
      margin-bottom: 12px;
      font-size: 18px;
      color: #e8e8e8;
    }

    .npc-form {
      display: flex;
      gap: 12px;
      margin: 16px 0;
      align-items: flex-end;
    }

    .full-width {
      flex: 1;
    }

    .count-field {
      width: 100px;
    }

    .npc-cards-list {
      margin: 16px 0;
    }

    .npc-card {
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 12px;
      background-color: rgba(255, 255, 255, 0.06);
    }

    .npc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .npc-name {
      font-weight: bold;
      font-size: 16px;
      color: #e8e8e8;
    }

    .npc-count {
      font-size: 14px;
      color: #c0c0c0;
    }

    .npc-controls {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    .count-update-field {
      width: 80px;
    }

    .turn-order-section {
      margin-top: 20px;
    }

    .turn-order-section h3 {
      margin: 20px 0 12px 0;
      font-size: 18px;
      color: #e8e8e8;
    }

    .turn-group {
      margin: 16px 0;
      padding: 12px;
      border-left: 4px solid #5c6bc0;
      background-color: rgba(63, 81, 181, 0.15);
      border-radius: 4px;
      transition: all 0.3s ease;
    }

    .turn-group.uninitialized {
      border-left-color: #ff9800;
      background-color: rgba(255, 152, 0, 0.12);
    }

    .turn-group.active-phase {
      border-left-color: #4caf50;
      background-color: rgba(76, 175, 80, 0.15);
      border-left-width: 6px;
    }

    .turn-group.completed-phase {
      border-left-color: #616161;
      background-color: rgba(97, 97, 97, 0.1);
      opacity: 0.6;
    }

    .turn-group.upcoming-phase {
      opacity: 0.5;
    }

    .group-header {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      color: #c0c0c0;
    }

    .group-content {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .player-badge {
      display: inline-block;
      padding: 6px 12px;
      background-color: #3f51b5;
      color: white;
      border-radius: 12px;
      font-size: 12px;
    }

    .npc-badge {
      display: inline-block;
      padding: 6px 12px;
      background-color: #d32f2f;
      color: white;
      border-radius: 12px;
      font-size: 12px;
    }

    .badge-dimmed {
      opacity: 0.5;
    }

    .player-badge.awaiting {
      background-color: #ff9800;
    }

    /* Round header */
    .round-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 16px 0 8px 0;
    }

    .round-header h3 {
      margin: 0;
      font-size: 22px;
      color: #4caf50;
    }

    .phase-label {
      font-size: 14px;
      color: #aaa;
      font-weight: 500;
    }

    /* Turn tracker */
    .turn-tracker-section {
      margin-top: 12px;
    }

    .participants-list {
      flex-direction: column;
      gap: 6px;
    }

    .participant-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      border-radius: 6px;
      background-color: rgba(255, 255, 255, 0.05);
      transition: all 0.3s ease;
    }

    .participant-row.participant-active {
      background-color: rgba(76, 175, 80, 0.25);
      border: 1px solid rgba(76, 175, 80, 0.5);
      box-shadow: 0 0 12px rgba(76, 175, 80, 0.3);
    }

    .participant-row.participant-complete {
      opacity: 0.5;
      background-color: rgba(255, 255, 255, 0.02);
    }

    .participant-name {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 500;
    }

    .participant-row.participant-pc .participant-name {
      color: #7986cb;
    }

    .participant-row.participant-npc .participant-name {
      color: #ef9a9a;
    }

    .participant-row.participant-active .participant-name {
      color: #a5d6a7;
    }

    .done-icon {
      color: #616161;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .active-icon {
      color: #4caf50;
      font-size: 20px;
      width: 20px;
      height: 20px;
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .participant-actions {
      display: flex;
      gap: 6px;
    }

    .activate-btn {
      font-size: 12px;
      line-height: 28px;
      padding: 0 12px;
      color: #e8e8e8;
      border-color: rgba(255, 255, 255, 0.3);
    }

    .complete-btn {
      font-size: 12px;
      line-height: 28px;
      padding: 0 12px;
    }

    .begin-rounds-button {
      width: 100%;
      margin-top: 16px;
      font-size: 16px;
      padding: 8px;
    }

    .end-combat-button {
      width: 100%;
      margin-top: 20px;
    }

    ::ng-deep .combat-panel .mat-mdc-text-field-wrapper {
      background-color: rgba(255, 255, 255, 0.06);
    }

    ::ng-deep .combat-panel .mat-mdc-form-field .mdc-text-field--filled:not(.mdc-text-field--disabled) {
      background-color: rgba(255, 255, 255, 0.06);
    }

    ::ng-deep .combat-panel .mat-mdc-input-element {
      color: #e8e8e8 !important;
    }

    ::ng-deep .combat-panel .mat-mdc-form-field .mat-mdc-floating-label {
      color: rgba(255, 255, 255, 0.6);
    }

    ::ng-deep .combat-panel mat-divider {
      border-top-color: rgba(255, 255, 255, 0.12);
    }
  `]
})
export class CombatPanelComponent implements OnInit, OnDestroy {
  @Input() activePlayers: Map<string, any> = new Map();

  isCombatActive = false;
  npcName = '';
  npcCount = 1;

  // Turn tracker state
  roundsStarted = false;
  currentRound = 1;
  currentPhase: CombatPhase = 'fastPC';
  phaseOrder = PHASE_ORDER;

  private destroy$ = new Subject<void>();
  private playerList: Map<string, string> = new Map();

  constructor(
    public combatService: CombatService,
    private websocketService: WebsocketService
  ) {}

  ngOnInit(): void {
    this.combatService.combatActive$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isActive => {
        this.isCombatActive = isActive;
      });

    this.combatService.roundsStarted$
      .pipe(takeUntil(this.destroy$))
      .subscribe(started => {
        this.roundsStarted = started;
      });

    this.combatService.currentRound$
      .pipe(takeUntil(this.destroy$))
      .subscribe(round => {
        this.currentRound = round;
      });

    this.combatService.currentPhase$
      .pipe(takeUntil(this.destroy$))
      .subscribe(phase => {
        this.currentPhase = phase;
      });
  }

  toggleCombat(active: boolean): void {
    this.combatService.toggleCombat(active);
    if (active) {
      this.websocketService.startCombat();
    } else {
      this.endCombat();
    }
  }

  endCombat(): void {
    this.isCombatActive = false;
    this.combatService.clearCombatState();
    this.combatService.endCombat();
  }

  canBeginRounds(): boolean {
    const groups = this.getTurnGroups();
    const hasParticipants = groups.fastPC.length > 0 || groups.fastNPC.length > 0
      || groups.slowPC.length > 0 || groups.slowNPC.length > 0;
    return hasParticipants && groups.uninitialized.length === 0;
  }

  beginRounds(): void {
    const groups = this.getTurnGroups();

    const participants = {
      fastPC: groups.fastPC.map(id => ({ id, name: this.getPlayerName(id), type: 'pc' as const })),
      fastNPC: groups.fastNPC.map(id => ({ id, name: this.getNPCName(id), type: 'npc' as const })),
      slowPC: groups.slowPC.map(id => ({ id, name: this.getPlayerName(id), type: 'pc' as const })),
      slowNPC: groups.slowNPC.map(id => ({ id, name: this.getNPCName(id), type: 'npc' as const })),
    };

    this.combatService.beginRounds(participants);
  }

  activateTurn(participantId: string): void {
    this.combatService.setActiveTurn(participantId);
  }

  completeTurn(participantId: string): void {
    this.combatService.completeTurn(participantId);
  }

  getPhaseLabel(phase: CombatPhase): string {
    return PHASE_LABELS[phase];
  }

  getParticipantsForPhase(phase: CombatPhase): CombatParticipant[] {
    return this.combatService.participants?.[phase] || [];
  }

  isPhaseCompleted(phase: CombatPhase): boolean {
    const phaseIndex = PHASE_ORDER.indexOf(phase);
    const currentIndex = PHASE_ORDER.indexOf(this.currentPhase);
    return phaseIndex < currentIndex;
  }

  isPhaseUpcoming(phase: CombatPhase): boolean {
    const phaseIndex = PHASE_ORDER.indexOf(phase);
    const currentIndex = PHASE_ORDER.indexOf(this.currentPhase);
    return phaseIndex > currentIndex;
  }

  addNPCCard(): void {
    if (!this.npcName.trim()) {
      throw new Error('NPC name is required');
    }

    const npcId = `npc_${Date.now()}`;
    this.combatService.addNPCCard(npcId, this.npcName, this.npcCount);

    this.npcName = '';
    this.npcCount = 1;
  }

  removeNPCCard(npcId: string): void {
    this.combatService.removeNPCCard(npcId);
  }

  updateNPCCardCount(npcId: string, eventOrCount: any): void {
    const rawValue = typeof eventOrCount === 'number'
      ? eventOrCount
      : eventOrCount?.target?.value ?? eventOrCount;
    const newCount = parseInt(rawValue, 10);
    if (newCount > 0) {
      this.combatService.updateNPCCardCount(npcId, newCount);
    }
  }

  setNPCTurnSpeed(npcId: string, speed: 'fast' | 'slow'): void {
    this.combatService.setNPCTurnSpeed(npcId, speed);
  }

  getNPCCards() {
    return this.combatService.getNPCCards();
  }

  getNPCCard(npcId: string) {
    return this.combatService.getNPCCard(npcId);
  }

  getNPCTurnSpeed(npcId: string): 'fast' | 'slow' | null {
    return this.combatService.getNPCTurnSpeed(npcId);
  }

  getNPCName(npcId: string): string {
    const card = this.combatService.getNPCCard(npcId);
    return card?.name || 'Unknown';
  }

  getTurnGroups(): TurnGroup {
    return this.combatService.getTurnGroups();
  }

  registerPlayer(characterId: string): void {
    this.combatService.registerPlayer(characterId);
  }

  getPlayerName(characterId: string): string {
    // Check activePlayers input first
    if (this.activePlayers) {
      for (const [, player] of this.activePlayers) {
        if (player.characterId === characterId) {
          return player.name || characterId;
        }
      }
    }
    return this.playerList.get(characterId) || characterId;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
