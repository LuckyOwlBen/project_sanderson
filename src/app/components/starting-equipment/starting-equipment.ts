import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { Subject, takeUntil } from 'rxjs';
import { CharacterStateService } from '../../character/characterStateService';
import { Character } from '../../character/character';
import { ALL_ITEMS, STARTING_KITS } from '../../character/inventory/itemDefinitions';
import { InventoryItem, ItemType, StartingKit } from '../../character/inventory/inventoryItem';
import { getItemById } from '../../character/inventory/itemDefinitions';

@Component({
  selector: 'app-starting-equipment',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatPaginatorModule,
    MatDividerModule,
    MatTooltipModule,
    MatExpansionModule,
  ],
  templateUrl: './starting-equipment.html',
  styleUrls: ['./starting-equipment.scss']
})

export class StartingEquipment implements OnInit, OnDestroy {
  getAllInventoryItems(): { item: InventoryItem; quantity: number }[] {
    if (!this.character) return [];
    return this.character!.inventory.getAllItems().map((item: any) => ({ item, quantity: item.quantity }));
  }
  private destroy$ = new Subject<void>();
  
  character: Character | null = null;
  availableItems: InventoryItem[] = [];
  filteredItems: InventoryItem[] = [];
  paginatedItems: InventoryItem[] = [];
  
  selectedCategory: ItemType | 'all' = 'all';
  pageSize = 12;
  pageIndex = 0;
  
  startingKit: StartingKit | null = null;
  hasRefundedKit = false;
  hasAppliedKit = false;

