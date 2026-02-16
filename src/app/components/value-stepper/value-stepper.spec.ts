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
import { ValueStepper } from './value-stepper';

describe('ValueStepper', () => {
  let component: ValueStepper;
  let fixture: ComponentFixture<ValueStepper>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValueStepper],
    }).compileComponents();

    fixture = TestBed.createComponent(ValueStepper);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
