import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Character } from '../../../character/character';
import { Stance } from '../../../character/attacks/attackInterfaces';

/**
 * Stance Selector Component
 * 
 * Provides a dropdown menu to select the active combat stance.
 * Displays available stances with "None" option to deactivate.
 * Shows stance bonuses and advantages in expandable descriptions.
 */
@Component({
  selector: 'app-stance-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule
  ],
  templateUrl: './stance-selector.html',
  styleUrl: './stance-selector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StanceSelectorComponent implements OnChanges {
  @Input() character: Character | null = null;
  @Output() stanceChanged = new EventEmitter<string | null>();

  // Memoized values to prevent expensive repeated calculations
  private cachedAvailableStances: Stance[] = [];
  private cachedActiveStanceId: string | null = null;
  private cachedActiveStance: Stance | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['character']) {
      // Invalidate cache when character changes
      this.invalidateCache();
      this.cdr.markForCheck();
    }
  }

  /**
   * Invalidate cached values when character changes
   */
  private invalidateCache(): void {
    this.cachedAvailableStances = [];
    this.cachedActiveStanceId = null;
    this.cachedActiveStance = null;
  }

  /**
   * Get all available stances for the character (memoized)
   */
  getAvailableStances(): Stance[] {
    if (this.cachedAvailableStances.length === 0 && this.character) {
      this.cachedAvailableStances = this.character.getAvailableStances() || [];
    }
    return this.cachedAvailableStances;
  }

  /**
   * Get the currently active stance ID (memoized)
   */
  getActiveStanceId(): string | null {
    if (this.cachedActiveStanceId === null && this.character?.activeStanceId) {
      this.cachedActiveStanceId = this.character.activeStanceId;
    }
    return this.cachedActiveStanceId;
  }

  /**
   * Get the currently active stance object (memoized)
   */
  getActiveStance(): Stance | null {
    if (this.cachedActiveStance === null && this.character?.activeStanceId) {
      this.cachedActiveStance = this.character.getActiveStance() || null;
    }
    return this.cachedActiveStance;
  }

  /**
   * Handle stance selection change
   */
  onStanceSelected(stanceId: string | null): void {
    if (this.character) {
      const success = this.character.setActiveStance(stanceId);
      if (success) {
        this.stanceChanged.emit(stanceId);
      }
    }
  }

  /**
   * Format stance display with activation cost
   */
  formatStanceLabel(stance: Stance): string {
    return `${stance.name} (${stance.activationCost} action${stance.activationCost > 1 ? 's' : ''})`;
  }

  /**
   * Check if a stance has bonuses
   */
  hasStanceBonuses(stance: Stance): boolean {
    return !!(stance.bonuses && stance.bonuses.length > 0);
  }

  /**
   * Check if a stance grants advantages
   */
  hasStanceAdvantages(stance: Stance): boolean {
    return !!(stance.grantsAdvantage && stance.grantsAdvantage.length > 0);
  }

  /**
   * Format bonus description for display
   */
  formatBonusDescription(description: string): string {
    // Format "deflect: all +1" to "Deflect: all +1"
    if (!description) return '';
    const parts = description.split(':');
    if (parts.length > 1) {
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1) + ':' + parts.slice(1).join(':');
    }
    return description;
  }
}
