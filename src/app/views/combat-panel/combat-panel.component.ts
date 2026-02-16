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
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
        <div class="npc-management-section" *ngIf="isCombatActive">
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

        <!-- Turn Order Display -->
        <div *ngIf="isCombatActive" class="turn-order-section">
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
        </div>

        <!-- End Combat Button -->
        <button
          *ngIf="isCombatActive"
          mat-raised-button
          color="warn"
          (click)="toggleCombat(false)"
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
    }

    .combat-toggle {
      margin-left: 16px;
    }

    .npc-management-section h3 {
      margin-top: 20px;
      margin-bottom: 12px;
      font-size: 18px;
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
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 12px;
      background-color: #f5f5f5;
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
    }

    .npc-count {
      font-size: 14px;
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
    }

    .turn-group {
      margin: 16px 0;
      padding: 12px;
      border-left: 4px solid #3f51b5;
      background-color: rgba(63, 81, 181, 0.05);
      border-radius: 4px;
    }

    .turn-group.uninitialized {
      border-left-color: #ff9800;
      background-color: rgba(255, 152, 0, 0.05);
    }

    .group-header {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
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

    .player-badge.awaiting {
      background-color: #ff9800;
    }

    .end-combat-button {
      width: 100%;
      margin-top: 20px;
    }
  `]
})
export class CombatPanelComponent implements OnInit, OnDestroy {
  @Input() activePlayers: Map<string, any> = new Map();

  isCombatActive = false;
  npcName = '';
  npcCount = 1;

  private destroy$ = new Subject<void>();
  private playerList: Map<string, string> = new Map();

  constructor(
    private combatService: CombatService,
    private websocketService: WebsocketService
  ) {}

  ngOnInit(): void {
    this.combatService.combatActive$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isActive => {
        this.isCombatActive = isActive;
      });
  }

  toggleCombat(active: boolean): void {
    this.combatService.toggleCombat(active);
    if (active) {
      this.websocketService.startCombat();
    } else {
      this.combatService.clearCombatState();
    }
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
    return this.playerList.get(characterId) || characterId;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
