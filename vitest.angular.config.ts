import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

export default defineConfig({
  plugins: [angular({ tsconfig: './tsconfig.spec.json' })],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    setupFiles: [],
    transformMode: {
      web: [/\.[jt]sx?$/],
    },
    // Initialize TestBed before any tests run
    onBeforeRun() {
      console.log('Initializing TestBed in onBeforeRun...');
      const testBed = getTestBed();
      testBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
      console.log('TestBed initialized!');
    },
  },
});
