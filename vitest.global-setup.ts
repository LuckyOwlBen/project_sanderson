import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

export async function setup() {
  console.log('[vitest.global-setup] Setting up Angular TestBed globally...');
  getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  console.log('[vitest.global-setup] Angular TestBed initialized');
}

export async function teardown() {
  console.log('[vitest.global-setup] Teardown complete');
}
