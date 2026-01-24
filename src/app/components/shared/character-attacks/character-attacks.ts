import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Character } from '../../../character/character';
import { Attack } from '../../../character/attacks/attackInterfaces';

@Component({
  selector: 'app-character-attacks',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule
  ],
  templateUrl: './character-attacks.html',
  styleUrl: './character-attacks.scss',
})
export class CharacterAttacksComponent {
  @Input() character: Character | null = null;

  /**
   * Get all available attacks grouped by type
   */
  getAttacks(): { melee: Attack[], ranged: Attack[], special: Attack[] } {
    const attacks = this.character?.getAvailableAttacks() || [];
    
    return {
      melee: attacks.filter(a => a.range === 'Melee'),
      ranged: attacks.filter(a => a.range.includes('Ranged')),
      special: attacks.filter(a => a.range !== 'Melee' && !a.range.includes('Ranged'))
    };
  }

  /**
   * Format attack bonus with + sign
   */
  formatBonus(bonus: number): string {
    return bonus >= 0 ? `+${bonus}` : `${bonus}`;
  }

  /**
   * Get icon for attack source
   */
  getSourceIcon(source: string): string {
    switch (source) {
      case 'weapon': return '⚔️';
      case 'talent': return '✨';
      case 'combined': return '💥';
      default: return '⚔️';
    }
  }

  /**
   * Get defense color
   */
  getDefenseClass(defense: string): string {
    switch (defense.toLowerCase()) {
      case 'physical': return 'defense-physical';
      case 'cognitive': return 'defense-cognitive';
      case 'spiritual': return 'defense-spiritual';
      default: return '';
    }
  }

  /**
   * Get damage type icon/color
   */
  getDamageTypeClass(damageType: string): string {
    switch (damageType.toLowerCase()) {
      case 'keen': return 'damage-keen';
      case 'impact': return 'damage-impact';
      case 'energy': return 'damage-energy';
      case 'vital': return 'damage-vital';
      case 'spirit': return 'damage-spirit';
      default: return '';
    }
  }
}
