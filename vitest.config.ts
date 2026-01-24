import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.spec.ts', '**/*.spec.js', 'server/**/*.spec.ts', 'server/**/*.spec.js'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    setupFiles: [],
  },
});
