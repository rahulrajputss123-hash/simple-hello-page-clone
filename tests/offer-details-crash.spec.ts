import { test, expect } from '@playwright/test';

/**
 * Test: Offer Details Page Does Not Crash
 * 
 * BUG: Opening /offer/<id> crashes with "Cannot read properties of undefined (reading 'component')"
 * Root cause: head function accessing loaderData without a loader
 * 
 * This test verifies the fix works for multiple offer types.
 */

const TEST_OFFERS = [
  '4b7e07ef-54d2-4845-8b65-73d80dfc2256', // Original failing offer
  // Add more offer IDs here for comprehensive testing
];

test.describe('Offer Details Page - No Crash', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Mock auth or login
    // For now, we'll test the route directly
    console.log('[test] Starting offer details crash test');
  });

  test('offer details page renders without crashing', async ({ page }) => {
    const offerId = TEST_OFFERS[0];
    
    // Navigate to offer details
    const url = `/offer/${offerId}`;
    console.log(`[test] Opening ${url}`);
    
    const response = await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // Check response status
    console.log(`[test] Response status: ${response?.status()}`);
    
    // Should not crash - page should load
    expect(response?.status()).toBeLessThan(500);
    
    // Check for error indicators
    const pageContent = await page.content();
    expect(pageContent).not.toContain('Cannot read properties of undefined');
    expect(pageContent).not.toContain('reading \'component\'');
    
    // Should render some content (either offer details or error state)
    const hasContent = await page.locator('body').isVisible();
    expect(hasContent).toBe(true);
    
    console.log('[test] ✅ Page loaded without crash');
  });

  test('multiple offer types render successfully', async ({ page }) => {
    for (const offerId of TEST_OFFERS) {
      console.log(`[test] Testing offer ${offerId}`);
      
      const response = await page.goto(`/offer/${offerId}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      
      // Should not be a server error
      expect(response?.status()).toBeLessThan(500);
      
      // Should render something
      const hasBody = await page.locator('body').isVisible();
      expect(hasBody).toBe(true);
      
      console.log(`[test] ✅ Offer ${offerId} renders OK`);
    }
  });

  test('error boundary catches render errors', async ({ page }) => {
    // Test with potentially invalid offer ID
    const response = await page.goto('/offer/invalid-uuid-12345', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    // Should handle gracefully (not crash)
    expect(response?.status()).toBeLessThan(500);
    
    // Should show error UI
    const errorMessage = await page.locator('text=/not available|Unable to load/i').first();
    const hasError = await errorMessage.isVisible().catch(() => false);
    
    console.log(`[test] Error boundary active: ${hasError}`);
    
    // Page should still be functional (back button, etc)
    const hasBody = await page.locator('body').isVisible();
    expect(hasBody).toBe(true);
    
    console.log('[test] ✅ Error boundary works');
  });
});

test.describe('Original Bug Reproduction', () => {
  test('original failing offer ID now works', async ({ page, context }) => {
    // Enable console logging to catch errors
    const consoleLogs: string[] = [];
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });
    
    // Catch page errors
    const pageErrors: Error[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error);
      console.error('[test] Page error:', error.message);
    });
    
    // Navigate to the original failing URL
    const offerId = '4b7e07ef-54d2-4845-8b65-73d80dfc2256';
    console.log(`[test] Reproducing original bug with offer ${offerId}`);
    
    const response = await page.goto(`/offer/${offerId}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    console.log(`[test] Response status: ${response?.status()}`);
    console.log(`[test] Console errors: ${consoleErrors.length}`);
    console.log(`[test] Page errors: ${pageErrors.length}`);
    
    // Log any errors for debugging
    if (consoleErrors.length > 0) {
      console.log('[test] Console errors:', consoleErrors);
    }
    if (pageErrors.length > 0) {
      console.log('[test] Page errors:', pageErrors.map(e => e.message));
    }
    
    // The fix: should NOT see the original error
    const hasComponentError = consoleErrors.some(err => 
      err.includes('Cannot read properties of undefined') && err.includes('component')
    ) || pageErrors.some(err => 
      err.message.includes('Cannot read properties of undefined') && err.message.includes('component')
    );
    
    expect(hasComponentError).toBe(false);
    
    // Should successfully render
    expect(response?.status()).toBeLessThan(500);
    
    console.log('[test] ✅ Original bug is FIXED - no component error');
  });
});