  constructor(
    private characterState: CharacterStateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.characterState.character$
      .pipe(takeUntil(this.destroy$))
      .subscribe((character: Character | null) => {
        this.character = character;
        if (character) {
          this.loadStartingKit();
          this.loadAvailableItems();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStartingKit(): void {
    if (!this.character) return;

    // Determine starting kit based on character background/class
    // For now, use a default kit - you could base this on culture, ancestry, or a new property
    const culture = this.character.cultures?.[0] || '';
    
    // Map cultures to starting kits
    const kitMapping: { [key: string]: string } = {
      'Alethi': 'military-kit',
      'Azish': 'academic-kit',
      'Shin': 'artisan-kit',
      'Thaylen': 'courtier-kit',
      'Herdazian': 'underworld-kit',
      'Listener': 'prisoner-kit'
    };

    const cultureStr = typeof culture === 'string' ? culture : culture?.name || '';
    const kitId = kitMapping[cultureStr] || 'military-kit';
    this.startingKit = STARTING_KITS.find(k => k.id === kitId) || STARTING_KITS[0];

    // Apply starting kit to inventory if not already applied
    if (this.startingKit && !this.hasRefundedKit && !this.hasAppliedKit) {
      // Check if inventory is empty before applying
      const hasItems = this.character.inventory.getAllItems().length > 0;
      if (!hasItems) {
        this.applyStartingKit();
        this.hasAppliedKit = true;
      } else {
        this.hasAppliedKit = true; // Already has items
      }
    }
  }

  applyStartingKit(): void {
    if (!this.character || !this.startingKit) return;

    // Clear existing starting items
    const inventory = this.character.inventory;
    
    // Add starting kit items
    this.startingKit.weapons.forEach(kitItem => {
      inventory.addItem(kitItem.itemId, kitItem.quantity);
    });
    this.startingKit.armor.forEach(kitItem => {
      inventory.addItem(kitItem.itemId, kitItem.quantity);
    });
    this.startingKit.equipment.forEach(kitItem => {
      inventory.addItem(kitItem.itemId, kitItem.quantity);
    });

    // Add starting currency
    inventory.addCurrency(this.startingKit.currency);
    
    this.hasAppliedKit = true;
    this.characterState.updateCharacter(this.character);
  }

  refundStartingKit(): void {
    if (!this.character || !this.startingKit || this.hasRefundedKit) return;

    const inventory = this.character.inventory;

    // Remove all starting kit items and add sell value
    const allItems = [...this.startingKit.weapons, ...this.startingKit.armor, ...this.startingKit.equipment];
    
    allItems.forEach(kitItem => {
      const item = getItemById(kitItem.itemId);
      if (item) {
        // Remove the item
        for (let i = 0; i < kitItem.quantity; i++) {
          inventory.removeItem(kitItem.itemId);
        }
        // Add sell value (50% of price)
        inventory.addCurrency(Math.floor(item.price * kitItem.quantity * 0.5));
      }
    });

    this.hasRefundedKit = true;
    this.hasAppliedKit = false;
    this.characterState.updateCharacter(this.character);
  }

  loadAvailableItems(): void {
    // Only show common items (exclude reward-only and talent-only)
    this.availableItems = ALL_ITEMS.filter(item => item.rarity === 'common');
    this.filterItems();
  }

  filterItems(): void {
    if (this.selectedCategory === 'all') {
      this.filteredItems = [...this.availableItems];
    } else {
      this.filteredItems = this.availableItems.filter(item => item.type === this.selectedCategory);
    }
    
    this.pageIndex = 0;
    this.updatePaginatedItems();
  }

  updatePaginatedItems(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedItems = this.filteredItems.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedItems();
  }

  selectCategory(category: ItemType | 'all'): void {
    this.selectedCategory = category;
    this.filterItems();
  }

  purchaseItem(item: InventoryItem): void {
    if (!this.character) return;

    const inventory = this.character.inventory;
    
    if (inventory.getCurrency() >= item.price) {
      inventory.purchaseItem(item.id, item.price, 1);
      this.characterState.updateCharacter(this.character);
    }
  }

  sellItem(itemId: string): void {
    if (!this.character) return;

    const inventory = this.character.inventory;
    const item = getItemById(itemId);
    
    if (item) {
      inventory.sellItem(itemId, item.price, 1);
      this.characterState.updateCharacter(this.character);
    }
  }

  canAfford(item: InventoryItem): boolean {
    return this.character ? this.character.inventory.getCurrency() >= item.price : false;
  }

  getItemQuantity(itemId: string): number {
    if (!this.character) return 0;
    const item = this.character.inventory.getAllItems().find(i => i.id === itemId);
    return item?.quantity || 0;
  }

  getItemIcon(item: InventoryItem): string {
    const iconMap: { [key: string]: string } = {
      'weapon': 'swords',
      'armor': 'shield',
      'equipment': 'backpack',
      'consumable': 'science',
      'fabrial': 'auto_awesome',
      'mount': 'pets'
    };
    return iconMap[item.type] || 'category';
  }

  getInventoryItemCount(): number {
    return this.character?.inventory?.getAllItems().length || 0;
  }

  getInventoryWeight(): number {
    return this.character?.inventory?.getTotalWeight() || 0;
  }

  getTotalCurrency(): number {
    return this.character?.inventory.getCurrency() || 0;
  }

  getCurrencyDisplay(): string {
    if (!this.character) return '0 broams';
    const total = this.character.inventory.getCurrency();
    const converted = this.character.inventory.convertToMixedDenominations(total);
    
    const parts: string[] = [];
    if (converted.broams > 0) parts.push(`${converted.broams}b`);
    if (converted.marks > 0) parts.push(`${converted.marks}mk`);
    if (converted.chips > 0) parts.push(`${converted.chips}c`);
    
    return parts.length > 0 ? parts.join(' ') : '0 broams';
  }

  getStartingKitItems(): { item: InventoryItem; quantity: number }[] {
    if (!this.character || !this.startingKit) return [];
    
    // Get the starting kit item IDs
    const kitItemIds = new Set<string>();
    [...this.startingKit.weapons, ...this.startingKit.armor, ...this.startingKit.equipment].forEach(kitItem => {
      kitItemIds.add(kitItem.itemId);
    });
    
    // Return only the items that are actually in the inventory and are from the starting kit
    const inventory = this.character.inventory.getAllItems();
    return inventory
      .filter(item => kitItemIds.has(item.id))
      .map(item => ({
        item: item,
        quantity: item.quantity
      }));
  }

  nextStep(): void {
    this.router.navigate(['/character-creator-view/review']);
  }

  previousStep(): void {
    this.router.navigate(['/character-creator-view/talents']);
  }
}
