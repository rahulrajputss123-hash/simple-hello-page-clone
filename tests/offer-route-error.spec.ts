import { test, expect } from "@playwright/test";

/**
 * Test to reproduce the actual offer click error
 * "Cannot read properties of undefined (reading 'component')"
 */

test.describe("Offer Route Error", () => {
  test("should navigate to offer details without crash", async ({ page }) => {
    // Go to home page
    await page.goto("https://cashgpt.in");

    // Wait for page load
    await page.waitForLoadState("networkidle");

    console.log("✓ Home page loaded");

    // Check if we need to login
    const isLoggedIn = await page.locator('[data-testid="nav-home"]').isVisible().catch(() => false);

    if (!isLoggedIn) {
      console.log("⚠ Not logged in - need to login to test offers");
      
      // For now, just try to navigate directly to an offer URL
      // This should still trigger the route matching error
      const testOfferId = "4b7e07ef-54d2-4845-8b65-73d80dfc2256"; // From error logs
      
      console.log(`Navigating to /offer/${testOfferId}...`);
      
      // Listen for console errors
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
          console.error("❌ Console error:", msg.text());
        }
      });

      // Listen for page errors
      const pageErrors: Error[] = [];
      page.on("pageerror", (error) => {
        pageErrors.push(error);
        console.error("❌ Page error:", error.message);
        console.error("Stack:", error.stack);
      });

      // Navigate to offer page
      await page.goto(`https://cashgpt.in/offer/${testOfferId}`);
      await page.waitForLoadState("networkidle");

      // Wait a bit for any async errors
      await page.waitForTimeout(2000);

      // Check for the specific error
      const hasComponentError = consoleErrors.some((err) =>
        err.includes("Cannot read properties of undefined") && err.includes("component")
      ) || pageErrors.some((err) =>
        err.message.includes("Cannot read properties of undefined") && err.message.includes("component")
      );

      if (hasComponentError) {
        console.error("\n❌ FOUND THE ERROR!");
        console.error("Console errors:", consoleErrors);
        console.error("Page errors:", pageErrors.map(e => e.message));
        throw new Error("Offer route has 'Cannot read properties of undefined (reading component)' error");
      }

      // Check if error page is shown
      const hasErrorState = await page.locator('text="Unable to load offer"').isVisible().catch(() => false);
      if (hasErrorState) {
        console.log("⚠ Error state shown (this is expected if not logged in)");
      }

      // Take a screenshot
      await page.screenshot({ path: ".screenshots/offer-route-test.png", fullPage: true });
      
      console.log("✓ No component error found!");
    }
  });
});
