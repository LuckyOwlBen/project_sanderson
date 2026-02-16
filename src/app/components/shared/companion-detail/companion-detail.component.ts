import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PetCompanion, PetStatBlock } from '../../../character/companions/petCompanion';
import { PetAbility, ActionCost, DamageRoll } from '../../../character/companions/petAbility';

@Component({
  selector: 'app-companion-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './companion-detail.component.html',
  styleUrls: ['./companion-detail.component.scss']
})
export class CompanionDetailComponent implements OnInit {
  @Input() companion: PetCompanion | undefined;
  @Input() isActive: boolean = false;

  displayName: string = '';
  healthPercent: number = 0;
  focusPercent: number = 0;

  ngOnInit(): void {
    this.updateDisplay();
  }

  ngOnChanges(): void {
    this.updateDisplay();
  }

  private updateDisplay(): void {
    if (!this.companion) return;

    this.displayName = this.companion.statBlock.name;
    
    const maxHealth = this.companion.statBlock.health.max;
    const maxFocus = this.companion.statBlock.focus.max;
    
    this.healthPercent = maxHealth > 0 ? (this.companion.currentHealth / maxHealth) * 100 : 0;
    this.focusPercent = maxFocus > 0 ? (this.companion.currentFocus / maxFocus) * 100 : 0;
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
