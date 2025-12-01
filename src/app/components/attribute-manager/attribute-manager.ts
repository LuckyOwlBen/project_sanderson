import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Character } from '../../character/character';
import { CharacterStateService } from '../../character/characterStateService';
import { LevelUpManager } from '../../levelup/levelUpManager';
import { AttributeAllocator } from '../attribute-allocator/attribute-allocator';
import { Attributes } from '../../character/attributes/attributes';

interface AttributeConfig {
  name: string;
  key: keyof Character['attributes'];
  currentValue: number;
}

@Component({
  selector: 'app-attribute-manager',
  standalone: true,
  imports: [CommonModule, AttributeAllocator],
  providers: [LevelUpManager],
  templateUrl: './attribute-manager.html',
  styleUrls: ['./attribute-manager.scss']
})
export class AttributeManager implements OnInit {
  character: Character | null = null;
  attributes: AttributeConfig[] = [];
  totalPoints: number = 12;
  pointsSpent: number = 0;
  remainingPoints: number = 0;
  movementSpeed: number = 0;
  recoveryDie: string = '';

  readonly MIN_ATTRIBUTE_VALUE = 0;
  readonly MAX_ATTRIBUTE_VALUE = 5;

  constructor(
    private characterStateService: CharacterStateService,
    private levelUpManager: LevelUpManager
  ) {}

  ngOnInit(): void {
    this.character = this.characterStateService.getCharacter();
    
    if (this.character) {
      this.initializeAttributes();
      this.calculatePoints();
    }
  }

  private initializeAttributes(): void {
    if (!this.character) return;

    this.attributes = [
      { name: 'Strength', key: 'strength', currentValue: this.character.attributes.strength },
      { name: 'Speed', key: 'speed', currentValue: this.character.attributes.speed },
      { name: 'Awareness', key: 'awareness', currentValue: this.character.attributes.awareness },
      { name: 'Intellect', key: 'intellect', currentValue: this.character.attributes.intellect },
      { name: 'Willpower', key: 'willpower', currentValue: this.character.attributes.willpower },
      { name: 'Presence', key: 'presence', currentValue: this.character.attributes.presence }
    ];
  }

  private updateDerivedAttributes(): void {
    if (!this.character) return;
    this.movementSpeed = this.character.derivedAttributes.getMovementSpeed(this.character.attributes);
    this.recoveryDie = this.character.derivedAttributes.getRecoveryDie(this.character.attributes);
  }

  private calculatePoints(): void {
    if (!this.character) return;

    // Get starting attribute points from level up manager
    // Assuming level 1 character creation
    const currentLevel = this.character.level || 1;
    this.totalPoints = this.levelUpManager.getAttributePointsForLevel(currentLevel);

    // Calculate points spent (assuming starting value is the minimum)
    this.pointsSpent = this.attributes.reduce((sum, attr) => {
      return sum + (attr.currentValue - this.MIN_ATTRIBUTE_VALUE);
    }, 0);

    this.remainingPoints = this.totalPoints - this.pointsSpent;
  }

  onAttributeChanged(event: {attribute: string, value: number}): void {
    const attr = this.attributes.find(a => a.name === event.attribute);
    
    if (attr && this.character) {
      const oldValue = attr.currentValue;
      const newValue = event.value;
      const pointDifference = newValue - oldValue;

      // Update the attribute value
      attr.currentValue = newValue;
      this.character.attributes.setAttribute(attr.key, newValue);

      // Update points tracking
      this.pointsSpent += pointDifference;
      this.remainingPoints -= pointDifference;

      // Update character state
      this.characterStateService.updateCharacter(this.character);

      // Update derived attributes
      this.updateDerivedAttributes();

    }
  }

  resetAttributes(): void {
    if (!this.character) return;

    this.attributes.forEach(attr => {
      attr.currentValue = this.MIN_ATTRIBUTE_VALUE;
      this.character!.attributes.setAttribute(attr.key, this.MIN_ATTRIBUTE_VALUE);
    });

    this.pointsSpent = 0;
    this.remainingPoints = this.totalPoints;
    this.characterStateService.updateCharacter(this.character);
    this.updateDerivedAttributes();
  }

  get isComplete(): boolean {
    return this.remainingPoints === 0;
  }

  get canProceed(): boolean {
    return this.isComplete;
  }
}