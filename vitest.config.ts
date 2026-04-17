import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'shared': path.resolve(__dirname, 'shared'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.spec.ts', '**/*.spec.js', 'server/**/*.spec.ts', 'server/**/*.spec.js'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    setupFiles: [],
  },
});
