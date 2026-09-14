import { test, expect } from "@playwright/test";

test.describe("Bookings flow", () => {
  test("services page loads", async ({ page }) => {
    await page.goto("/services");
    await expect(page.locator("h1")).toContainText("Service Discovery");
  });

  test("bookings page is accessible", async ({ page }) => {
    await page.goto("/bookings");
    await expect(page.locator("h1")).toContainText("Join the service network");
  });
});
