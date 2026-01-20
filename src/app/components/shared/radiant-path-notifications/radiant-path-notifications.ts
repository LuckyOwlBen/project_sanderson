import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Character } from '../../../character/character';

@Component({
  selector: 'app-radiant-path-notifications',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './radiant-path-notifications.html',
  styleUrl: './radiant-path-notifications.scss',
})
export class RadiantPathNotifications implements OnInit, OnDestroy, OnChanges {
  @Input() character: Character | null = null;
  @Input() pendingSprenGrant: any = null;
  
  @Output() sprenAccepted = new EventEmitter<void>();
  @Output() sprenDismissed = new EventEmitter<void>();
  @Output() idealSpoken = new EventEmitter<void>();

  private autoDismissTimer: any = null;

  ngOnInit(): void {
    // Set up auto-dismiss timer when a spren grant appears
    if (this.pendingSprenGrant) {
      this.setupAutoDismiss();
    }
  }

  ngOnDestroy(): void {
    this.clearAutoDismiss();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Update timer when pendingSprenGrant changes
    if (changes['pendingSprenGrant'] && this.pendingSprenGrant) {
      this.setupAutoDismiss();
    } else {
      this.clearAutoDismiss();
    }
  }

  private setupAutoDismiss(): void {
    this.clearAutoDismiss();
    this.autoDismissTimer = setTimeout(() => {
      console.log('[Radiant Path] Auto-dismissing spren grant after 30 seconds');
      this.dismissSprenGrant();
    }, 30000); // 30 seconds
  }

  private clearAutoDismiss(): void {
    if (this.autoDismissTimer) {
      clearTimeout(this.autoDismissTimer);
      this.autoDismissTimer = null;
    }
  }

  acceptSprenGrant(): void {
    if (!this.character || !this.pendingSprenGrant) return;

    console.log('[Radiant Path] Accepting spren grant:', this.pendingSprenGrant);
    
    // Grant the spren to the character
    this.character.radiantPath.grantSpren(
      this.pendingSprenGrant.order
    );

    this.clearAutoDismiss();
    this.sprenAccepted.emit();
  }

  dismissSprenGrant(): void {
    this.clearAutoDismiss();
    this.sprenDismissed.emit();
  }

  speakFirstIdeal(): void {
    if (!this.character) return;

    console.log('[Radiant Path] Speaking First Ideal');
    
    // Speak the First Ideal - this unlocks surge skills and surge trees
    this.character.radiantPath.speakIdeal(this.character.skills);
    
    // Unlock investiture now that the character has both spren and spoken ideal
    this.character.unlockInvestiture();
    this.character.recalculateResources();

    this.idealSpoken.emit();
  }

  getSurgeNames(): string {
    if (!this.character) return '';
    
    const orderInfo = this.character.radiantPath.getOrderInfo();
    if (!orderInfo) return '';

    return orderInfo.surgePair.map(surge => 
      surge.toLowerCase().replace('_', ' ')
        .split(' ')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    ).join(' and ');
  }

  hasSpren(): boolean {
    return this.character?.radiantPath.hasSpren() ?? false;
  }

  hasSpokenIdeal(): boolean {
    return this.character?.radiantPath.hasSpokenIdeal() ?? false;
  }

  getOrderInfo() {
    return this.character?.radiantPath.getOrderInfo();
  }
}
