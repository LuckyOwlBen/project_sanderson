import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Character } from '../../character/character';
import { InventoryItem, ItemType, CurrencyConversion } from '../../character/inventory/inventoryItem';
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
  isLoading: boolean = true;
  isConnected: boolean = false;
  isSaving: boolean = false;
  availableItems: InventoryItem[] = [];
  
  // Cached items list that will trigger re-render
  private allItems: InventoryItem[] = [];
  
  // Track which category sections are enabled by GM (make public for template access)
  public categoryEnabled = new Map<ItemType, boolean>([
    ['weapon', true],
    ['armor', true],
    ['equipment', true],
    ['consumable', true],
    ['fabrial', true],
    ['mount', true]
  ]);

  // Only categories that the GM can toggle are tracked for open/closed display
  private readonly trackedCategories: ItemType[] = ['weapon', 'armor', 'equipment', 'consumable', 'fabrial', 'mount'];
  
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
    private websocketService: WebsocketService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Load store items from backend
    this.loadStoreItems();
    
    // Connect to WebSocket server
    this.websocketService.connect();
    
    // Wait for WebSocket connection before requesting state
    this.websocketService.connected$
      .pipe(takeUntil(this.destroy$))
      .subscribe(connected => {
        this.isConnected = connected;
        
        if (connected) {
          // Request current store state from server
          this.websocketService.requestStoreState();
        }
      });
    
    this.characterState.character$
      .pipe(takeUntil(this.destroy$))
      .subscribe((character: Character | null) => {
        this.character = character;
        this.updateAvailableItems();
      });

    // Listen for store toggle events from GM
    this.websocketService.storeToggle$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        // Handle main-store toggle (all categories)
        if (event.storeId === 'main-store') {
          this.storeEnabled = event.enabled;
          if (!event.enabled) {
            this.selectedCategory = 'all';
            this.searchQuery = '';
          }
        } else {
          // Handle category-specific toggles
          const storeIdToCategory = new Map<string, ItemType>([
            ['weapons-shop', 'weapon'],
            ['armor-shop', 'armor'],
            ['equipment-shop', 'equipment'],
            ['consumables-shop', 'consumable'],
            ['fabrials-shop', 'fabrial'],
            ['mounts-shop', 'mount']
          ]);
          const category = storeIdToCategory.get(event.storeId);
          if (category) {
            this.categoryEnabled.set(category, event.enabled);
          }
        }
        
        // Update the items list to trigger re-render
        this.updateAvailableItems();
        
        // Force change detection to update UI
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== ITEM LOADING =====

  loadStoreItems(): void {
    this.http.get<any>('/api/store/items')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.allItems = response.items || [];
          this.isLoading = false;
          this.updateAvailableItems();
        },
        error: (error) => {
          console.error('Error loading store items:', error);
          this.isLoading = false;
          this.showNotification('Failed to load store items');
        }
      });
  }

  // ===== CATEGORY FILTERING =====

  selectCategory(category: ItemType | 'all'): void {
    this.selectedCategory = category;
    this.updateAvailableItems();
  }

  updateAvailableItems(): void {
    this.availableItems = this.computeAvailableItems();
  }

  computeAvailableItems(): InventoryItem[] {
    let items = [...this.allItems];

    // Filter out items from disabled categories
    items = items.filter(item => {
      const itemType = item.type === 'vehicle' ? 'mount' : item.type;
      return this.categoryEnabled.get(itemType as ItemType) !== false;
    });

    // Filter by selected category
    if (this.selectedCategory !== 'all') {
      items = items.filter(item => item.type === this.selectedCategory);
    }

    // Filter by search query
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
    if (!this.character) {
      this.showNotification('No character selected');
      return;
    }

    if (this.isSaving) {
      this.showNotification('Purchase in progress...');
      return;
    }

    const characterId = (this.character as any).id;
    if (!characterId) {
      this.showNotification('Character ID not found');
      return;
    }

    this.isSaving = true;

    this.http.post<any>(`/api/character/${characterId}/inventory/purchase`, {
      itemId: item.id,
      quantity,
      price: item.price
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Update character inventory from backend response
            this.character!.inventory.deserialize(response.inventory);
            this.showNotification(`Purchased ${quantity}x ${item.name}`);
          } else {
            this.showNotification(response.error || 'Purchase failed');
          }
          this.isSaving = false;
        },
        error: (error) => {
          console.error('Error purchasing item:', error);
          this.showNotification('Failed to purchase item');
          this.isSaving = false;
        }
      });
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

  // ===== STORE INFO =====

  getStoreName(): string {
    return 'General Store';
  }

  getStoreIcon(): string {
    return '🏪';
  }

  getStoreDescription(): string {
    return 'Browse and purchase equipment for your adventures';
  }
  
  getDisabledCategories(): ItemType[] {
    const disabled: ItemType[] = [];
    for (const category of this.trackedCategories) {
      if (this.categoryEnabled.get(category) === false) {
        disabled.push(category);
      }
    }
    return disabled;
  }
  
  getCategoryDisplayName(category: ItemType): string {
    const names: Record<ItemType, string> = {
      'weapon': 'Weapons',
      'armor': 'Armor',
      'equipment': 'Equipment',
      'consumable': 'Consumables',
      'fabrial': 'Fabrials',
      'mount': 'Mounts & Vehicles',
      'vehicle': 'Mounts & Vehicles',
      'pet': 'Pets'
    };
    return names[category] || category;
  }
  
  getDisabledCategoriesMessage(): string {
    const disabled = this.getDisabledCategories();
    if (disabled.length === 0) return '';
    return disabled.map(c => this.getCategoryDisplayName(c)).join(', ');
  }

  // ===== NOTIFICATIONS =====

  private showNotification(message: string): void {
    // Simple notification - could be enhanced with a custom notification service
    // You could create a toast/notification component here
  }
}
