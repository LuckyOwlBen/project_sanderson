import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PetCompanion, PetStatBlock } from '../../../character/companions/petCompanion';
import { PetAbility, ActionCost, DamageRoll } from '../../../character/companions/petAbility';
import { ResourceTracker, Resource } from '../../resource-tracker/resource-tracker';

@Component({
  selector: 'app-companion-detail',
  standalone: true,
  imports: [CommonModule, ResourceTracker],
  templateUrl: './companion-detail.component.html',
  styleUrls: ['./companion-detail.component.scss']
})
export class CompanionDetailComponent implements OnInit {
  @Input() companion: PetCompanion | undefined;
  @Input() isActive: boolean = false;

  displayName: string = '';
  healthResource: Resource = { name: 'Health', current: 0, max: 0, color: '#e53935' };
  focusResource: Resource = { name: 'Focus', current: 0, max: 0, color: '#1e88e5' };

  ngOnInit(): void {
    this.updateDisplay();
  }

  ngOnChanges(): void {
    this.updateDisplay();
  }

  private updateDisplay(): void {
    if (!this.companion) return;

    this.displayName = this.companion.statBlock.name;

    this.healthResource.current = this.companion.currentHealth;
    this.healthResource.max = this.companion.statBlock.health.max;

    this.focusResource.current = this.companion.currentFocus;
    this.focusResource.max = this.companion.statBlock.focus.max;
  }

  onHealthChanged(value: number): void {
    if (this.companion) {
      this.companion.currentHealth = value;
    }
  }

  onFocusChanged(value: number): void {
    if (this.companion) {
      this.companion.currentFocus = value;
    }
  }

  get statBlock(): PetStatBlock | undefined {
    return this.companion?.statBlock;
  }

  get abilities(): PetAbility[] {
    return this.companion?.getAbilities() || [];
  }

  getActionCostClass(cost: ActionCost): string {
    return `action-cost-${cost.replace(/\s+/g, '-')}`;
  }

  getAbilityTypeClass(type: string): string {
    return `ability-type-${type}`;
  }

  getMovementString(): string {
    if (!this.statBlock) return '';
    const parts = [];
    if (this.statBlock.movement.ground) {
      parts.push(`${this.statBlock.movement.ground} ft.`);
    }
    if (this.statBlock.movement.flying) {
      parts.push(`fly ${this.statBlock.movement.flying} ft.`);
    }
    return parts.join(', ');
  }

  getSensesString(): string {
    if (!this.statBlock?.senses) return '';
    return `${this.statBlock.senses.range} ft. (${this.statBlock.senses.types.join(', ')})`;
  }

  getSkillsList(): { category: string; skills: { name: string; value: number }[] }[] {
    if (!this.statBlock) return [];

    const skills: { category: string; skills: { name: string; value: number }[] }[] = [];

    if (this.statBlock.physicalSkills && Object.keys(this.statBlock.physicalSkills).length > 0) {
      skills.push({
        category: 'Physical Skills',
        skills: Object.entries(this.statBlock.physicalSkills).map(([name, value]) => ({
          name,
          value: value as number
        }))
      });
    }

    if (this.statBlock.spiritualSkills && Object.keys(this.statBlock.spiritualSkills).length > 0) {
      skills.push({
        category: 'Spiritual Skills',
        skills: Object.entries(this.statBlock.spiritualSkills).map(([name, value]) => ({
          name,
          value: value as number
        }))
      });
    }

    return skills;
  }

  isAlive(): boolean {
    return this.companion?.isAlive() ?? false;
  }

  getAbilityDescription(ability: PetAbility): string {
    if (ability.detailedEffect) {
      return ability.detailedEffect;
    }
    return ability.description;
  }

  getDamageString(ability: PetAbility): string {
    if (!ability.attack) return '';
    
    const damageStrings: string[] = [];
    
    if (ability.attack.onGraze) {
      ability.attack.onGraze.forEach((dmg: DamageRoll) => {
        damageStrings.push(`Graze: ${dmg.description}`);
      });
    }
    
    if (ability.attack.onHit) {
      ability.attack.onHit.forEach((dmg: DamageRoll) => {
        damageStrings.push(`Hit: ${dmg.description}`);
      });
    }
    
    return damageStrings.join('; ');
  }

  canUseAbility(ability: PetAbility): boolean {
    return this.companion?.canUseAbility(ability.id) ?? false;
  }
}
