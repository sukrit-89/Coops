import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads and shows nav links", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.getByRole("link", { name: "Services", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Bookings", exact: true })).toBeVisible();
  });

  test("shows hero section", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
  });
});
