import { expect, test } from "@playwright/test";

/**
 * Flows touched by the patient-portal extraction. These are all backend-free:
 * the new marketing/guide pages are public, and the patient CTA is a static
 * link to the separate patient app. Backend-backed specs (auth-refresh,
 * financial, visits) need E2E_API_URL and are not part of this file.
 */

const PUBLIC_PAGES = [
  "/en/guide",
  "/en/help-center",
  "/en/privacy-policy",
  "/en/terms-of-service",
];

for (const path of PUBLIC_PAGES) {
  test(`public page ${path} loads without authentication`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status(), `${path} should not error`).toBeLessThan(400);
    // Must not be bounced to sign-in by the proxy guard.
    await expect(page).not.toHaveURL(/\/sign-in/);
  });
}

test("sign-in page links the patient CTA to the external patient app", async ({
  page,
}) => {
  await page.goto("/en/sign-in");

  // The patient CTA is a plain anchor to the separate patient app domain.
  const patientLink = page.locator('a[href*="/patient/signin"]');
  await expect(patientLink).toBeVisible();

  const href = await patientLink.getAttribute("href");
  expect(href).toMatch(/^https?:\/\/.+\/patient\/signin$/);
  // It points at a different origin than the clinic app, not an internal route.
  expect(href).not.toMatch(/127\.0\.0\.1|localhost/);
});
