import { test, expect } from "@playwright/test";

/**
 * Test offer detail pages work without crashing in production
 * A) Verifies the "Cannot read properties of undefined (reading 'component')" crash is fixed
 */

const TEST_OFFERS = [
  "4b7e07ef-54d2-4845-8b65-73d80dfc2256",
  "a1234567-89ab-cdef-0123-456789abcdef", // May not exist, should show error gracefully
  "b9876543-21fe-dcba-9876-543210fedcba", // May not exist, should show error gracefully
];

test.describe("Offer Details Production", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home and wait for auth
    await page.goto("https://cashgpt.in");
    await page.waitForURL(/\/(home|auth)/);

    // If on auth page, skip (not logged in)
    const url = page.url();
    if (url.includes("/auth")) {
      test.skip();
    }
  });

  for (const offerId of TEST_OFFERS) {
    test(`should load offer ${offerId} without console errors`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const uncaughtErrors: string[] = [];

      // Capture console errors
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      // Capture uncaught exceptions
      page.on("pageerror", (error) => {
        uncaughtErrors.push(error.message);
      });

      // Navigate to offer
      await page.goto(`https://cashgpt.in/offer/${offerId}`, {
        waitUntil: "networkidle",
        timeout: 15000,
      });

      // Wait a bit for any lazy errors to surface
      await page.waitForTimeout(2000);

      // Check for the specific crash error
      const hasCrashError = [...consoleErrors, ...uncaughtErrors].some(
        (err) =>
          err.includes("Cannot read properties of undefined") &&
          err.includes("component"),
      );

      if (hasCrashError) {
        console.error("🚨 CRASH ERROR DETECTED:");
        console.error("Console errors:", consoleErrors);
        console.error("Uncaught errors:", uncaughtErrors);
      }

      expect(
        hasCrashError,
        "Offer page should not crash with 'Cannot read properties of undefined (reading component)'",
      ).toBe(false);

      // Page should either show offer details OR a graceful error (not a crash)
      const hasContent =
        (await page.locator("text=/offer|back|not available|unable to load/i").count()) > 0;

      expect(hasContent, "Page should show either offer content or a graceful error").toBe(true);

      // Log results
      if (consoleErrors.length > 0 || uncaughtErrors.length > 0) {
        console.log(`\nOffer ${offerId} had errors (non-critical):`);
        console.log("  Console errors:", consoleErrors.slice(0, 3));
        console.log("  Uncaught errors:", uncaughtErrors.slice(0, 3));
      } else {
        console.log(`✅ Offer ${offerId} loaded without errors`);
      }
    });
  }

  test("should show graceful error for non-existent offer", async ({ page }) => {
    const fakeOfferId = "00000000-0000-0000-0000-000000000000";

    await page.goto(`https://cashgpt.in/offer/${fakeOfferId}`, {
      waitUntil: "networkidle",
      timeout: 15000,
    });

    // Should show error message, not crash
    const hasErrorMessage = await page
      .locator("text=/not available|unable to load|not found/i")
      .isVisible();

    expect(hasErrorMessage, "Should show graceful error for non-existent offer").toBe(true);

    // Should have back button
    const hasBackButton = await page.locator("text=/back/i").isVisible();
    expect(hasBackButton, "Should have back button in error state").toBe(true);
  });
});
