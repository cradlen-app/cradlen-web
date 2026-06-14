import { expect, test } from "@playwright/test";
import {
  AUTH_REFRESH_TOKEN_COOKIE,
  AUTH_TOKEN_COOKIE,
  expireAccessToken,
  getCookie,
  hasStaffCredentials,
  loginAsStaff,
} from "./helpers/auth";

// Backend-backed: requires a live cradlen-api (point the web server at it with
// E2E_API_URL) and a real staff account (E2E_EMAIL / E2E_PASSWORD).
test.describe("staff session refresh (real backend)", () => {
  test.skip(
    !hasStaffCredentials,
    "Set E2E_EMAIL and E2E_PASSWORD (and E2E_API_URL) to run the backend-backed refresh e2e.",
  );

  test("transparently refreshes after the access token expires and never bounces to sign-in", async ({
    page,
    context,
  }) => {
    // 1. Real login -> dashboard (loginAsStaff asserts the dashboard URL).
    await loginAsStaff(page);

    // 2. Capture the live session cookies.
    const accessBefore = await getCookie(context, AUTH_TOKEN_COOKIE);
    const refreshBefore = await getCookie(context, AUTH_REFRESH_TOKEN_COOKIE);
    expect(accessBefore).toBeTruthy();
    expect(refreshBefore).toBeTruthy();

    // 3. Simulate the access token expiring (browser drops it; refresh remains).
    await expireAccessToken(context);
    expect(await getCookie(context, AUTH_TOKEN_COOKIE)).toBeUndefined();
    expect(await getCookie(context, AUTH_REFRESH_TOKEN_COOKIE)).toBe(refreshBefore);

    // 4. A protected reload must refresh against the real backend, not log out.
    await page.reload();

    // 5. Recovery: still on the dashboard (no sign-in bounce), with a fresh
    //    access cookie and a *rotated* refresh cookie — proving a real
    //    /auth/refresh round-trip, not a stale-cookie reuse.
    await expect(page).not.toHaveURL(/\/sign-in/);
    await expect(page).toHaveURL(/\/en\/[^/]+\/[^/]+\/dashboard/);

    const accessAfter = await getCookie(context, AUTH_TOKEN_COOKIE);
    const refreshAfter = await getCookie(context, AUTH_REFRESH_TOKEN_COOKIE);
    expect(accessAfter).toBeTruthy();
    expect(refreshAfter).toBeTruthy();
    expect(refreshAfter).not.toBe(refreshBefore);
  });

  test("survives repeated reloads after expiry without logging out", async ({
    page,
    context,
  }) => {
    await loginAsStaff(page);

    for (let i = 0; i < 3; i++) {
      await expireAccessToken(context);
      await page.reload();
      await expect(page).not.toHaveURL(/\/sign-in/);
      await expect(page).toHaveURL(/\/en\/[^/]+\/[^/]+\/dashboard/);
    }
  });
});
