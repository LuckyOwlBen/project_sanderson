import 'zone.js';
import 'zone.js/testing';

import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

// Initialize TestBed BEFORE any tests run
const testBed = getTestBed();
console.log('test-setup.ts: Initializing TestBed');

try {
  testBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  console.log('test-setup.ts: TestBed initialized successfully');
} catch (e: any) {
  console.log('test-setup.ts: TestBed already initialized, skipping');
}
