import { expect, test, type Page, type Route } from "@playwright/test";

/**
 * Browser e2e for the financial reports page: the Overview dashboard (KPIs,
 * revenue-vs-collections trend, top doctors/services, AR snapshot) and the
 * enriched detail tabs. Stubs the same-origin proxy (`/api/backend/**`) with a
 * canned payload per report endpoint so the flow is deterministic without a
 * live backend — the API integration spec provides the real coverage.
 */

const LOCALE = "en";
const ORG = "org-e2e";
const BRANCH = "branch-e2e";
const DASH = `/${LOCALE}/${ORG}/${BRANCH}/dashboard`;
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
      roles: [{ id: "r1", name: "OWNER" }],
      branches: [{ branch_id: BRANCH, id: BRANCH, name: "Main", is_main: true }],
    },
  ],
};

/** Canned report payloads keyed by the exact endpoint name. */
const REPORTS: Record<string, unknown> = {
  revenue: {
    total_invoiced: 10000,
    total_collected: 7500,
    outstanding: 2500,
    invoice_count: 42,
  },
  "daily-revenue": {
    rows: [
      { date: "2026-06-01", invoiced: 4000, collected: 3000, invoice_count: 4 },
      { date: "2026-06-02", invoiced: 3500, collected: 2800, invoice_count: 3 },
      { date: "2026-06-03", invoiced: 2500, collected: 1700, invoice_count: 2 },
    ],
  },
  "revenue-by-service": {
    by_service: [
      { service_id: "s1", service_name: "Consultation", total: 6000, line_count: 30 },
      { service_id: "s2", service_name: "Ultrasound", total: 4000, line_count: 12 },
    ],
    total: 10000,
  },
  "revenue-by-doctor": {
    by_doctor: [
      { profile_id: "d1", doctor_name: "Dr. Sara Ali", total: 5500, invoice_count: 20 },
      { profile_id: "d2", doctor_name: "Dr. Omar Nabil", total: 3000, invoice_count: 14 },
      { profile_id: "d3", doctor_name: "Dr. Mona Hassan", total: 1500, invoice_count: 8 },
    ],
    total: 10000,
  },
  "payments-by-method": {
    by_method: [
      { payment_method: "CASH", total: 4500, count: 25 },
      { payment_method: "CARD", total: 3000, count: 10 },
    ],
    total: 7500,
  },
  "ar-aging": {
    buckets: { current: 1000, d1_30: 700, d31_60: 400, d61_90: 250, d90_plus: 150 },
    total_outstanding: 2500,
  },
  collections: {
    by_method: [{ payment_method: "CASH", total: 4500, count: 25 }],
    by_staff: [
      { profile_id: "p1", staff_name: "Mona Hassan", total: 4500, count: 25 },
    ],
    total: 7500,
  },
  "write-offs": { total_written_off: 0, count: 0 },
  "outstanding-invoices": {
    invoices: [
      {
        id: "inv-1",
        invoice_number: "INV-2026-00001",
        patient_id: "pat-1",
        patient_name: "Alice Adams",
        doctor_name: "Dr. Sara Ali",
        status: "PARTIALLY_PAID",
        total_amount: 1000,
        paid_amount: 400,
        balance_due: 600,
        issued_at: ISO,
        due_date: null,
        last_payment_date: ISO,
        age_days: 3,
        aging_bucket: "current",
      },
    ],
    total_outstanding: 600,
    count: 1,
  },
};

async function authenticate(page: Page) {
  await page.context().addCookies([
    { name: "cradlen-auth-token", value: fakeJwt(), url: "http://127.0.0.1:3000" },
  ]);
}

async function mockBackend(page: Page) {
  await page.route("**/api/backend/**", (route) => {
    const url = route.request().url();
    if (url.includes("/auth/me")) return json(route, { data: ME });

    // Match the exact report name (so `revenue` doesn't swallow `revenue-by-*`).
    const m = url.match(/\/financial\/reports\/([^/?]+)/);
    if (m && REPORTS[m[1]] !== undefined) {
      return json(route, { data: REPORTS[m[1]] });
    }

    return json(route, { data: [] });
  });
}

test.describe("Financial reports", () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
    await mockBackend(page);
  });

  test("Overview shows KPIs, trend, top doctors/services and AR snapshot", async ({
    page,
  }) => {
    await page.goto(`${DASH}/financial/reports`);

    await expect(
      page.getByRole("heading", { name: /Financial Reports/i }),
    ).toBeVisible();

    // KPI cards
    await expect(page.getByText("Total invoiced")).toBeVisible();
    await expect(page.getByText("Total collected")).toBeVisible();
    await expect(page.getByText("Collection rate")).toBeVisible();
    await expect(page.getByText("75.0%")).toBeVisible(); // 7500 / 10000

    // Trend section + a rendered chart
    await expect(page.getByText("Revenue vs Collections")).toBeVisible();
    await expect(page.locator("svg").first()).toBeVisible();

    // Top doctors / services (ranked bars)
    await expect(page.getByText("Top doctors")).toBeVisible();
    await expect(page.getByText("Dr. Sara Ali")).toBeVisible();
    await expect(page.getByText("Top services")).toBeVisible();
    await expect(page.getByText("Consultation")).toBeVisible();

    // AR aging snapshot
    await expect(page.getByText("AR aging snapshot")).toBeVisible();
    await expect(page.getByText("1–30 days")).toBeVisible();
    await expect(page.getByText(/Grand total/i)).toBeVisible();
  });

  test("By Method tab shows a share-% column", async ({ page }) => {
    await page.goto(`${DASH}/financial/reports`);
    await page.getByRole("button", { name: /By Method/i }).click();

    // CASH share = 4500 / 7500 = 60.0%
    await expect(page.getByText("60.0%")).toBeVisible();
  });

  test("Collections tab shows staff names, not ids", async ({ page }) => {
    await page.goto(`${DASH}/financial/reports`);
    await page.getByRole("button", { name: /Collections/i }).click();

    await expect(page.getByText("Mona Hassan")).toBeVisible();
  });

  test("Outstanding tab shows the doctor and last-payment columns", async ({
    page,
  }) => {
    await page.goto(`${DASH}/financial/reports`);
    await page.getByRole("button", { name: /Outstanding/i }).click();

    await expect(
      page.getByRole("columnheader", { name: /Doctor/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: /Last payment/i }),
    ).toBeVisible();
    await expect(page.getByText("Dr. Sara Ali")).toBeVisible();
  });

  test("applying a date range keeps the Overview rendering", async ({ page }) => {
    await page.goto(`${DASH}/financial/reports`);
    await expect(page.getByText("Total invoiced")).toBeVisible();

    await page.getByRole("button", { name: /Apply/i }).click();

    await expect(page.getByText("Total invoiced")).toBeVisible();
  });
});
