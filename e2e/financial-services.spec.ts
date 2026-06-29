import { expect, test, type Page, type Route } from "@playwright/test";

/**
 * Browser e2e for the Services & Pricing page: the five tabs (Services,
 * Categories, Price Lists, Provider Pricing, Authorizations) driven against a
 * mocked same-origin proxy. The API integration specs provide the real
 * full-stack coverage; here we verify the UI wiring and the service create flow.
 */

const LOCALE = "en";
const ORG = "org-e2e";
const BRANCH = "branch-e2e";
const DASH = `/${LOCALE}/${ORG}/${BRANCH}/dashboard`;
const ISO = "2026-06-05T08:00:00.000Z";

function b64url(obj: object): string {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}
function fakeJwt(): string {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${b64url({ alg: "none", typ: "JWT" })}.${b64url({ sub: "u1", exp })}.sig`;
}
function json(route: Route, data: unknown, status = 200) {
  return route.fulfill({
    status,
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
      // /auth/me carries a single api `role` (read via profile.role); a plural
      // `roles` array is ignored, downgrading the owner out of owner-only surfaces.
      role: { id: "r1", name: "OWNER" },
      branches: [{ branch_id: BRANCH, id: BRANCH, name: "Main", is_main: true }],
    },
  ],
};

const SERVICES = [
  {
    id: "svc-1",
    organization_id: ORG,
    code: "CONSULT-1",
    name: "Consultation",
    description: null,
    service_type: "CONSULTATION",
    is_active: true,
    specialty_ids: [],
    category_id: null,
    category: null,
    created_at: ISO,
    updated_at: ISO,
  },
  {
    id: "svc-2",
    organization_id: ORG,
    code: "XRAY-1",
    name: "X-Ray",
    description: null,
    service_type: "IMAGING",
    is_active: false,
    specialty_ids: [],
    category_id: null,
    category: null,
    created_at: ISO,
    updated_at: ISO,
  },
];
const CATEGORIES = [
  {
    id: "cat-1",
    organization_id: ORG,
    code: "LAB",
    name: "Laboratory",
    description: null,
    is_active: true,
    created_at: ISO,
    updated_at: ISO,
  },
];
const PRICE_LISTS = [
  {
    id: "pl-1",
    organization_id: ORG,
    branch_id: null,
    name: "Standard 2026",
    currency: "EGP",
    is_default: true,
    is_active: true,
    valid_from: null,
    valid_to: null,
    created_at: ISO,
    updated_at: ISO,
  },
];

const state: { createdService: Record<string, unknown> | null } = {
  createdService: null,
};

async function authenticate(page: Page) {
  await page.context().addCookies([
    { name: "cradlen-auth-token", value: fakeJwt(), url: "http://127.0.0.1:3000" },
  ]);
}

async function mockBackend(page: Page) {
  await page.route("**/api/backend/**", (route) => {
    const req = route.request();
    const url = req.url();
    const method = req.method();

    if (url.includes("/auth/me")) return json(route, { data: ME });

    // Service create — capture the body, return the created row.
    if (/\/financial\/catalog\/services(\?|$)/.test(url) && method === "POST") {
      state.createdService = req.postDataJSON();
      return json(
        route,
        { data: { ...state.createdService, id: "svc-new", is_active: true } },
        201,
      );
    }
    if (url.includes("/financial/catalog/services"))
      return json(route, { data: SERVICES });
    if (url.includes("/financial/catalog/categories"))
      return json(route, { data: CATEGORIES });
    if (url.includes("/financial/price-lists"))
      return json(route, { data: PRICE_LISTS });

    // Staff list, org specialties, provider sub-resources, etc.
    return json(route, { data: [] });
  });
}

test.describe("Services & Pricing", () => {
  test.beforeEach(async ({ page }) => {
    state.createdService = null;
    await authenticate(page);
    await mockBackend(page);
  });

  test("Services tab lists services and creates a new one", async ({ page }) => {
    await page.goto(`${DASH}/financial/services`);

    await expect(
      page.getByRole("heading", { name: /Services & Pricing/i }),
    ).toBeVisible();

    // Existing rows (code + name + inactive badge).
    await expect(page.getByText("CONSULT-1")).toBeVisible();
    await expect(page.getByText("X-Ray")).toBeVisible();
    await expect(page.getByText(/inactive/i)).toBeVisible();

    // Create flow.
    await page.getByRole("button", { name: /new service/i }).click();
    await page.getByPlaceholder("Service name").fill("Blood Test");
    await page.getByRole("button", { name: /create service/i }).click();

    await expect.poll(() => state.createdService?.name).toBe("Blood Test");
    expect(String(state.createdService?.code)).toMatch(/^BLOOD-TEST-/);
    expect(state.createdService?.service_type).toBe("CONSULTATION");
  });

  test("navigates the other four tabs", async ({ page }) => {
    await page.goto(`${DASH}/financial/services`);

    await page.getByRole("button", { name: /^Categories$/ }).click();
    await expect(page.getByText("Laboratory")).toBeVisible();

    await page.getByRole("button", { name: /^Price Lists$/ }).click();
    await expect(page.getByText("Standard 2026")).toBeVisible();

    await page.getByRole("button", { name: /^Authorizations$/ }).click();
    await expect(page.getByText(/provider/i).first()).toBeVisible();

    await page.getByRole("button", { name: /^Provider Pricing$/ }).click();
    await expect(page.getByText(/provider/i).first()).toBeVisible();
  });
});
