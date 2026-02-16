// Global test setup for Angular tests
require('zone.js');
require('zone.js/testing');

const { getTestBed } = require('@angular/core/testing');
const {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} = require('@angular/platform-browser-dynamic/testing');

let testBedInitialized = false;

if (!testBedInitialized) {
  console.log('Initializing TestBed...');
  const testBed = getTestBed();
  testBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  testBedInitialized = true;
  console.log('TestBed initialized successfully!');
}
