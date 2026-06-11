import { expect, test, type Page, type Route } from "@playwright/test";

/**
 * Browser e2e for the doctor "Current visit" card. Regression cover for the bug
 * where the card showed only the doctor's single most-recent in-progress visit:
 * it must list EVERY in-progress visit returned by `visits/my-current`. Drives
 * the real Next UI and stubs the same-origin proxy so the flow is deterministic
 * without a live backend — the API integration spec provides the full-stack and
 * security coverage.
 */

const LOCALE = "en";
const ORG = "org-e2e";
const BRANCH = "branch-e2e";
const DASH = `/${LOCALE}/${ORG}/${BRANCH}/dashboard`;
const ISO = "2026-06-11T08:00:00.000Z";

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

/** A flattened API visit, in the shape `mapApiVisitToVisit` consumes. */
function makeVisit(opts: {
  id: string;
  patientName: string;
  queue: number;
  startedAt: string;
}) {
  return {
    id: opts.id,
    branch_id: BRANCH,
    queue_number: opts.queue,
    appointment_type: "VISIT",
    status: "IN_PROGRESS",
    priority: "NORMAL",
    specialty_code: "OBGYN",
    notes: null,
    chief_complaint: null,
    chief_complaint_meta: null,
    vitals: null,
    scheduled_at: ISO,
    started_at: opts.startedAt,
    completed_at: null,
    created_at: ISO,
    assigned_doctor: {
      id: "p1",
      user: { id: "u1", first_name: "Dr", last_name: "House" },
    },
    episode: {
      id: `ep-${opts.id}`,
      journey: {
        organization_id: ORG,
        patient: { id: `pat-${opts.id}`, full_name: opts.patientName },
        care_path: null,
      },
    },
  };
}

const CURRENT_VISITS = [
  makeVisit({
    id: "v1",
    patientName: "Amal Said",
    queue: 1,
    startedAt: "2026-06-11T09:00:00.000Z",
  }),
  makeVisit({
    id: "v2",
    patientName: "Mona Fadel",
    queue: 2,
    startedAt: "2026-06-11T09:20:00.000Z",
  }),
];

/** A clinical (doctor) profile so `showsAssignedVisits` renders the Current visit card. */
const ME = {
  id: "u1",
  email: "doctor@e2e.test",
  first_name: "Dr",
  last_name: "House",
  profiles: [
    {
      profile_id: "p1",
      organization_id: ORG,
      organization: { id: ORG, name: "E2E Clinic", specialties: [] },
      roles: [{ id: "r1", name: "STAFF" }],
      job_functions: [
        { id: "jf1", code: "OBGYN", name: "OB-GYN", is_clinical: true },
      ],
      branches: [{ branch_id: BRANCH, id: BRANCH, name: "Main", is_main: true }],
    },
  ],
};

const EMPTY_LIST = {
  data: [],
  meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
};

async function authenticate(page: Page) {
  await page.context().addCookies([
    {
      name: "cradlen-auth-token",
      value: fakeJwt(),
      url: "http://127.0.0.1:3000",
    },
  ]);
}

/**
 * Intercept the same-origin backend proxy. `/auth/me` returns the seeded doctor;
 * `visits/my-current` returns the two in-progress visits; medical-rep current is
 * empty; every other list (waiting lists, stats, schedule) is empty.
 */
async function mockBackend(page: Page) {
  await page.route("**/api/backend/**", (route) => {
    const url = route.request().url();
    if (url.includes("/auth/me")) return json(route, { data: ME });
    if (url.includes("/medical-rep-visits/my-current"))
      return json(route, { data: [] });
    if (url.includes("/visits/my-current"))
      return json(route, { data: CURRENT_VISITS });
    return json(route, EMPTY_LIST);
  });
}

test.describe("Doctor current-visit card", () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
    await mockBackend(page);
  });

  test("lists every in-progress visit, not just the last one", async ({
    page,
  }) => {
    await page.goto(`${DASH}/visits`);

    const card = page.getByRole("region", { name: /current visit/i });
    await expect(card).toBeVisible();

    // Both in-progress visits render — the bug only showed the most recent.
    await expect(card.getByText("Amal Said")).toBeVisible();
    await expect(card.getByText("Mona Fadel")).toBeVisible();

    // Two patient rows, and the empty state is gone.
    await expect(card.getByText("Amal Said")).toHaveCount(1);
    await expect(card.getByText("Mona Fadel")).toHaveCount(1);
  });
});
