import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { Subject, of } from 'rxjs';
import { StoreView } from './store-view';
import { CharacterStateService } from '../../character/characterStateService';
import { WebsocketService, StoreToggleEvent } from '../../services/websocket.service';
import { Character } from '../../character/character';

describe('StoreView - Category Filtering', () => {
  let component: StoreView;
  let mockCharacterState: any;
  let mockWebsocketService: any;
  let mockActivatedRoute: any;
  let mockChangeDetectorRef: any;
  let characterSubject: Subject<Character | null>;
  let storeToggleSubject: Subject<StoreToggleEvent>;

  beforeEach(() => {
    characterSubject = new Subject<Character | null>();
    storeToggleSubject = new Subject<StoreToggleEvent>();

    mockCharacterState = {
      character$: characterSubject.asObservable()
    };

    mockWebsocketService = {
      storeToggle$: storeToggleSubject.asObservable(),
      emitStoreTransaction: vi.fn()
    };

    mockActivatedRoute = {
      paramMap: of(null),
      data: of({})
    };

    mockChangeDetectorRef = {
      detectChanges: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        StoreView,
        { provide: CharacterStateService, useValue: mockCharacterState },
        { provide: WebsocketService, useValue: mockWebsocketService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef }
      ]
    });

    component = TestBed.inject(StoreView);
    component.ngOnInit();
  });

  it('should initialize with storeEnabled as true', () => {
    expect(component.storeEnabled).toBe(true);
  });

  it('should handle main-store toggle to disable entire store', () => {
    component.storeEnabled = true;

    storeToggleSubject.next({
      storeId: 'main-store',
      enabled: false,
      toggledBy: 'GM'
    });

    expect(component.storeEnabled).toBe(false);
  });

  it('should handle main-store toggle to enable entire store', () => {
    component.storeEnabled = false;

    storeToggleSubject.next({
      storeId: 'main-store',
      enabled: true,
      toggledBy: 'GM'
    });

    expect(component.storeEnabled).toBe(true);
  });

  it('should filter out weapons when weapons-shop is disabled', () => {
    storeToggleSubject.next({
      storeId: 'weapons-shop',
      enabled: false,
      toggledBy: 'GM'
    });

    const disabled = component.getDisabledCategories();
    expect(disabled).toContain('weapon');
  });

  it('should filter out armor when armor-shop is disabled', () => {
    storeToggleSubject.next({
      storeId: 'armor-shop',
      enabled: false,
      toggledBy: 'GM'
    });

    const disabled = component.getDisabledCategories();
    expect(disabled).toContain('armor');
  });

  it('should filter out equipment when equipment-shop is disabled', () => {
    storeToggleSubject.next({
      storeId: 'equipment-shop',
      enabled: false,
      toggledBy: 'GM'
    });

    const disabled = component.getDisabledCategories();
    expect(disabled).toContain('equipment');
  });

  it('should filter out consumables when consumables-shop is disabled', () => {
    storeToggleSubject.next({
      storeId: 'consumables-shop',
      enabled: false,
      toggledBy: 'GM'
    });

    const disabled = component.getDisabledCategories();
    expect(disabled).toContain('consumable');
  });

  it('should filter out fabrials when fabrials-shop is disabled', () => {
    storeToggleSubject.next({
      storeId: 'fabrials-shop',
      enabled: false,
      toggledBy: 'GM'
    });

    const disabled = component.getDisabledCategories();
    expect(disabled).toContain('fabrial');
  });

  it('should filter out mounts when mounts-shop is disabled', () => {
    storeToggleSubject.next({
      storeId: 'mounts-shop',
      enabled: false,
      toggledBy: 'GM'
    });

    const disabled = component.getDisabledCategories();
    expect(disabled).toContain('mount');
  });

  it('should track multiple disabled categories', () => {
    storeToggleSubject.next({
      storeId: 'weapons-shop',
      enabled: false,
      toggledBy: 'GM'
    });

    storeToggleSubject.next({
      storeId: 'armor-shop',
      enabled: false,
      toggledBy: 'GM'
    });

    const disabled = component.getDisabledCategories();
    expect(disabled).toContain('weapon');
    expect(disabled).toContain('armor');
    expect(disabled.length).toBe(2);
  });

  it('should re-enable categories when toggled back on', () => {
    // Disable weapons
    storeToggleSubject.next({
      storeId: 'weapons-shop',
      enabled: false,
      toggledBy: 'GM'
    });

    let disabled = component.getDisabledCategories();
    expect(disabled).toContain('weapon');

    // Re-enable weapons
    storeToggleSubject.next({
      storeId: 'weapons-shop',
      enabled: true,
      toggledBy: 'GM'
    });

    disabled = component.getDisabledCategories();
    expect(disabled).not.toContain('weapon');
  });

  it('should return empty array when all categories enabled', () => {
    const disabled = component.getDisabledCategories();
    expect(disabled.length).toBe(0);
  });

  it('should generate disabled categories message', () => {
    storeToggleSubject.next({
      storeId: 'weapons-shop',
      enabled: false,
      toggledBy: 'GM'
    });

    const message = component.getDisabledCategoriesMessage();
    expect(message).toBe('Weapons');
  });

  it('should generate disabled categories message for multiple categories', () => {
    storeToggleSubject.next({
      storeId: 'weapons-shop',
      enabled: false,
      toggledBy: 'GM'
    });

    storeToggleSubject.next({
      storeId: 'fabrials-shop',
      enabled: false,
      toggledBy: 'GM'
    });

    const message = component.getDisabledCategoriesMessage();
    expect(message).toContain('Weapons');
    expect(message).toContain('Fabrials');
  });
});

describe('StoreView - Store Info', () => {
  let component: StoreView;
  let mockCharacterState: any;
  let mockWebsocketService: any;
  let mockActivatedRoute: any;
  let mockChangeDetectorRef: any;

  beforeEach(() => {
    mockCharacterState = {
      character$: of(null)
    };

    mockWebsocketService = {
      storeToggle$: of(),
      emitStoreTransaction: vi.fn()
    };

    mockActivatedRoute = {
      paramMap: of(null),
      data: of({})
    };

    mockChangeDetectorRef = {
      detectChanges: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        StoreView,
        { provide: CharacterStateService, useValue: mockCharacterState },
        { provide: WebsocketService, useValue: mockWebsocketService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef }
      ]
    });

    component = TestBed.inject(StoreView);
    component.ngOnInit();
  });

  it('should return General Store as store name', () => {
    expect(component.getStoreName()).toBe('General Store');
  });

  it('should return store icon', () => {
    expect(component.getStoreIcon()).toBe('🏪');
  });

  it('should return store description', () => {
    expect(component.getStoreDescription()).toBe('Browse and purchase equipment for your adventures');
  });
});
