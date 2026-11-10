import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    pool: 'forks',
    testTimeout: 60000, // Longer timeout for live API calls
    hookTimeout: 10000,
    teardownTimeout: 10000,
    // Live API tests only - require RUN_LIVE_TESTS=1
    include: [
      'tests/bitcotasks-real-test.test.ts',
      'tests/bitcotasks-new-bearer.test.ts',
      'tests/network-quest-unique-provider.test.ts',
      'tests/active-time-e2e.test.ts',
      'tests/active-time-quest.test.ts',
      'verify-network-progress.test.ts',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/*.spec.ts', // Playwright E2E tests
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
