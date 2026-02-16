import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

// Initialize TestBed before anything else
const testBed = getTestBed();
try {
  testBed.initTestEnvironment(
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting(),
  );
} catch (e) {
  // Already initialized, that's fine
}

import { TestBed } from '@angular/core/testing';

import { CharacterCreationFlowService } from './character-creation-flow-service';

describe('CharacterCreationFlowService', () => {
  let service: CharacterCreationFlowService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CharacterCreationFlowService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
