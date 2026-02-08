import { test, expect } from "@playwright/test";

test("market page visual", async ({ page }) => {
  await page.goto("/ko/market", { waitUntil: "networkidle" });
  await expect(page).toHaveScreenshot("market-page.png");
});
