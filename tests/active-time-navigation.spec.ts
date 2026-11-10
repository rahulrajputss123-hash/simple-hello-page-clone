import { test, expect } from '@playwright/test';

/**
 * Test: Active Time Timer Persists Across Navigation
 * 
 * Verify that the active time quest timer does NOT reset when navigating
 * between pages. The timer value should continue from where it left off.
 * 
 * Test flow:
 * 1. Login as test user
 * 2. Navigate to home page with active time quest
 * 3. Record the displayed timer value
 * 4. Navigate to /offers page
 * 5. Navigate to /task page  
 * 6. Navigate back to /home
 * 7. Verify timer value did not decrease (should be same or higher)
 */

test.describe('Active Time Navigation Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    // TODO: Replace with your test user credentials
    await page.goto('/auth');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for redirect to home
    await page.waitForURL('/home');
  });

  test('timer value persists across 3 page navigations', async ({ page }) => {
    // Step 1: On home page, find active time quest card
    await page.waitForSelector('[data-testid^="quest-active-time-status-"]', { timeout: 10000 });
    
    // Extract initial timer value (format: "MM:SS / TARGET")
    const timerText1 = await page.textContent('[data-testid^="quest-active-time-status-"] [data-testid="compact-timer-display"]');
    const initialSeconds = parseTimerText(timerText1);
    
    console.log(`Initial timer on /home: ${timerText1} (${initialSeconds}s)`);
    expect(initialSeconds).toBeGreaterThanOrEqual(0);

    // Step 2: Navigate to /offers
    await page.click('[href="/offers"]');
    await page.waitForURL('/offers');
    await page.waitForTimeout(1000); // Give UI time to render
    
    // Timer might not be visible on offers page, that's OK
    console.log('Navigated to /offers');

    // Step 3: Navigate to /task (or any other page)
    await page.click('[href="/task"]');
    await page.waitForURL('/task');
    await page.waitForTimeout(1000);
    
    console.log('Navigated to /task');

    // Step 4: Navigate back to /home
    await page.click('[href="/home"]');
    await page.waitForURL('/home');
    await page.waitForTimeout(1000);
    
    // Step 5: Check timer value again
    await page.waitForSelector('[data-testid^="quest-active-time-status-"]', { timeout: 10000 });
    const timerText2 = await page.textContent('[data-testid^="quest-active-time-status-"] [data-testid="compact-timer-display"]');
    const finalSeconds = parseTimerText(timerText2);
    
    console.log(`Final timer on /home: ${timerText2} (${finalSeconds}s)`);

    // Assertion: Timer should NOT have decreased
    // It should be same or higher (accounting for local ticks during navigation)
    expect(finalSeconds).toBeGreaterThanOrEqual(initialSeconds);
    
    // Additionally verify it didn't reset to 0
    expect(finalSeconds).toBeGreaterThan(0);
    
    console.log(`✅ Timer persisted! Initial: ${initialSeconds}s, Final: ${finalSeconds}s`);
  });

  test('timer continues ticking during navigation', async ({ page }) => {
    // This test verifies the timer actually increments even during navigation
    
    await page.waitForSelector('[data-testid^="quest-active-time-status-"]', { timeout: 10000 });
    
    const timerText1 = await page.textContent('[data-testid^="quest-active-time-status-"] [data-testid="compact-timer-display"]');
    const initialSeconds = parseTimerText(timerText1);
    
    console.log(`Starting timer: ${timerText1} (${initialSeconds}s)`);

    // Navigate through multiple pages slowly
    await page.click('[href="/offers"]');
    await page.waitForURL('/offers');
    await page.waitForTimeout(2000);
    
    await page.click('[href="/profile"]');
    await page.waitForURL('/profile');
    await page.waitForTimeout(2000);
    
    await page.click('[href="/wallet"]');
    await page.waitForURL('/wallet');
    await page.waitForTimeout(2000);
    
    await page.click('[href="/home"]');
    await page.waitForURL('/home');
    await page.waitForTimeout(1000);
    
    // Check final value (should be ~6+ seconds higher due to local ticking)
    await page.waitForSelector('[data-testid^="quest-active-time-status-"]', { timeout: 10000 });
    const timerText2 = await page.textContent('[data-testid^="quest-active-time-status-"] [data-testid="compact-timer-display"]');
    const finalSeconds = parseTimerText(timerText2);
    
    console.log(`Ending timer: ${timerText2} (${finalSeconds}s)`);
    
    // Should have increased by at least 5 seconds (6s of navigation time, minus some buffer)
    const increase = finalSeconds - initialSeconds;
    expect(increase).toBeGreaterThanOrEqual(5);
    
    console.log(`✅ Timer continued ticking! Increased by ${increase}s during navigation`);
  });
});

/**
 * Parse timer text like "12:34 / 120:00" into seconds
 */
function parseTimerText(text: string | null): number {
  if (!text) return 0;
  
  // Extract just the current time (before the /)
  const match = text.match(/(\d+):(\d+)/);
  if (!match) return 0;
  
  const minutes = parseInt(match[1], 10);
  const seconds = parseInt(match[2], 10);
  
  return minutes * 60 + seconds;
}
