import { expect, test } from "@playwright/test";

test("public home page loads in English", async ({ page }) => {
  await page.goto("/en");

  await expect(page.getByRole("link", { name: /sign in|log in/i }).first()).toBeVisible();
});

test("protected dashboard redirects unauthenticated visitors to sign in", async ({
  page,
}) => {
  await page.goto("/en/dashboard");

  await expect(page).toHaveURL(/\/en\/sign-in\?redirectTo=%2Fdashboard/);
});

test("Arabic public home page renders with RTL direction", async ({ page }) => {
  await page.goto("/ar");

  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});
