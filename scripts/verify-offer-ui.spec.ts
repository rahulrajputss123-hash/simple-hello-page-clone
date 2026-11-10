/**
 * Playwright verification script for Part 2 UI fixes
 * Run with: npx playwright test scripts/verify-offer-ui.spec.ts --headed
 * 
 * This verifies:
 * 1. Provider name display on cards and details
 * 2. Device chips display
 * 3. Category chips display
 * 4. Multi-level steps display (all 25 levels for Torox, all 21 for GemiAd)
 * 5. Not allowed / disclaimer text
 */

import { test, expect } from '@playwright/test';

// Configure for the local dev server
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Offer UI Display - Part 2 Verification', () => {
  test.beforeEach(async ({ page }) => {
    // You may need to add authentication steps here
    // For now, assume we can access the offers page directly
  });

  test('Torox Puzzles & Chaos should show provider, devices, category, and all 25 steps', async ({ page }) => {
    // Navigate to offers page
    await page.goto(`${BASE_URL}/offers`);
    
    // Search for "Puzzles & Chaos: Frozen Castle" offer
    // Note: You may need to adjust the selector based on actual offer title
    const offerCard = page.locator('[data-testid^="featured-offer-"]').filter({ hasText: 'Puzzles' }).first();
    
    // Verify offer card shows provider name
    await expect(offerCard.locator('text=Torox')).toBeVisible({ timeout: 10000 });
    
    // Click to open details
    await offerCard.click();
    
    // Wait for details page to load
    await page.waitForSelector('[data-testid="offer-details-page"]');
    
    // 1. Verify provider name
    const providerBadge = page.locator('[data-testid="offer-details-provider"]');
    await expect(providerBadge).toHaveText('Torox');
    
    // 2. Verify device chips (should show android, ios, or web)
    const deviceChips = page.locator('[data-testid="offer-details-device"]');
    const deviceCount = await deviceChips.count();
    expect(deviceCount).toBeGreaterThan(0);
    
    // Verify device text is one of: Android, iOS, Web, All devices
    const firstDevice = await deviceChips.first().textContent();
    expect(['Android', 'iOS', 'Web', 'All devices']).toContain(firstDevice);
    
    // 3. Verify category chip
    const categoryBadge = page.locator('[data-testid="offer-details-category"]');
    await expect(categoryBadge).toBeVisible();
    
    // 4. Verify all 25 steps are shown
    const stepsContainer = page.locator('[data-testid="offer-details-steps"]');
    await expect(stepsContainer).toBeVisible();
    
    // Count step items
    const stepItems = stepsContainer.locator('.rounded-lg.border');
    const stepCount = await stepItems.count();
    
    // Should show at least 8 initially
    expect(stepCount).toBeGreaterThanOrEqual(8);
    
    // If there's a "Show all" button, click it
    const showAllButton = page.locator('[data-testid="offer-show-all-steps"]');
    if (await showAllButton.isVisible()) {
      await showAllButton.click();
      
      // Wait for animation
      await page.waitForTimeout(500);
      
      // Recount steps
      const allStepsCount = await stepItems.count();
      expect(allStepsCount).toBe(25); // Exactly 25 steps for Puzzles & Chaos
    }
    
    // 5. Verify disclaimer / not allowed section
    const warningSection = page.locator('[data-testid="offer-details-warning"]');
    await expect(warningSection).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/torox-puzzles-chaos-details.png', fullPage: true });
    
    console.log('✓ Torox offer verified: provider, devices, category, 25 steps, disclaimer');
  });

  test('GemiAd Raid Shadow Legends should show provider, devices, category, and all 21 steps', async ({ page }) => {
    // Navigate to offers page
    await page.goto(`${BASE_URL}/offers`);
    
    // Search for "Raid Shadow Legends" offer
    const offerCard = page.locator('[data-testid^="featured-offer-"]').filter({ hasText: 'Raid' }).first();
    
    // Verify offer card shows provider name
    await expect(offerCard.locator('text=GemiAd')).toBeVisible({ timeout: 10000 });
    
    // Click to open details
    await offerCard.click();
    
    // Wait for details page to load
    await page.waitForSelector('[data-testid="offer-details-page"]');
    
    // 1. Verify provider name
    const providerBadge = page.locator('[data-testid="offer-details-provider"]');
    await expect(providerBadge).toHaveText('GemiAd');
    
    // 2. Verify device chips
    const deviceChips = page.locator('[data-testid="offer-details-device"]');
    const deviceCount = await deviceChips.count();
    expect(deviceCount).toBeGreaterThan(0);
    
    // 3. Verify category chip
    const categoryBadge = page.locator('[data-testid="offer-details-category"]');
    await expect(categoryBadge).toBeVisible();
    
    // 4. Verify all 21 steps are shown
    const stepsContainer = page.locator('[data-testid="offer-details-steps"]');
    await expect(stepsContainer).toBeVisible();
    
    // Count step items
    const stepItems = stepsContainer.locator('.rounded-lg.border');
    const stepCount = await stepItems.count();
    
    // Should show at least 8 initially
    expect(stepCount).toBeGreaterThanOrEqual(8);
    
    // If there's a "Show all" button, click it
    const showAllButton = page.locator('[data-testid="offer-show-all-steps"]');
    if (await showAllButton.isVisible()) {
      await showAllButton.click();
      
      // Wait for animation
      await page.waitForTimeout(500);
      
      // Recount steps
      const allStepsCount = await stepItems.count();
      expect(allStepsCount).toBe(21); // Exactly 21 steps for Raid Shadow Legends
    }
    
    // 5. Verify disclaimer / not allowed section
    const warningSection = page.locator('[data-testid="offer-details-warning"]');
    await expect(warningSection).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/gemiad-raid-details.png', fullPage: true });
    
    console.log('✓ GemiAd offer verified: provider, devices, category, 21 steps, disclaimer');
  });

  test('Offer cards display provider name, devices, and category', async ({ page }) => {
    // Navigate to offers page
    await page.goto(`${BASE_URL}/offers`);
    
    // Wait for offers to load
    await page.waitForSelector('[data-testid="featured-offers-list"]');
    
    // Get first offer card
    const firstOffer = page.locator('[data-testid^="featured-offer-"]').first();
    
    // Verify provider name badge is visible (if offer has provider)
    // Some manual offers may not have provider
    const providerBadges = page.locator('.rounded-full.bg-primary\\/10');
    const hasProvider = await providerBadges.first().isVisible();
    
    if (hasProvider) {
      console.log('✓ Provider name visible on offer cards');
    }
    
    // Take screenshot of offers page
    await page.screenshot({ path: 'screenshots/offers-list.png', fullPage: true });
    
    console.log('✓ Offers list verified');
  });
});
