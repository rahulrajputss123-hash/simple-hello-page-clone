import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    pool: 'forks', // Use forks instead of threads to inherit env vars
    env: {
      BITCOTASKS_API_KEY: 'ly1j8t2vzuae1yr93w6j9xyc9el368',
      BITCOTASKS_BEARER: 'ly1j8t2vzuae1yr93w6j9xyc9el368',
      BITCOTASKS_SECRET: '3b92c8f6e76f5f4e8a44029d767b44e0',
      OFFERWALLME_API_KEY: 'QHvPl1a7Rl8BdLSLh6MLDpTEJpN1a1',
      OFFERWALLME_SECRET_KEY: 'kgQ4xBE8AVLYxL5RFtVLiPXapFMsG6Oo',
      THEOREMREACH_API_KEY: '7b65000d4265e318df10b30d7b42',
      THEOREMREACH_SECRET_KEY: '6e5c14b2bfb18b69a31b881938e6cac6c56ad679',
    },
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      'src/lib/marketplace/pricing.test.ts', // Not a proper test suite (console-based script)
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
