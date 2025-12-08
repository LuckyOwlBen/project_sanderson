import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Character } from '../../character/character';
import { CharacterStateService } from '../../character/characterStateService';
import { LevelUpManager } from '../../levelup/levelUpManager';
import { ValueStepper } from '../value-stepper/value-stepper';
import { BaseAllocator } from '../shared/base-allocator';

interface AttributeConfig {
  name: string;
  key: keyof Character['attributes'];
  currentValue: number;
}

@Component({
  selector: 'app-attribute-allocator',
  standalone: true,
  imports: [CommonModule, ValueStepper],
  providers: [LevelUpManager],
  templateUrl: './attribute-allocator.html',
  styleUrls: ['./attribute-allocator.scss']
})
export class AttributeAllocator extends BaseAllocator<AttributeConfig> implements OnInit {
  character: Character | null = null;
  movementSpeed: number = 0;
  recoveryDie: string = '';

  constructor(
    private characterStateService: CharacterStateService,
    private levelUpManager: LevelUpManager
  ) {
    super();
  }

  ngOnInit(): void {
    // Subscribe to character state to get updates and persist state
    this.characterStateService.character$.subscribe(character => {
      this.character = character;
      if (this.character) {
        this.initializeAttributes();
      }
    });
  }

  private initializeAttributes(): void {
    if (!this.character) return;

    const attributes: AttributeConfig[] = [
      { name: 'Strength', key: 'strength', currentValue: this.character.attributes.strength },
      { name: 'Speed', key: 'speed', currentValue: this.character.attributes.speed },
      { name: 'Awareness', key: 'awareness', currentValue: this.character.attributes.awareness },
      { name: 'Intellect', key: 'intellect', currentValue: this.character.attributes.intellect },
      { name: 'Willpower', key: 'willpower', currentValue: this.character.attributes.willpower },
      { name: 'Presence', key: 'presence', currentValue: this.character.attributes.presence }
    ];

    const currentLevel = this.character.level || 1;
    const totalPoints = this.levelUpManager.getAttributePointsForLevel(currentLevel);
    
    this.initialize(attributes, totalPoints);
    this.updateDerivedAttributes();
  }

  private updateDerivedAttributes(): void {
    if (!this.character) return;
    this.movementSpeed = this.character.derivedAttributes.getMovementSpeed(this.character.attributes);
    this.recoveryDie = this.character.derivedAttributes.getRecoveryDie(this.character.attributes);
  }

  // BaseAllocator abstract methods implementation
  protected getLabel(item: AttributeConfig): string {
    return item.name;
  }

  protected getCurrentValue(item: AttributeConfig): number {
    return item.currentValue;
  }

  protected setCurrentValue(item: AttributeConfig, value: number): void {
    item.currentValue = value;
    if (this.character) {
      this.character.attributes.setAttribute(item.key, value);
    }
  }

  protected onItemChanged(item: AttributeConfig, newValue: number): void {
    if (this.character) {
      this.characterStateService.updateCharacter(this.character);
      this.updateDerivedAttributes();
    }
  }

  protected onResetComplete(): void {
    if (this.character) {
      this.characterStateService.updateCharacter(this.character);
      this.updateDerivedAttributes();
    }
  }
}