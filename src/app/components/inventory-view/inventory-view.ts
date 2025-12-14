import { Component, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { Subject } from 'rxjs';
import { Character } from '../../character/character';
import { InventoryItem } from '../../character/inventory/inventoryItem';

@Component({
  selector: 'app-inventory-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatExpansionModule
  ],
  templateUrl: './inventory-view.html',
  styleUrl: './inventory-view.scss'
})
export class InventoryView implements OnDestroy {
  private destroy$ = new Subject<void>();
  @Input() character: Character | null = null;
  selectedTab: 'equipped' | 'inventory' = 'equipped';
  expandedItemId: string | null = null;

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectTab(tab: 'equipped' | 'inventory'): void {
    this.selectedTab = tab;
  }

  // ===== EQUIPMENT SLOTS =====

  getEquippedItem(slot: string): InventoryItem | undefined {
    return this.character?.inventory.getEquippedItem(slot);
  }

  equipItem(item: InventoryItem): void {
    if (!this.character || !item.equipable) return;
    this.character.inventory.equipItem(item.id);
  }

  unequipItem(item: InventoryItem): void {
    if (!this.character) return;
    this.character.inventory.unequipItem(item.id);
  }

  isEquipped(item: InventoryItem): boolean {
    return this.character?.inventory.isEquipped(item.id) || false;
  }

  // ===== INVENTORY LIST =====

  getAllItems(): InventoryItem[] {
    return this.character?.inventory.getAllItems() || [];
  }

  getUnequippedItems(): InventoryItem[] {
    return this.getAllItems().filter(item => !this.isEquipped(item));
  }

  // ===== WEIGHT & CAPACITY =====

  getTotalWeight(): number {
    return this.character?.inventory.getTotalWeight() || 0;
  }

  getCarryingCapacity(): number {
    if (!this.character) return 0;
    return this.character.inventory.getCarryingCapacity(this.character.attributes.strength);
  }

  getWeightPercentage(): number {
    const capacity = this.getCarryingCapacity();
    if (capacity === 0) return 0;
    return Math.min(100, (this.getTotalWeight() / capacity) * 100);
  }

  isOverencumbered(): boolean {
    if (!this.character) return false;
    return this.character.inventory.isOverencumbered(this.character.attributes.strength);
  }

  // ===== CURRENCY =====

  getCurrency(): number {
    return this.character?.inventory.getCurrency() || 0;
  }

  getCurrencyDisplay(): string {
    const marks = this.getCurrency();
    const conversion = this.character?.inventory.convertToMixedDenominations(marks);
    if (!conversion) return '0mk';
    
    if (conversion.broams > 0) {
      return `${conversion.broams}b ${conversion.marks}mk`;
    }
    return `${marks}mk`;
  }

  // ===== ITEM DETAILS =====

  toggleItemExpansion(itemId: string): void {
    this.expandedItemId = this.expandedItemId === itemId ? null : itemId;
  }

  isItemExpanded(itemId: string): boolean {
    return this.expandedItemId === itemId;
  }

  getItemDescription(item: InventoryItem): string {
    let desc = item.description;
    
    if (item.weaponProperties) {
      desc += `\n\nDamage: ${item.weaponProperties.damage} ${item.weaponProperties.damageType}`;
      desc += `\nRange: ${item.weaponProperties.range}`;
      if (item.weaponProperties.traits.length > 0) {
        desc += `\nTraits: ${item.weaponProperties.traits.join(', ')}`;
      }
    }
    
    if (item.armorProperties) {
      desc += `\n\nDeflect: ${item.armorProperties.deflectValue}`;
      if (item.armorProperties.traits.length > 0) {
        desc += `\nTraits: ${item.armorProperties.traits.join(', ')}`;
      }
    }
    
    if (item.fabrialProperties) {
      desc += `\n\nCharges: ${item.fabrialProperties.currentCharges}/${item.fabrialProperties.charges}`;
      desc += `\nEffect: ${item.fabrialProperties.effect}`;
    }
    
    return desc;
  }

  getItemIcon(item: InventoryItem): string {
    switch (item.type) {
      case 'weapon': return 'swords';
      case 'armor': return 'shield';
      case 'equipment': return 'backpack';
      case 'consumable': return 'science';
      case 'fabrial': return 'auto_awesome';
      case 'mount': return 'pets';
      case 'vehicle': return 'directions_boat';
      default: return 'inventory_2';
    }
  }

  getRarityColor(rarity: string): string {
    switch (rarity) {
      case 'reward-only': return 'accent';
      case 'talent-only': return 'accent';
      default: return 'primary';
    }
  }
}
