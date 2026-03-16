import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Character } from '../../../character/character';

@Component({
  selector: 'app-character-derived-stats-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './character-derived-stats-card.html',
  styleUrl: './character-derived-stats-card.scss',
})
export class CharacterDerivedStatsCard {
  @Input() character: Character | null = null;

  getMovementSpeed(): string {
    if (!this.character) return '—';
    return this.character.derivedAttributes.getMovementSpeed(this.character.attributes) + ' feet';
  }

  getRecoveryDie(): string {
    if (!this.character) return '—';
    return this.character.derivedAttributes.getRecoveryDie(this.character.attributes);
  }

  getSensesRange(): string {
    if (!this.character) return '—';
    const range = this.character.derivedAttributes.getSensesRange(this.character.attributes);
    return range === Infinity ? 'Unlimited' : range + ' feet';
  }

  getLiftingCapacity(): string {
    if (!this.character) return '—';
    return this.character.derivedAttributes.getLiftingCapacity(this.character.attributes).toLocaleString() + ' lbs';
  }

  getCarryingCapacity(): string {
    if (!this.character) return '—';
    return this.character.derivedAttributes.getCarryingCapacity(this.character.attributes).toLocaleString() + ' lbs';
  }
}
