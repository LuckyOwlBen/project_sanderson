import 'zone.js';
import 'zone.js/testing';

import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

let testBedInitialized = false;

export function ensureTestBedInitialized() {
  if (testBedInitialized) {
    return;
  }

  const testBed = getTestBed();
  testBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  testBedInitialized = true;
}

// Initialize immediately on import
ensureTestBedInitialized();
