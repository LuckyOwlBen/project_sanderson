import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Character } from '../../../character/character';
import { BonusType } from '../../../character/bonuses/bonusModule';

@Component({
  selector: 'app-character-defenses-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './character-defenses-card.html',
  styleUrl: './character-defenses-card.scss',
})
export class CharacterDefensesCard {
  @Input() character: Character | null = null;

  getPhysicalDefense(): number {
    if (!this.character) return 0;
    const bonus = this.character.bonuses.bonuses.getBonusesFor(BonusType.DEFENSE, 'Physical');
    return this.character.defenses.getPhysicalDefense(this.character.attributes, bonus);
  }

  getCognitiveDefense(): number {
    if (!this.character) return 0;
    const bonus = this.character.bonuses.bonuses.getBonusesFor(BonusType.DEFENSE, 'Cognitive');
    return this.character.defenses.getCognitiveDefense(this.character.attributes, bonus);
  }

  getSpiritualDefense(): number {
    if (!this.character) return 0;
    const bonus = this.character.bonuses.bonuses.getBonusesFor(BonusType.DEFENSE, 'Spiritual');
    return this.character.defenses.getSpiritualDefense(this.character.attributes, bonus);
  }
}
