import { expect, type BrowserContext, type Page } from "@playwright/test";

export const AUTH_TOKEN_COOKIE = "cradlen-auth-token";
export const AUTH_REFRESH_TOKEN_COOKIE = "cradlen-refresh-token";

/** Staff credentials for the backend-backed e2e, supplied via env (never hardcoded). */
export const E2E_EMAIL = process.env.E2E_EMAIL;
export const E2E_PASSWORD = process.env.E2E_PASSWORD;
export const hasStaffCredentials = Boolean(E2E_EMAIL && E2E_PASSWORD);

const DASHBOARD_URL = /\/en\/[^/]+\/[^/]+\/dashboard/;

/**
 * Drives the real staff sign-in UI against a live backend and lands on the
 * dashboard. Handles both post-login shapes: the single-profile/single-branch
 * fast path (straight to the dashboard) and the manual profile/branch picker.
 * Returns the landed dashboard URL (carries orgId/branchId).
 */
export async function loginAsStaff(page: Page): Promise<string> {
  await page.goto("/en/sign-in");

  await page.locator("#email").fill(E2E_EMAIL as string);
  await page.locator("#password").fill(E2E_PASSWORD as string);
  await page.getByRole("button", { name: /sign in/i }).click();

  // Either we go straight to the dashboard, or the profile-selection step shows.
  await page.waitForURL(
    (url) => DASHBOARD_URL.test(url.pathname) || url.pathname.endsWith("/select-profile"),
    { timeout: 20_000 },
  );

  if (page.url().endsWith("/select-profile")) {
    // Profile cards render as <button aria-pressed>; pick the first.
    await page.locator("button[aria-pressed]").first().click();

    // If the chosen profile exposes multiple branches, pick the first one.
    const branchRadio = page.locator('input[type="radio"]').first();
    if (await branchRadio.count()) {
      await branchRadio.check().catch(() => {});
    }

    // The select-profile CTA reads "Continue" (auth.selectProfile.continue).
    await page.getByRole("button", { name: /continue/i }).click();
    await page.waitForURL(DASHBOARD_URL, { timeout: 20_000 });
  }

  await expect(page).toHaveURL(DASHBOARD_URL);
  return page.url();
}

/** Reads a single cookie value by name from the browser context. */
export async function getCookie(
  context: BrowserContext,
  name: string,
): Promise<string | undefined> {
  const cookies = await context.cookies();
  return cookies.find((c) => c.name === name)?.value;
}

/**
 * Simulates the browser dropping the expired access-token cookie while keeping
 * the refresh (and selection) cookies — the exact state after the 30-minute
 * access token lapses. The next protected request must transparently refresh.
 */
export async function expireAccessToken(context: BrowserContext): Promise<void> {
  await context.clearCookies({ name: AUTH_TOKEN_COOKIE });
}
