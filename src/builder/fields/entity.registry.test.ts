import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiAuthFetch } from "@/infrastructure/http/api";
import { ENTITY_REGISTRY, getEntitySearchFn } from "./entity.registry";

// All registry search fns go through apiAuthFetch (the patient one indirectly,
// via features/visits searchPatients). Mock the transport and drive each fn.
vi.mock("@/infrastructure/http/api", () => ({
  apiAuthFetch: vi.fn(),
}));

const mockFetch = vi.mocked(apiAuthFetch);

function lastUrl(): string {
  return mockFetch.mock.calls.at(-1)?.[0] as string;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getEntitySearchFn", () => {
  it("resolves every registered kind to a function", () => {
    for (const kind of [
      "patient",
      "medical_rep",
      "medication",
      "diagnosis",
      "lab_test",
      "procedure",
    ]) {
      expect(typeof getEntitySearchFn(kind)).toBe("function");
      expect(getEntitySearchFn(kind)).toBe(ENTITY_REGISTRY[kind]);
    }
  });

  it("returns undefined for an unknown kind", () => {
    expect(getEntitySearchFn("unknown_kind")).toBeUndefined();
    expect(getEntitySearchFn("")).toBeUndefined();
  });
});

describe("medical_rep search", () => {
  it("hits /medical-reps with search+limit and maps name/company/national_id", async () => {
    mockFetch.mockResolvedValue({
      data: [
        {
          id: "rep-1",
          full_name: "Rep One",
          company_name: "Acme",
          national_id: "123",
        },
      ],
    } as never);

    const results = await getEntitySearchFn("medical_rep")!("aspir");

    expect(lastUrl()).toBe("/medical-reps?search=aspir&limit=20");
    expect(results).toEqual([
      {
        id: "rep-1",
        label: "Rep One",
        subtitle: "Acme · 123",
        raw: { id: "rep-1", full_name: "Rep One", company_name: "Acme", national_id: "123" },
      },
    ]);
  });

  it("drops empty subtitle parts", async () => {
    mockFetch.mockResolvedValue({
      data: [{ id: "rep-2", full_name: "Rep Two" }],
    } as never);

    const [r] = await getEntitySearchFn("medical_rep")!("x");
    expect(r.subtitle).toBe("");
  });
});

describe("patient search", () => {
  it("hits /patients/search and maps to label + last-3-phone subtitle (no PII)", async () => {
    mockFetch.mockResolvedValue({
      data: [{ id: "p-1", full_name: "Aisha", phone_last3: "100" }],
    } as never);

    const results = await getEntitySearchFn("patient")!("ais");

    expect(lastUrl()).toBe("/patients/search?search=ais&limit=20");
    expect(results[0].id).toBe("p-1");
    expect(results[0].label).toBe("Aisha");
    // Disambiguation-only: last 3 phone digits, never national id / full phone.
    expect(results[0].subtitle).toBe("••• 100");
    // Full identity is fetched on selection, not in the search row.
    expect(typeof results[0].resolve).toBe("function");
  });

  it("omits the subtitle when the search row has no phone", async () => {
    mockFetch.mockResolvedValue({
      data: [{ id: "p-2", full_name: "Noor", phone_last3: null }],
    } as never);

    const [r] = await getEntitySearchFn("patient")!("noo");
    expect(r.subtitle).toBeUndefined();
  });
});

describe("medication search", () => {
  it("maps strength·form·generic subtitle and computes a readable default_dose", async () => {
    mockFetch.mockResolvedValue({
      data: [
        {
          id: "m-1",
          code: "PARA",
          name: "Paracetamol",
          generic_name: "acetaminophen",
          form: "tablet",
          strength: "500mg",
          default_dose_amount: 1,
          default_dose_unit: "tab",
          default_dose_frequency: "BID",
        },
      ],
    } as never);

    const [r] = await getEntitySearchFn("medication")!("para");

    expect(lastUrl()).toBe("/medications?search=para&limit=20");
    expect(r.label).toBe("Paracetamol");
    expect(r.subtitle).toBe("500mg · tablet · acetaminophen");
    expect((r.raw as { default_dose: string }).default_dose).toBe("1tab / BID");
  });

  it("omits dose-amount segment when amount is null and joins only present parts", async () => {
    mockFetch.mockResolvedValue({
      data: [
        {
          id: "m-2",
          code: "X",
          name: "Drug",
          default_dose_amount: null,
          default_dose_unit: null,
          default_dose_frequency: "QD",
        },
      ],
    } as never);

    const [r] = await getEntitySearchFn("medication")!("d");
    expect((r.raw as { default_dose: string }).default_dose).toBe("QD");
    expect(r.subtitle).toBe("");
  });

  it("renders amount without a unit when unit missing", async () => {
    mockFetch.mockResolvedValue({
      data: [
        {
          id: "m-3",
          code: "Y",
          name: "Drug3",
          default_dose_amount: 2,
          default_dose_unit: null,
          default_dose_frequency: null,
        },
      ],
    } as never);

    const [r] = await getEntitySearchFn("medication")!("d");
    expect((r.raw as { default_dose: string }).default_dose).toBe("2");
  });
});

describe("diagnosis search", () => {
  it("uses the ICD-10 code as the result id (not the row id)", async () => {
    mockFetch.mockResolvedValue({
      data: [
        {
          id: "row-uuid",
          code: "O80",
          description: "Single delivery",
          chapter: "Pregnancy",
        },
      ],
    } as never);

    const [r] = await getEntitySearchFn("diagnosis")!("deliv");

    expect(lastUrl()).toBe("/diagnosis-codes?search=deliv");
    expect(r.id).toBe("O80");
    expect(r.label).toBe("Single delivery");
    expect(r.subtitle).toBe("O80 · Pregnancy");
  });
});

describe("lab_test search", () => {
  it("keeps the uuid id and maps code·category subtitle", async () => {
    mockFetch.mockResolvedValue({
      data: [{ id: "lab-1", code: "CBC", name: "Complete blood count", category: "Hematology" }],
    } as never);

    const [r] = await getEntitySearchFn("lab_test")!("cbc");

    expect(lastUrl()).toBe("/lab-tests?search=cbc");
    expect(r.id).toBe("lab-1");
    expect(r.subtitle).toBe("CBC · Hematology");
  });
});

describe("procedure search", () => {
  it("keeps the uuid id and uses the code as subtitle", async () => {
    mockFetch.mockResolvedValue({
      data: [{ id: "proc-1", code: "PR1", name: "Appendectomy" }],
    } as never);

    const [r] = await getEntitySearchFn("procedure")!("app");

    expect(lastUrl()).toBe("/procedures?search=app");
    expect(r.id).toBe("proc-1");
    expect(r.label).toBe("Appendectomy");
    expect(r.subtitle).toBe("PR1");
  });
});
