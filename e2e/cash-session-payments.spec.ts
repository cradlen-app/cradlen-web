import { expect, test, type Page, type Route } from "@playwright/test";

/**
 * Browser e2e for the cash-session-gated payments + carry-forward float.
 * Drives the real Next UI and stubs the same-origin proxy (`/api/backend/**`,
 * `/api/auth/me`) so the flows are deterministic without a live backend — the
 * backend integration spec provides the real full-stack coverage.
 */

const LOCALE = "en";
const ORG = "org-e2e";
const BRANCH = "branch-e2e";
const DASH = `/${LOCALE}/${ORG}/${BRANCH}/dashboard`;
const INVOICE_ID = "inv-e2e";

const ISO = "2026-06-05T08:00:00.000Z";

function b64url(obj: object): string {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

/** A structurally valid, non-expired JWT so `proxy.ts` lets dashboard routes through. */
function fakeJwt(): string {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${b64url({ alg: "none", typ: "JWT" })}.${b64url({ sub: "u1", exp })}.sig`;
}

function json(route: Route, data: unknown) {
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(data),
  });
}

function closedSession(countedAmount: string) {
  return {
    id: "s-closed",
    organization_id: ORG,
    branch_id: BRANCH,
    profile_id: "p1",
    opening_float: "100.00",
    opened_by_id: "p1",
    opened_at: ISO,
    closed_by_id: "p1",
    closed_at: "2026-06-05T17:00:00.000Z",
    expected_amount: "100.00",
    counted_amount: countedAmount,
    variance: "0.00",
    status: "CLOSED",
    notes: null,
    created_at: ISO,
    updated_at: ISO,
  };
}

function openSession() {
  return {
    ...closedSession("0.00"),
    id: "s-open",
    status: "OPEN",
    closed_at: null,
    counted_amount: null,
    summary: { collected: "0.00", payment_count: 0, expected_so_far: "0.00" },
  };
}

function invoice(status: string, paid = 0) {
  return {
    id: INVOICE_ID,
    organization_id: ORG,
    branch_id: BRANCH,
    patient_id: "pat-1",
    visit_id: null,
    episode_id: null,
    assigned_doctor_id: null,
    invoice_number: "1001",
    invoice_type: "STANDARD",
    status,
    subtotal: 200,
    discount_type: null,
    discount_value: null,
    discount_amount: 0,
    tax_amount: 0,
    total_amount: 200,
    paid_amount: paid,
    balance_due: 200 - paid,
    currency: "EGP",
    notes: null,
    issued_at: ISO,
    due_date: null,
    created_by_id: "p1",
    items: [
      {
        id: "it-1",
        invoice_id: INVOICE_ID,
        service_id: "svc-1",
        description: "Consultation",
        quantity: 1,
        unit_price: 200,
        currency: "EGP",
        discount_amount: 0,
        total_amount: 200,
        pricing_source: "ORG_PRICE_LIST",
        created_at: ISO,
        updated_at: ISO,
      },
    ],
    created_at: ISO,
    updated_at: ISO,
  };
}

const ME = {
  id: "u1",
  email: "owner@e2e.test",
  first_name: "O",
  last_name: "Wner",
  profiles: [
    {
      profile_id: "p1",
      organization_id: ORG,
      organization: { id: ORG, name: "E2E Clinic", specialties: [] },
      // /auth/me carries a single api `role` (read via profile.role); a plural
      // `roles` array is ignored, downgrading the owner out of owner-only surfaces.
      role: { id: "r1", name: "OWNER" },
      branches: [
        { branch_id: BRANCH, id: BRANCH, name: "Main", is_main: true },
      ],
    },
  ],
};

/** Auth cookie so `proxy.ts` lets dashboard routes through. */
async function authenticate(page: Page) {
  await page.context().addCookies([
    { name: "cradlen-auth-token", value: fakeJwt(), url: "http://127.0.0.1:3000" },
  ]);
}

/**
 * Intercept the same-origin backend proxy. `/auth/me` (hit via
 * apiAuthFetch → /api/backend/auth/me) is always answered with a seeded owner
 * so the kernel auth bridge renders; the per-test handler covers the rest.
 */
async function mockBackend(page: Page, handler: (route: Route, url: string) => unknown) {
  await page.route("**/api/backend/**", (route) => {
    const url = route.request().url();
    if (url.includes("/auth/me")) return json(route, { data: ME });
    return handler(route, url);
  });
}

test.describe("Cash-session payments", () => {
  test("carries the opening float forward from the last closed session", async ({
    page,
  }) => {
    await authenticate(page);
    await mockBackend(page, (route, url) => {
      if (url.includes("/cash-sessions/current")) return json(route, { data: null });
      if (url.includes("/cash-sessions"))
        return json(route, { data: [closedSession("350.00")] });
      return json(route, { data: [] });
    });

    await page.goto(`${DASH}/financial/cash-sessions`);

    await page.getByRole("button", { name: /open session/i }).click();

    const floatInput = page.getByRole("spinbutton").first();
    expect(Number(await floatInput.inputValue())).toBe(350);
    await expect(page.getByText(/carried from last session/i)).toBeVisible();
  });

  test("blocks recording a payment when no cash session is open", async ({
    page,
  }) => {
    await authenticate(page);
    await mockBackend(page, (route, url) => {
      if (url.includes("/cash-sessions/current")) return json(route, { data: null });
      if (url.includes(`/invoices/${INVOICE_ID}/payments`))
        return json(route, { data: [] });
      if (url.includes(`/invoices/${INVOICE_ID}`))
        return json(route, { data: invoice("ISSUED") });
      return json(route, { data: [] });
    });

    await page.goto(`${DASH}/financial/invoices/${INVOICE_ID}`);
    await page.getByRole("button", { name: /record payment/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/no cash session open/i)).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: /record payment/i }),
    ).toBeDisabled();

    await dialog.getByRole("link", { name: /open cash session/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/financial\/cash-sessions$/);
  });

  test("records a payment when a session is open", async ({ page }) => {
    await authenticate(page);
    let postedPayment = false;
    await mockBackend(page, (route, url) => {
      const method = route.request().method();
      if (url.includes(`/invoices/${INVOICE_ID}/payments`) && method === "POST") {
        postedPayment = true;
        return json(route, {
          data: { payment: { id: "pay-1" }, invoice: invoice("PARTIALLY_PAID", 200) },
        });
      }
      if (url.includes("/cash-sessions/current"))
        return json(route, { data: openSession() });
      if (url.includes(`/invoices/${INVOICE_ID}/payments`))
        return json(route, { data: [] });
      if (url.includes(`/invoices/${INVOICE_ID}`))
        return json(route, { data: invoice("ISSUED") });
      return json(route, { data: [] });
    });

    await page.goto(`${DASH}/financial/invoices/${INVOICE_ID}`);
    await page.getByRole("button", { name: /record payment/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/no cash session open/i)).toHaveCount(0);
    const submit = dialog.getByRole("button", { name: /record payment/i });
    await expect(submit).toBeEnabled();
    await submit.click();

    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(postedPayment).toBe(true);
  });
});
