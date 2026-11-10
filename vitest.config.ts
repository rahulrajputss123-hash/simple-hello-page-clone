import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    pool: 'forks', // Use forks instead of threads to inherit env vars
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    // Unit tests only: src/**/*.test.ts and explicit unit tests in tests/
    include: [
      'src/**/*.test.ts',
      'tests/offer-adapters.test.ts',
      'tests/feed-adapters.test.ts',
      'tests/torox-postback.test.ts',
      'tests/postback-complete.test.ts',
      'tests/quest-postback-money-safety.test.ts',
      'tests/offerwall-signature.test.ts',
      'tests/theoremreach-signing.test.ts',
      'tests/questsmanager-validation.test.ts',
      'tests/gemiad-validate-config.test.ts',
      'tests/torox-adapter-no-context.test.ts',
      'tests/quest-network-postback-fixtures.test.ts',
      'tests/feed-quest-production-fixes.test.ts',
      'tests/quest-server-fn-fixes.test.ts',
      'tests/feed-auth-errors.test.ts',
      'tests/quest-token-isolation.test.ts',
      'tests/feed-quest-context-fix.test.ts',
      'tests/feed-quest-persistence.test.ts',
      'tests/quest-network-adswedmedia.test.ts',
      'tests/marketplace/razorpay.server.test.ts',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      'src/lib/marketplace/pricing.test.ts', // Not a proper test suite (console-based script)
      '**/*.spec.ts', // Playwright E2E tests
      'tests/*-real-test.test.ts', // Live API tests
      'tests/*-e2e.test.ts', // E2E tests
      'tests/bitcotasks-new-bearer.test.ts', // Live API test
      'tests/network-quest-unique-provider.test.ts', // Live API test
      'verify-network-progress.test.ts', // Live E2E test
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
