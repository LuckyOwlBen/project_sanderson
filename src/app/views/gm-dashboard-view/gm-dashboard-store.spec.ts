import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { GmDashboardView } from './gm-dashboard-view';
import { WebsocketService, StoreToggleEvent } from '../../services/websocket.service';

describe('GmDashboardView - Store Toggle', () => {
  let component: GmDashboardView;
  let mockWebsocketService: any;
  let mockCdr: any;
  let mockDialog: any;
  let mockSnackBar: any;
  let storeToggleSubject: Subject<StoreToggleEvent>;
  let connectedSubject: Subject<boolean>;
  let playerJoinedSubject: Subject<any>;
  let playerLeftSubject: Subject<any>;
  let playerResourceUpdateSubject: Subject<any>;
  let activePlayersSubject: Subject<any[]>;
  let playerCriticalSubject: Subject<any>;
  let levelUpSubject: Subject<any>;

  beforeEach(() => {
    storeToggleSubject = new Subject<StoreToggleEvent>();
    connectedSubject = new Subject<boolean>();
    playerJoinedSubject = new Subject<any>();
    playerLeftSubject = new Subject<any>();
    playerResourceUpdateSubject = new Subject<any>();
    activePlayersSubject = new Subject<any[]>();
    playerCriticalSubject = new Subject<any>();
    levelUpSubject = new Subject<any>();

    mockWebsocketService = {
      storeToggle$: storeToggleSubject.asObservable(),
      connected$: connectedSubject.asObservable(),
      playerJoined$: playerJoinedSubject.asObservable(),
      playerLeft$: playerLeftSubject.asObservable(),
      playerResourceUpdate$: playerResourceUpdateSubject.asObservable(),
      activePlayers$: activePlayersSubject.asObservable(),
      playerCritical$: playerCriticalSubject.asObservable(),
      levelUp$: levelUpSubject.asObservable(),
      toggleStore: vi.fn(),
      connect: vi.fn(),
      requestActivePlayers: vi.fn()
    };

    mockCdr = {
      detectChanges: vi.fn()
    };

    mockDialog = {
      open: vi.fn()
    };

    mockSnackBar = {
      open: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        GmDashboardView,
        { provide: WebsocketService, useValue: mockWebsocketService },
        { provide: ChangeDetectorRef, useValue: mockCdr },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    });

    component = TestBed.inject(GmDashboardView);
    component.ngOnInit();
  });

  it('should initialize with all stores enabled', () => {
    expect(component.storeEnabled.get('main-store')).toBe(true);
    expect(component.storeEnabled.get('weapons-shop')).toBe(true);
    expect(component.storeEnabled.get('armor-shop')).toBe(true);
    expect(component.storeEnabled.get('equipment-shop')).toBe(true);
    expect(component.storeEnabled.get('consumables-shop')).toBe(true);
    expect(component.storeEnabled.get('fabrials-shop')).toBe(true);
    expect(component.storeEnabled.get('mounts-shop')).toBe(true);
  });

  it('should toggle store state when toggleStore is called', () => {
    // Initial state is true
    expect(component.storeEnabled.get('main-store')).toBe(true);

    // Toggle to false
    component.toggleStore('main-store');

    expect(component.storeEnabled.get('main-store')).toBe(false);
    expect(mockWebsocketService.toggleStore).toHaveBeenCalledWith('main-store', false);

    // Toggle back to true
    component.toggleStore('main-store');

    expect(component.storeEnabled.get('main-store')).toBe(true);
    expect(mockWebsocketService.toggleStore).toHaveBeenCalledWith('main-store', true);
  });

  it('should only toggle the specific store, not others', () => {
    component.toggleStore('weapons-shop');

    expect(component.storeEnabled.get('weapons-shop')).toBe(false);
    expect(component.storeEnabled.get('main-store')).toBe(true);
    expect(component.storeEnabled.get('armor-shop')).toBe(true);
  });

  it('should update state when receiving store toggle events', () => {
    component.storeEnabled.set('armor-shop', true);

    storeToggleSubject.next({
      storeId: 'armor-shop',
      enabled: false,
      toggledBy: 'GM'
    });

    expect(component.storeEnabled.get('armor-shop')).toBe(false);
    expect(mockCdr.detectChanges).toHaveBeenCalled();
  });

  it('should call websocket service with correct parameters', () => {
    component.toggleStore('weapons-shop');

    expect(mockWebsocketService.toggleStore).toHaveBeenCalledWith('weapons-shop', false);
  });

  it('should handle toggling from false to true', () => {
    // Set to false first
    component.storeEnabled.set('main-store', false);

    component.toggleStore('main-store');

    expect(component.storeEnabled.get('main-store')).toBe(true);
    expect(mockWebsocketService.toggleStore).toHaveBeenCalledWith('main-store', true);
  });

  it('isStoreEnabled should return correct state', () => {
    component.storeEnabled.set('main-store', true);
    component.storeEnabled.set('weapons-shop', false);

    expect(component.isStoreEnabled('main-store')).toBe(true);
    expect(component.isStoreEnabled('weapons-shop')).toBe(false);
  });

  it('isStoreEnabled should default to true for unknown stores', () => {
    expect(component.isStoreEnabled('unknown-store')).toBe(true);
  });

  it('should sync state when receiving toggle events from server', () => {
    // Initial state
    component.storeEnabled.set('main-store', true);

    // Simulate receiving event from server (maybe from another GM client)
    storeToggleSubject.next({
      storeId: 'main-store',
      enabled: false,
      toggledBy: 'GM'
    });

    expect(component.storeEnabled.get('main-store')).toBe(false);
  });

  it('should handle multiple rapid toggles', () => {
    component.toggleStore('main-store'); // true -> false
    component.toggleStore('main-store'); // false -> true
    component.toggleStore('main-store'); // true -> false

    expect(component.storeEnabled.get('main-store')).toBe(false);
    expect(mockWebsocketService.toggleStore).toHaveBeenCalledTimes(3);
  });

  it('should update UI via change detection after toggle event', () => {
    mockCdr.detectChanges.mockClear();

    storeToggleSubject.next({
      storeId: 'main-store',
      enabled: false,
      toggledBy: 'GM'
    });

    expect(mockCdr.detectChanges).toHaveBeenCalled();
  });

  it('should maintain independent state for each store', () => {
    component.toggleStore('main-store');
    component.toggleStore('weapons-shop');

    expect(component.storeEnabled.get('main-store')).toBe(false);
    expect(component.storeEnabled.get('weapons-shop')).toBe(false);
    expect(component.storeEnabled.get('armor-shop')).toBe(true);

    component.toggleStore('armor-shop');

    expect(component.storeEnabled.get('main-store')).toBe(false);
    expect(component.storeEnabled.get('weapons-shop')).toBe(false);
    expect(component.storeEnabled.get('armor-shop')).toBe(false);
  });

  it('should toggle new store types independently', () => {
    component.toggleStore('equipment-shop');
    component.toggleStore('consumables-shop');

    expect(component.storeEnabled.get('equipment-shop')).toBe(false);
    expect(component.storeEnabled.get('consumables-shop')).toBe(false);
    expect(component.storeEnabled.get('fabrials-shop')).toBe(true);
    expect(component.storeEnabled.get('mounts-shop')).toBe(true);
  });

  it('should toggle fabrials and mounts shops', () => {
    component.toggleStore('fabrials-shop');
    component.toggleStore('mounts-shop');

    expect(component.storeEnabled.get('fabrials-shop')).toBe(false);
    expect(component.storeEnabled.get('mounts-shop')).toBe(false);
    expect(component.storeEnabled.get('main-store')).toBe(true);
  });
});
