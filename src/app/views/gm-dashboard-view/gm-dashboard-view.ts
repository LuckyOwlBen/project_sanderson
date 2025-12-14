import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { Subject, takeUntil } from 'rxjs';
import { WebsocketService, PlayerJoinedEvent } from '../../services/websocket.service';
import { RADIANT_ORDERS } from '../../character/radiantPath/radiantPathManager';
import { SprenGrantDialogComponent } from './spren-grant-dialog.component';
import { ItemGrantDialogComponent } from './item-grant-dialog.component';

@Component({
  selector: 'app-gm-dashboard-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressBarModule,
    MatBadgeModule,
    MatDialogModule,
    MatListModule
  ],
  templateUrl: './gm-dashboard-view.html',
  styleUrl: './gm-dashboard-view.scss',
})
export class GmDashboardView implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  activePlayers = new Map<string, PlayerJoinedEvent>();
  isConnected = false;
  criticalPlayers = new Set<string>(); // Characters at 0 health
  storeEnabled = new Map<string, boolean>([
    ['main-store', true],
    ['weapons-shop', true],
    ['armor-shop', true]
  ]);

  constructor(
    private websocketService: WebsocketService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Subscribe to connection status FIRST before connecting
    this.websocketService.connected$
      .pipe(takeUntil(this.destroy$))
      .subscribe(connected => {
        console.log('[GM Dashboard] Connection status changed:', connected);
        this.isConnected = connected;
        // Manually trigger change detection to update UI immediately
        this.cdr.detectChanges();
        if (connected) {
          // Request current active players when connected
          console.log('[GM Dashboard] Requesting active players');
          this.websocketService.requestActivePlayers();
        }
      });

    // Connect to WebSocket after subscriptions are set up
    this.websocketService.connect();

    // Subscribe to player joined events
    this.websocketService.playerJoined$
      .pipe(takeUntil(this.destroy$))
      .subscribe(player => {
        this.activePlayers.set(player.characterId, player);
        this.checkCriticalHealth(player);
        this.cdr.detectChanges();
      });

    // Subscribe to player left events
    this.websocketService.playerLeft$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        this.activePlayers.delete(event.characterId);
        this.criticalPlayers.delete(event.characterId);
        this.cdr.detectChanges();
      });

    // Subscribe to resource updates
    this.websocketService.playerResourceUpdate$
      .pipe(takeUntil(this.destroy$))
      .subscribe(update => {
        const player = this.activePlayers.get(update.characterId);
        if (player) {
          player.health = update.health;
          player.focus = update.focus;
          player.investiture = update.investiture;
          this.checkCriticalHealth(player);
          this.cdr.detectChanges();
        }
      });

    // Subscribe to active players list
    this.websocketService.activePlayers$
      .pipe(takeUntil(this.destroy$))
      .subscribe(players => {
        this.activePlayers.clear();
        players.forEach(player => {
          this.activePlayers.set(player.characterId, player);
          this.checkCriticalHealth(player);
        });
        this.cdr.detectChanges();
      });

    // Subscribe to critical alerts
    this.websocketService.playerCritical$
      .pipe(takeUntil(this.destroy$))
      .subscribe(alert => {
        console.log('[GM Dashboard] CRITICAL ALERT:', alert.message);
        this.criticalPlayers.add(alert.characterId);
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Don't disconnect - allow GM to reconnect without kicking players
  }

  getActivePlayersArray(): PlayerJoinedEvent[] {
    return Array.from(this.activePlayers.values())
      .sort((a, b) => {
        // Sort critical players first
        const aCritical = this.criticalPlayers.has(a.characterId);
        const bCritical = this.criticalPlayers.has(b.characterId);
        if (aCritical && !bCritical) return -1;
        if (!aCritical && bCritical) return 1;
        return a.name.localeCompare(b.name);
      });
  }

  isCritical(characterId: string): boolean {
    return this.criticalPlayers.has(characterId);
  }

  getHealthPercentage(player: PlayerJoinedEvent): number {
    if (!player.health || player.health.max === 0) return 0;
    return (player.health.current / player.health.max) * 100;
  }

  getFocusPercentage(player: PlayerJoinedEvent): number {
    if (!player.focus || player.focus.max === 0) return 0;
    return (player.focus.current / player.focus.max) * 100;
  }

  getInvestiturePercentage(player: PlayerJoinedEvent): number {
    if (!player.investiture || player.investiture.max === 0) return 0;
    return (player.investiture.current / player.investiture.max) * 100;
  }

  getHealthColor(player: PlayerJoinedEvent): string {
    const percentage = this.getHealthPercentage(player);
    if (percentage === 0) return 'warn';
    if (percentage <= 25) return 'warn';
    if (percentage <= 50) return 'accent';
    return 'primary';
  }

  private checkCriticalHealth(player: PlayerJoinedEvent): void {
    if (player.health && player.health.current === 0) {
      this.criticalPlayers.add(player.characterId);
    } else {
      this.criticalPlayers.delete(player.characterId);
    }
  }

  clearCriticalAlert(characterId: string): void {
    this.criticalPlayers.delete(characterId);
  }

  openSprenGrantDialog(player: PlayerJoinedEvent): void {
    const dialogRef = this.dialog.open(SprenGrantDialogComponent, {
      width: '600px',
      maxHeight: '90vh',
      data: { player }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // result contains: { order: string, orderInfo: RadiantOrderInfo }
        this.websocketService.grantSpren(player.characterId, result.order, result.orderInfo);
      }
    });
  }

  openItemGrantDialog(player: PlayerJoinedEvent): void {
    const dialogRef = this.dialog.open(ItemGrantDialogComponent, {
      width: '700px',
      maxHeight: '90vh',
      data: { player }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('[GM Dashboard] Granting item:', result);
        this.websocketService.grantItem(
          player.characterId,
          result.itemId,
          result.quantity
        );
      }
    });
  }

  toggleStore(storeId: string): void {
    const currentState = this.storeEnabled.get(storeId) ?? true;
    const newState = !currentState;
    this.storeEnabled.set(storeId, newState);
    this.websocketService.toggleStore(storeId, newState);
    console.log(`[GM Dashboard] Store ${storeId} ${newState ? 'opened' : 'closed'}`);
  }

  isStoreEnabled(storeId: string): boolean {
    return this.storeEnabled.get(storeId) ?? true;
  }
}
