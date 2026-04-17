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
    include: ['server/**/*.spec.{ts,js}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    globalSetup: ['./vitest.global-setup.server.ts'],
  },
});
