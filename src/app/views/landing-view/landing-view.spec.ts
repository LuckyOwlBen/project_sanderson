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

import { LandingView } from './landing-view';

describe('LandingView', () => {
  let component: LandingView;
  let fixture: ComponentFixture<LandingView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingView],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
