import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

// Initialize TestBed before anything else
const testBed = getTestBed();
try {
  testBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
} catch (e) {
  // Already initialized, that's fine
}

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceTracker } from './resource-tracker';

describe('ResourceTracker', () => {
  let component: ResourceTracker;
  let fixture: ComponentFixture<ResourceTracker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceTracker],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceTracker);
    component = fixture.componentInstance;
    // Set required input before detectChanges
    component.resource = {
      name: 'Health',
      current: 10,
      max: 20,
      icon: 'favorite',
      color: '#f44336',
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
