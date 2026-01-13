import { Component, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { Character } from '../../../character/character';
import { InventoryItem } from '../../../character/inventory/inventoryItem';
import { getPetProperties, PetProperties } from '../../../character/inventory/petDefinitions';

@Component({
  selector: 'app-pet-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pet-display.component.html',
  styleUrls: ['./pet-display.component.scss']
})
export class PetDisplayComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  @Input() character: Character | null = null;
  @Input() pet: InventoryItem | null = null;

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getPetProperties(): PetProperties | undefined {
    if (!this.pet) return undefined;
    return getPetProperties(this.pet);
  }

  getIntelligenceLabel(): string {
    const intelligence = this.getPetProperties()?.intelligence;
    return intelligence === 'sapient' ? 'Sapient' : 'Animal Intelligence';
  }

  getIntelligenceIcon(): string {
    const intelligence = this.getPetProperties()?.intelligence;
    return intelligence === 'sapient' ? '🧠' : '🦅';
  }

  getMovementInfo(): string {
    const props = this.getPetProperties();
    if (props?.flyingSpeed && props?.movementSpeed) {
      return `Movement: ${props.movementSpeed} ft/round | Flying: ${props.flyingSpeed} ft/round`;
    } else if (props?.flyingSpeed) {
      return `Flying: ${props.flyingSpeed} ft/round`;
    } else if (props?.movementSpeed) {
      return `Movement: ${props.movementSpeed} ft/round`;
    }
    return '';
  }

  isEquipped(): boolean {
    if (!this.character || !this.pet) return false;
    return this.character.inventory.isEquipped(this.pet.id);
  }

  equipPet(): void {
    if (!this.character || !this.pet) return;
    this.character.inventory.equipItem(this.pet.id);
  }

  unequipPet(): void {
    if (!this.character || !this.pet) return;
    this.character.inventory.unequipItem(this.pet.id);
  }

  removePet(): void {
    if (!this.character || !this.pet) return;
    this.character.inventory.removeItem(this.pet.id, 1);
  }
}
