import { test, expect } from "@playwright/test";

test.describe("Full User Journeys & Route Integrity", () => {
  test("Navigates from Homepage to Services and Worker Detail", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();

    await page.goto("/services");
    await expect(page.locator("h1")).toContainText("Service Discovery");

    await page.goto("/workers");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("Auth form role selection tabs render cleanly in sign up mode", async ({ page }) => {
    await page.goto("/auth");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByRole("button", { name: "Customer" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Worker" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Coop Admin" })).toBeVisible();

    // Click Coop Admin tab
    await page.getByRole("button", { name: "Coop Admin" }).click();
    await expect(page.getByRole("button", { name: "Coop Admin" })).toHaveClass(/bg-white/);
  });

  test("Admin Modules load without layout crashes", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("h1")).toBeVisible();

    await page.goto("/admin/settlements");
    await expect(page.locator("h1")).toBeVisible();

    await page.goto("/admin/complaints");
    await expect(page.locator("h1")).toBeVisible();

    await page.goto("/forecasts");
    await expect(page.locator("h1")).toBeVisible();
  });
});
