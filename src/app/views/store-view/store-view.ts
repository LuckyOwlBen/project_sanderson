import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Character } from '../../character/character';
import { InventoryItem, ItemType, CurrencyConversion } from '../../character/inventory/inventoryItem';
import { ALL_ITEMS, LIGHT_WEAPONS, HEAVY_WEAPONS, ARMOR_ITEMS, EQUIPMENT_ITEMS, FABRIAL_ITEMS, MOUNT_ITEMS } from '../../character/inventory/itemDefinitions';
import { CharacterStateService } from '../../character/characterStateService';
import { WebsocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-store-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './store-view.html',
  styleUrl: './store-view.scss'
})
export class StoreView implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  character: Character | null = null;
  storeEnabled: boolean = true;
  selectedCategory: ItemType | 'all' = 'all';
  searchQuery: string = '';
  
  // Currency converter
  showConverter: boolean = false;
  converterMarks: number = 0;
  converterBroams: number = 0;
  converterChips: number = 0;

  categories = [
    { id: 'all' as const, label: 'All Items', icon: 'store' },
    { id: 'weapon' as const, label: 'Weapons', icon: 'swords' },
    { id: 'armor' as const, label: 'Armor', icon: 'shield' },
    { id: 'equipment' as const, label: 'Equipment', icon: 'backpack' },
    { id: 'consumable' as const, label: 'Consumables', icon: 'science' },
    { id: 'fabrial' as const, label: 'Fabrials', icon: 'auto_awesome' },
    { id: 'mount' as const, label: 'Mounts', icon: 'pets' }
  ];

  constructor(
    private characterState: CharacterStateService,
    private websocketService: WebsocketService
  ) {}

  ngOnInit(): void {
    this.characterState.character$
      .pipe(takeUntil(this.destroy$))
      .subscribe((character: Character | null) => {
        this.character = character;
      });

    // Listen for store toggle events from GM
    this.websocketService.storeToggle$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        this.storeEnabled = event.enabled;
        if (!event.enabled) {
          this.showNotification('The store has been closed by the GM');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== CATEGORY FILTERING =====

  selectCategory(category: ItemType | 'all'): void {
    this.selectedCategory = category;
  }

  getAvailableItems(): InventoryItem[] {
    let items = ALL_ITEMS.filter(item => item.rarity === 'common');

    if (this.selectedCategory !== 'all') {
      items = items.filter(item => item.type === this.selectedCategory);
    }

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    }

    return items;
  }

  // ===== PURCHASING =====

  purchaseItem(item: InventoryItem, quantity: number = 1): void {
    if (!this.character) return;

    const totalCost = item.price * quantity;

    if (!this.character.inventory.canAfford(totalCost)) {
      this.showNotification('Not enough currency!');
      return;
    }

    if (this.character.inventory.purchaseItem(item.id, item.price, quantity)) {
      this.showNotification(`Purchased ${quantity}x ${item.name}`);
      
      // Emit websocket event for GM tracking
      this.websocketService.emitStoreTransaction({
        storeId: 'main-store',
        characterId: (this.character as any).id || 'unknown',
        items: [{
          itemId: item.id,
          quantity,
          price: item.price,
          type: 'buy'
        }],
        totalCost,
        timestamp: new Date().toISOString()
      });
    }
  }

  canAfford(item: InventoryItem, quantity: number = 1): boolean {
    if (!this.character) return false;
    return this.character.inventory.canAfford(item.price * quantity);
  }

  // ===== CURRENCY DISPLAY =====

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

  // ===== CURRENCY CONVERTER =====

  toggleConverter(): void {
    this.showConverter = !this.showConverter;
    if (this.showConverter && this.character) {
      const marks = this.getCurrency();
      const conversion = this.character.inventory.convertToMixedDenominations(marks);
      this.converterBroams = conversion.broams;
      this.converterMarks = conversion.marks;
      this.converterChips = conversion.chips;
    }
  }

  updateFromBroams(): void {
    const totalMarks = (this.converterBroams * 4) + this.converterMarks + (this.converterChips * 0.2);
    if (this.character) {
      this.character.inventory.setCurrency(totalMarks);
    }
  }

  updateFromMarks(): void {
    const totalMarks = (this.converterBroams * 4) + this.converterMarks + (this.converterChips * 0.2);
    if (this.character) {
      this.character.inventory.setCurrency(totalMarks);
    }
  }

  updateFromChips(): void {
    const totalMarks = (this.converterBroams * 4) + this.converterMarks + (this.converterChips * 0.2);
    if (this.character) {
      this.character.inventory.setCurrency(totalMarks);
    }
  }

  convertToMixed(): void {
    if (!this.character) return;
    const marks = this.getCurrency();
    const conversion = this.character.inventory.convertToMixedDenominations(marks);
    this.converterBroams = conversion.broams;
    this.converterMarks = conversion.marks;
    this.converterChips = conversion.chips;
    this.showNotification('Currency converted!');
  }

  // ===== ITEM DETAILS =====

  getCategoryIcon(iconName: string): string {
    const iconMap: { [key: string]: string } = {
      'store': '🏪',
      'swords': '⚔️',
      'shield': '🛡️',
      'backpack': '🎒',
      'science': '🧪',
      'auto_awesome': '✨',
      'pets': '🐴'
    };
    return iconMap[iconName] || '📦';
  }

  getItemIconEmoji(item: InventoryItem): string {
    switch (item.type) {
      case 'weapon': return '⚔️';
      case 'armor': return '🛡️';
      case 'equipment': return '🎒';
      case 'consumable': return '🧪';
      case 'fabrial': return '✨';
      case 'mount': return '🐴';
      case 'vehicle': return '⛵';
      default: return '📦';
    }
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

  getItemStats(item: InventoryItem): string {
    if (item.weaponProperties) {
      return `${item.weaponProperties.damage} ${item.weaponProperties.damageType}`;
    }
    if (item.armorProperties) {
      return `Deflect: ${item.armorProperties.deflectValue}`;
    }
    if (item.fabrialProperties) {
      return `Charges: ${item.fabrialProperties.charges}`;
    }
    return '';
  }

  // ===== NOTIFICATIONS =====

  private showNotification(message: string): void {
    // Simple notification - could be enhanced with a custom notification service
    console.log('Notification:', message);
    // You could create a toast/notification component here
  }
}
