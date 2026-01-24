import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
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
import { InventoryItem, ItemType, StartingKit } from '../../character/inventory/inventoryItem';
import { CharacterStorageService } from '../../services/character-storage.service';

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
  isLevelUpMode: boolean = false;
  private characterId: string | null = null;
  
  selectedCategory: ItemType | 'all' = 'all';
  pageSize = 12;
  pageIndex = 0;
  
  startingKit: StartingKit | null = null;
  hasRefundedKit = false;
  hasAppliedKit = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private characterState: CharacterStateService,
    private router: Router,
    private http: HttpClient,
    private storageService: CharacterStorageService
  ) {}

  ngOnInit(): void {
    // Subscribe to route params to detect level-up mode and always
    // fetch a fresh character snapshot from the backend by ID.
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.isLevelUpMode = params['levelUp'] === 'true';

        // Read the current character snapshot to get the ID, but do not
        // subscribe to character$ (avoids stale state re-emits).
        this.character = this.characterState.getCharacter();
        this.characterId = (this.character as any)?.id || null;

        if (this.characterId) {
          this.fetchCharacterFromApi(this.characterId);
        } else {
          console.warn('[StartingEquipment] No character ID found; cannot load from API');
          this.syncLocalCharacterState();
        }
      });
  }

  private fetchCharacterFromApi(characterId: string): void {
    this.storageService.loadCharacter(characterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (loaded) => {
          if (!loaded) {
            console.warn('[StartingEquipment] API returned no character for ID:', characterId);
            this.syncLocalCharacterState();
            return;
          }
          this.character = loaded;
          this.characterState.updateCharacter(loaded);
          this.loadStartingKit();
          this.loadAvailableItems();
        },
        error: (err) => {
          console.error('[StartingEquipment] Failed to load character from API:', err);
          this.syncLocalCharacterState();
        }
      });
  }

  private syncLocalCharacterState(): void {
    // Fallback to whatever is currently in memory; still validate so the UI
    // remains usable even if the API call fails or the ID is missing.
    if (!this.character) {
      this.character = this.characterState.getCharacter();
    }
    if (this.character) {
      this.loadStartingKit();
      this.loadAvailableItems();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStartingKit(): void {
    if (!this.character) return;

    // Determine starting kit based on character background/class
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
    
    // Load kit from API
    this.http.get<any>('/api/items')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Find kit from backend definition or use default
          // For now, we'll just store the kitId for later use
          this.startingKit = { id: kitId } as StartingKit;
          
          // Check if inventory is empty before applying
          const hasItems = this.character!.inventory.getAllItems().length > 0;
          if (!hasItems) {
            this.applyStartingKit();
            this.hasAppliedKit = true;
          } else {
            this.hasAppliedKit = true; // Already has items
          }
        },
        error: (err) => {
          console.error('Error loading starting kit:', err);
          this.hasAppliedKit = true;
        }
      });
  }

  applyStartingKit(): void {
    if (!this.character || !this.startingKit) return;

    const characterId = (this.character as any).id;
    if (!characterId) {
      console.error('Character ID not found');
      return;
    }

    // Call backend endpoint to apply kit
    this.http.post<any>(`/api/character/${characterId}/inventory/apply-kit`, {
      kitId: this.startingKit.id
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Update character inventory from backend response
            this.character!.inventory.deserialize(response.inventory);
            this.characterState.updateCharacter(this.character!);
            this.hasAppliedKit = true;
          } else {
            console.error('Failed to apply kit:', response.error);
          }
        },
        error: (err) => {
          console.error('Error applying starting kit:', err);
        }
      });
  }

  refundStartingKit(): void {
    // Note: Refunding requires backend implementation for accurate price calculations
    // For now, this is a placeholder
    console.warn('Refunding starting kit is not yet implemented on backend');
    this.hasRefundedKit = true;
  }

  loadAvailableItems(): void {
    // Load available items from backend
    this.http.get<any>('/api/items?rarity=common')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.availableItems = response.items || [];
          this.filterItems();
        },
        error: (err) => {
          console.error('Error loading available items:', err);
        }
      });
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

    const characterId = (this.character as any).id;
    if (!characterId) {
      console.error('Character ID not found');
      return;
    }

    // Call backend endpoint to purchase
    this.http.post<any>(`/api/character/${characterId}/inventory/purchase`, {
      itemId: item.id,
      quantity: 1,
      price: item.price
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Update character inventory from backend response
            this.character!.inventory.deserialize(response.inventory);
            this.characterState.updateCharacter(this.character!);
          } else {
            console.error('Failed to purchase item:', response.error);
          }
        },
        error: (err) => {
          console.error('Error purchasing item:', err);
        }
      });
  }

  sellItem(itemId: string): void {
    // Note: Selling requires backend implementation
    // For now, this is a placeholder
    console.warn('Selling items is not yet implemented on backend');
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

  // Persist hook for CharacterCreatorView
  public persistStep(): void {
    if (this.character && this.characterId) {
      this.storageService.saveCharacter(this.character).subscribe({ next: () => {}, error: () => {} });
    }
  }
}
