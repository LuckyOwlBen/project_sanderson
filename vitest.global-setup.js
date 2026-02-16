// Global setup file - runs once before all tests
async function setup() {
  console.log('[vitest.global-setup] Starting global setup...');
  // Import modules dynamically for global setup
  require('zone.js');
  require('zone.js/testing');

  const { getTestBed } = require('@angular/core/testing');
  const {
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting,
  } = require('@angular/platform-browser-dynamic/testing');

  console.log('[vitest.global-setup] Initializing Angular TestBed...');
  getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  console.log('[vitest.global-setup] Angular TestBed initialized successfully');
}

async function teardown() {
  console.log('[vitest.global-setup] Tearing down');
}

module.exports = { setup, teardown };
