import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface InventoryItemDTO {
  itemId: string;
  quantity: number;
  equipped: boolean;
}

export interface InventoryDTO {
  items: InventoryItemDTO[];
  equipped: {
    armor: InventoryItemDTO | null;
    weapons: InventoryItemDTO[];
  };
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: string;
  rarity: string;
  price: number;
  weight?: number;
  quantity?: number;
}

export interface InventoryViewItem extends InventoryItem {
  baseId: string;
  quantity: number;
}

export interface StartingKitDTO {
  id: string;
  name: string;
  description: string;
  weapons: { itemId: string; quantity: number }[];
  armor: { itemId: string; quantity: number }[];
  equipment: { itemId: string; quantity: number }[];
  currency: number;
  additionalExpertise?: string;
  connection?: string;
}

export interface EquipmentResponse {
  success: boolean;
  inventory?: InventoryDTO;
  inventoryItems?: InventoryViewItem[];
  currency?: number;
  error?: string;
}

export interface PurchaseResponse {
  success: boolean;
  inventory?: InventoryDTO;
  inventoryItems?: InventoryViewItem[];
  currency?: number;
  message?: string;
  error?: string;
}

export interface KitResponse {
  success: boolean;
  inventory?: InventoryDTO;
  inventoryItems?: InventoryViewItem[];
  appliedKit?: string;
  currency?: number;
  message?: string;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class EquipmentApiService {
  private apiBase = window.location.hostname === 'localhost' && window.location.port === '4200'
    ? 'http://localhost:3000/api'
    : '/api';
  private charactersUrl = `${this.apiBase}/characters`;

  constructor(private http: HttpClient) {}

  getEquipment(characterId: string): Observable<EquipmentResponse> {
    return this.http
      .get<EquipmentResponse>(`${this.charactersUrl}/${characterId}/equipment`)
      .pipe(
        map((response) => response)
      );
  }

  saveEquipment(characterId: string, inventory: InventoryDTO): Observable<InventoryDTO | null> {
    return this.http
      .post<EquipmentResponse>(`${this.charactersUrl}/${characterId}/equipment`, { inventory })
      .pipe(
        map((response) => {
          if (!response?.success) {
            return null;
          }
          return response.inventory || null;
        })
      );
  }

  purchaseItem(characterId: string, itemId: string, quantity: number = 1): Observable<PurchaseResponse> {
    return this.http
      .post<PurchaseResponse>(`${this.charactersUrl}/${characterId}/equipment/purchase`, { itemId, quantity });
  }

  applyStartingKit(characterId: string, kitId: string): Observable<KitResponse> {
    return this.http
      .post<KitResponse>(`${this.charactersUrl}/${characterId}/equipment/apply-kit`, { kitId });
  }

  refundStartingKit(characterId: string): Observable<KitResponse> {
    return this.http
      .post<KitResponse>(`${this.charactersUrl}/${characterId}/equipment/refund-kit`, {});
  }

  getAvailableKits(): Observable<StartingKitDTO[]> {
    return this.http
      .get<{ success: boolean; kits: StartingKitDTO[] }>(`${this.apiBase}/equipment/kits`)
      .pipe(
        map((response) => response?.kits || [])
      );
  }

  getStoreItems(): Observable<InventoryItem[]> {
    return this.http
      .get<{ success: boolean; items: InventoryItem[] }>(`${this.apiBase}/equipment/store`)
      .pipe(
        map((response) => response?.items || [])
      );
  }
}
