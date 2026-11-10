// Test setup file - runs before all tests
// Read environment variables from process.env (not hardcoded)
import { vi } from 'vitest';

// Read secrets from environment (CI should provide these)
// Tests needing missing keys will skip, not fail
const envKeys = [
  'BITCOTASKS_API_KEY',
  'BITCOTASKS_BEARER',
  'BITCOTASKS_SECRET',
  'OFFERWALLME_API_KEY',
  'OFFERWALLME_SECRET_KEY',
  'THEOREMREACH_API_KEY',
  'THEOREMREACH_SECRET_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const isLiveTest = process.env.RUN_LIVE_TESTS === '1';

if (isLiveTest) {
  console.log('[TEST SETUP] Live API tests enabled - will make real network calls');
} else {
  console.log('[TEST SETUP] Unit tests - fetch will be mocked by default');
  // Mock fetch globally for unit tests (tests can override if needed)
  // This prevents accidental network calls in unit tests
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network calls are not allowed in unit tests. Use vi.mocked(fetch).mockResolvedValue() to mock responses.')));
}

// Check for missing keys (don't fail, just warn)
const missingKeys = envKeys.filter(key => !process.env[key]);
if (missingKeys.length > 0) {
  console.warn(`[TEST SETUP] Missing env vars: ${missingKeys.join(', ')} - tests requiring these will skip`);
} else {
  console.log('[TEST SETUP] All required environment variables present');
}
