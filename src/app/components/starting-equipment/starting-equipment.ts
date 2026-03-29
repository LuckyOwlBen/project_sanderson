import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Subject, firstValueFrom, takeUntil, filter, take, switchMap } from 'rxjs';
import { CharacterIdentityService } from '../../services/character-identity.service';
import { StepValidationService } from '../../services/step-validation.service';
import { NavFinalizedService } from '../../services/nav-finalized.service';
import { EquipmentApiService, EquipmentResponse } from '../../services/equipment-api.service';
import { ItemType, StartingKitDTO, InventoryDTO, InventoryItem, InventoryViewItem } from '../../../../shared/types/inventory';

@Component({
  selector: 'app-starting-equipment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatPaginatorModule,
    MatDividerModule,
    MatTooltipModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './starting-equipment.html',
  styleUrls: ['./starting-equipment.scss']
})

export class StartingEquipment implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private currentCharacterId: string | null = null;
  
  // Inventory state
  private currentInventory: InventoryDTO | null = null;
  inventoryItems: InventoryViewItem[] = [];
  currentCurrency = 0;
  
  // Available items and kits
  availableKits: StartingKitDTO[] = [];
  selectedKitId: string | null = null;
  startingKit: StartingKitDTO | null = null;
  private defaultKitId: string | null = null;
  
  availableItems: InventoryItem[] = [];
  filteredItems: InventoryItem[] = [];
  paginatedItems: InventoryItem[] = [];
  
  // UI state
  selectedCategory: ItemType | 'all' = 'all';
  pageSize = 12;
  pageIndex = 0;
  isWaitingForIdentity = false;
  isFinalized = false;

  constructor(
    private router: Router,
    private equipmentApi: EquipmentApiService,
    private identityService: CharacterIdentityService,
    private validationService: StepValidationService,
    private navFinalizedService: NavFinalizedService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to nav finalized status for lock state
    this.navFinalizedService.getNavigationFinalized()
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.isFinalized = status.equipment === 'finalized';
        this.cdr.markForCheck();
      });

    // Monitor identity service waiting state
    this.identityService.waitingForIdentity$
      .pipe(takeUntil(this.destroy$))
      .subscribe((waiting) => {
        this.isWaitingForIdentity = waiting;
      });

    // Load from API when character ID becomes available
    this.identityService.currentCharacterId$
      .pipe(
        takeUntil(this.destroy$),
        filter((id) => id !== null)
      )
      .subscribe((characterId) => {
        if (characterId) {
          this.currentCharacterId = characterId;
          this.loadFromApi(characterId);
        }
      });

    // Load available kits (no auto-apply, user must choose)
    this.loadAvailableKits();

    // Load store items
    this.loadStoreItems();
  }

  private loadFromApi(characterId: string): void {
    this.equipmentApi.getEquipment(characterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: EquipmentResponse) => {
          if (response?.success) {
            this.currentInventory = response.inventory ?? null;
            this.inventoryItems = response.inventoryItems ?? [];
            this.currentCurrency = response.currency ?? 0;
            this.selectedKitId = response.selectedKitId ?? null;
            this.resolveStartingKit();
          }
          this.updateValidation();
          this.isWaitingForIdentity = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading equipment from API:', err);
          this.router.navigate(['/']);
        }
      });
  }

  private loadAvailableKits(): void {
    this.equipmentApi.getAvailableKits()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (kits) => {
          this.availableKits = kits;
          const militaryKit = kits.find((kit) => kit.id === 'military-kit');
          this.defaultKitId = militaryKit?.id ?? kits[0]?.id ?? null;
          this.resolveStartingKit();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading available kits:', err);
        }
      });
  }

  private loadStoreItems(): void {
    this.equipmentApi.getStoreItems()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.availableItems = items;
          this.filterItems();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading store items:', err);
        }
      });
  }

  private updateValidation(): void {
    this.validationService.setStepValid(8, !!this.selectedKitId);
  }

  private resolveStartingKit(): void {
    this.startingKit = this.availableKits.find(k => k.id === this.selectedKitId) ?? null;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }



  private applyKitForCharacter(characterId: string, kitId: string, kit: StartingKitDTO): void {
    this.equipmentApi.applyStartingKit(characterId, kitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.inventory) {
            this.currentInventory = response.inventory;
            this.inventoryItems = response.inventoryItems ?? [];
            this.currentCurrency = response.currency ?? 0;
            this.selectedKitId = kitId;
            this.startingKit = kit;
              this.updateValidation();
            console.log('Kit applied successfully');
            this.cdr.markForCheck();
          } else {
            console.error('Failed to apply kit:', response.error);
          }
        },
        error: (err) => {
          console.error('Error applying kit:', err);
        }
      });
  }

  applyKit(kitId: string): void {
    const kit = this.availableKits.find(k => k.id === kitId);
    if (!kit || !this.currentCharacterId) return;

    // If a kit is already applied, refund it first (clean slate)
    if (this.selectedKitId && this.selectedKitId !== kitId) {
      this.equipmentApi.refundStartingKit(this.currentCharacterId)
        .pipe(
          takeUntil(this.destroy$),
          switchMap(() => {
            // After refund completes, apply the new kit
            return this.equipmentApi.applyStartingKit(this.currentCharacterId!, kitId);
          })
        )
        .subscribe({
          next: (response) => {
            if (response.success && response.inventory) {
              this.currentInventory = response.inventory;
              this.inventoryItems = response.inventoryItems ?? [];
              this.currentCurrency = response.currency ?? 0;
              this.selectedKitId = kitId;
              this.startingKit = kit;
                this.updateValidation();
              console.log('Kit switched successfully (refunded old kit, applied new kit)');
              this.cdr.markForCheck();
            } else {
              console.error('Failed to switch kit:', response.error);
            }
          },
          error: (err) => {
            console.error('Error switching kit:', err);
          }
        });
    } else {
      // No existing kit, just apply the new one
      this.applyKitForCharacter(this.currentCharacterId, kitId, kit);
    }
  }

  refundStartingKit(): void {
    this.identityService.currentCharacterId$
      .pipe(takeUntil(this.destroy$))
      .subscribe(characterId => {
        if (!characterId) return;

        this.equipmentApi.refundStartingKit(characterId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              if (response.success && response.inventory) {
                this.currentInventory = response.inventory;
                this.inventoryItems = response.inventoryItems ?? [];
                this.currentCurrency = response.currency ?? 0;
                this.selectedKitId = null;
                this.startingKit = null;
              this.updateValidation();
                console.log('Kit refunded successfully');
                this.cdr.markForCheck();
              } else {
                console.error('Failed to refund kit:', response.error);
              }
            },
            error: (err) => {
              console.error('Error refunding kit:', err);
            }
          });
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
    this.identityService.currentCharacterId$
      .pipe(takeUntil(this.destroy$))
      .subscribe(characterId => {
        if (!characterId) return;

        this.equipmentApi.purchaseItem(characterId, item.id, 1)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              if (response.success && response.inventory) {
                this.currentInventory = response.inventory;
                this.inventoryItems = response.inventoryItems ?? [];
                this.currentCurrency = response.currency ?? 0;
                console.log('Purchase successful:', response.message);
                this.cdr.markForCheck();
              } else {
                console.error('Failed to purchase item:', response.error);
              }
            },
            error: (err) => {
              console.error('Error purchasing item:', err);
            }
          });
      });
  }

  canAfford(item: InventoryItem): boolean {
    return this.currentCurrency >= item.price;
  }

  getItemQuantity(itemId: string): number {
    return this.inventoryItems
      .filter((item) => (item.baseId ?? item.id) === itemId)
      .reduce((sum, item) => sum + (item.quantity ?? 0), 0);
  }

  getAllInventoryItems(): { item: InventoryItem; quantity: number }[] {
    return this.inventoryItems
      .filter(item => item && item.id && item.name && item.price !== undefined)
      .map((item) => ({
        item,
        quantity: item.quantity
      }));
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
    return this.inventoryItems.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
  }

  getInventoryWeight(): number {
    return this.inventoryItems.reduce((sum, item) => sum + ((item.weight ?? 0) * (item.quantity ?? 0)), 0);
  }

  getTotalCurrency(): number {
    return this.currentCurrency;
  }

  getCurrencyDisplay(): string {
    const converted = this.convertToMixedDenominations(this.currentCurrency);
    
    const parts: string[] = [];
    if (converted.broams > 0) parts.push(`${converted.broams}b`);
    if (converted.marks > 0) parts.push(`${converted.marks}mk`);
    if (converted.chips > 0) parts.push(`${converted.chips}c`);
    
    return parts.length > 0 ? parts.join(' ') : '0 broams';
  }

  private convertToMixedDenominations(marks: number): { chips: number; marks: number; broams: number } {
    const totalChips = Math.round(marks * 5);
    const broams = Math.floor(totalChips / 20);
    const remainingChips = totalChips % 20;
    const remainingMarks = Math.floor(remainingChips / 5);
    const chips = remainingChips % 5;

    return {
      chips,
      marks: remainingMarks,
      broams
    };
  }

  sellItem(itemId: string): void {
    this.identityService.currentCharacterId$
      .pipe(takeUntil(this.destroy$))
      .subscribe(characterId => {
        if (!characterId) return;

        this.equipmentApi.sellItem(characterId, itemId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              if (response.success && response.inventory) {
                this.currentInventory = response.inventory;
                this.inventoryItems = response.inventoryItems ?? [];
                this.currentCurrency = response.currency ?? 0;
                console.log('Item sold successfully');
                this.cdr.markForCheck();
              } else {
                console.error('Failed to sell item:', response.error);
              }
            },
            error: (err) => {
              console.error('Error selling item:', err);
            }
          });
      });
  }

  getStartingKitItems(): { item: InventoryItem; quantity: number }[] {
    if (!this.startingKit) return [];
    
    const kitItemIds = new Set<string>();
    [...this.startingKit.weapons, ...this.startingKit.armor, ...this.startingKit.equipment].forEach(kitItem => {
      kitItemIds.add(kitItem.itemId);
    });
    
    return this.inventoryItems
      .filter(item => kitItemIds.has(item.baseId ?? item.id))
      .map(item => ({
        item,
        quantity: item.quantity
      }));
  }

  nextStep(): void {
    this.router.navigate(['/character-creator-view/review']);
  }

  previousStep(): void {
    this.router.navigate(['/character-creator-view/talents']);
  }

  compareKits(k1: string | null, k2: string | null): boolean {
    return k1 === k2;
  }

  // Persist hook for CharacterCreatorView
  public async persistStep(): Promise<void> {
    const characterId = await firstValueFrom(
      this.identityService.currentCharacterId$.pipe(take(1))
    );
    if (!characterId || !this.currentInventory) return;

    try {
      const response = await firstValueFrom(
        this.equipmentApi.saveEquipment(characterId, this.currentInventory)
      );
      console.log('Equipment saved successfully:', response);
    } catch (error) {
      console.error('Failed to save equipment:', error);
    }
  }
}
