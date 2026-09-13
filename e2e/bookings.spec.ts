import { test, expect } from "@playwright/test";

test.describe("Bookings flow", () => {
 test("services page loads", async ({ page }) => {
 await page.goto("/services");
 await expect(page.locator("text=Services")).toBeVisible();
 });

 test("bookings page is accessible", async ({ page }) => {
 await page.goto("/bookings");
 await expect(page.locator("text=Bookings")).toBeVisible();
 });
});
