import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Character } from '../../../character/character';
import { ResourceTracker, Resource } from '../../resource-tracker/resource-tracker';

@Component({
  selector: 'app-character-resources-bar',
  standalone: true,
  imports: [
    CommonModule,
    ResourceTracker
  ],
  templateUrl: './character-resources-bar.html',
  styleUrl: './character-resources-bar.scss',
})
export class CharacterResourcesBar {
  @Input() character!: Character;
  @Output() resourceChanged = new EventEmitter<{ resourceName: string, newValue: number }>();

  get healthResource(): Resource {
    return {
      name: 'Health',
      current: this.character?.resources.health.current || 0,
      max: this.character?.resources.health.max || 0,
      icon: 'favorite',
      color: '#f44336'
    };
  }

  get focusResource(): Resource {
    return {
      name: 'Focus',
      current: this.character?.resources.focus.current || 0,
      max: this.character?.resources.focus.max || 0,
      icon: 'psychology',
      color: '#2196f3'
    };
  }

  get investitureResource(): Resource {
    const current = this.character?.resources.investiture.current || 0;
    const max = this.character?.resources.investiture.max || 0;
    const wealth = this.character?.inventory.getCurrency() || 0;
    const requiredWealth = max * 3;
    const canRestore = current < max ? wealth >= requiredWealth : true;
    
    let restoreWarning: string | undefined;
    if (current < max && !canRestore) {
      const deficit = requiredWealth - wealth;
      restoreWarning = `Need ${deficit} more marks in spheres to restore Investiture (requires ${requiredWealth} marks total)`;
    }
    
    return {
      name: 'Investiture',
      current,
      max,
      icon: 'auto_awesome',
      color: '#9c27b0',
      canRestore,
      restoreWarning
    };
  }

  get showInvestiture(): boolean {
    return this.character?.resources.investiture.isActive() || false;
  }

  onResourceChanged(resourceName: string, newValue: number): void {
    this.resourceChanged.emit({ resourceName, newValue });
  }
}
