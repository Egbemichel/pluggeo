import { test, expect } from "@playwright/test";

test("homepage renders", async ({ page }) => {
  await page.goto("/");
  // The h1 is intentionally visually hidden (sr-only) — the hero's own "Best
  // collection" headline carries the visual weight — so it's present in the
  // DOM for SEO/a11y but not toBeVisible(); toBeAttached() is the correct
  // check here.
  await expect(page.getByRole("heading", { name: /pluggeo&co/i, level: 1 })).toBeAttached();
});
