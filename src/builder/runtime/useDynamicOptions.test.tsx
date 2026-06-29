import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiAuthFetch } from "@/infrastructure/http/api";
import {
  TemplateExecutionContextProvider,
  type ExecutionState,
} from "./TemplateExecutionContext";
import { useDynamicOptions } from "./useDynamicOptions";
import type { DynamicOption } from "./useDynamicOptions";
import type { FormFieldDto, FormTemplateDto } from "../templates/template.types";

const auth = vi.hoisted(() => ({ organizationId: "org-1" as string | null, branchId: "branch-1" as string | null }));

vi.mock("@/features/auth/store/authContextStore", () => ({
  useAuthContextStore: (selector: (s: { organizationId: string | null; branchId: string | null }) => unknown) =>
    selector({ organizationId: auth.organizationId, branchId: auth.branchId }),
}));

vi.mock("@/infrastructure/http/api", () => ({ apiAuthFetch: vi.fn() }));

const mockFetch = vi.mocked(apiAuthFetch);

function field(optionsSource?: string): FormFieldDto {
  return {
    id: "f-1",
    code: "picker",
    label: "Picker",
    type: "SELECT",
    order: 0,
    required: false,
    binding: { namespace: "VISIT", path: "picker" },
    config: optionsSource ? { ui: { optionsSource } } : {},
  };
}

function templateFor(f: FormFieldDto): FormTemplateDto {
  return {
    id: "tpl",
    code: "tpl",
    name: "T",
    description: null,
    scope: "BOOK_VISIT",
    version: 1,
    activated_at: null,
    specialty_id: null,
    sections: [{ id: "s", code: "sec", name: "S", order: 0, config: {}, fields: [f] }],
  };
}

function Harness({ f }: { f: FormFieldDto }) {
  const r = useDynamicOptions(f);
  return (
    <pre data-testid="out">
      {JSON.stringify({ options: r.options, enabled: r.enabled, isLoading: r.isLoading, isError: r.isError })}
    </pre>
  );
}

function renderField(f: FormFieldDto, systemValues: ExecutionState["systemValues"] = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <TemplateExecutionContextProvider template={templateFor(f)} initialSystemValues={systemValues}>
        {children}
      </TemplateExecutionContextProvider>
    </QueryClientProvider>
  );
  return render(<Harness f={f} />, { wrapper });
}

function read(): { options: DynamicOption[]; enabled: boolean; isLoading: boolean; isError: boolean } {
  return JSON.parse(screen.getByTestId("out").textContent ?? "{}");
}

async function optionsAfterLoad(): Promise<DynamicOption[]> {
  await waitFor(() => expect(read().options.length).toBeGreaterThan(0));
  return read().options;
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.organizationId = "org-1";
  auth.branchId = "branch-1";
});

describe("useDynamicOptions — disabled state", () => {
  it("is disabled and returns no options without an optionsSource", () => {
    renderField(field());
    const r = read();
    expect(r.enabled).toBe(false);
    expect(r.options).toEqual([]);
    expect(r.isLoading).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("useDynamicOptions — staff mapper", () => {
  it("appends paging, maps name → label, and falls back to email", async () => {
    mockFetch.mockResolvedValue({
      data: [
        { profile_id: "p1", first_name: "Jane", last_name: "Doe", email: "j@x.com" },
        { profile_id: "p2", first_name: "", last_name: "", email: "fallback@x.com" },
      ],
    } as never);
    renderField(field("/organizations/{org_id}/branches/{branch_id}/staff"));
    const options = await optionsAfterLoad();
    expect(mockFetch).toHaveBeenCalledWith(
      "/organizations/org-1/branches/branch-1/staff?page=1&limit=100",
    );
    expect(options.map((o) => ({ code: o.code, label: o.label }))).toEqual([
      { code: "p1", label: "Jane Doe" },
      { code: "p2", label: "fallback@x.com" },
    ]);
  });
});

describe("useDynamicOptions — specialties + subspecialties + care-paths", () => {
  it("maps specialties by code/name", async () => {
    mockFetch.mockResolvedValue({ data: [{ id: "1", code: "OBGYN", name: "OB/GYN" }] } as never);
    renderField(field("/organizations/{org_id}/specialties"));
    const options = await optionsAfterLoad();
    expect(mockFetch).toHaveBeenCalledWith("/organizations/org-1/specialties");
    expect(options[0]).toMatchObject({ code: "OBGYN", label: "OB/GYN" });
  });

  it("resolves a subspecialty lookup using a systemValues placeholder", async () => {
    mockFetch.mockResolvedValue({ data: [{ code: "MFM", name: "Maternal Fetal" }] } as never);
    renderField(
      field("/specialties/subspecialties/lookup?specialty_code={specialty_code}"),
      { specialty_code: "OBGYN" },
    );
    const options = await optionsAfterLoad();
    expect(mockFetch).toHaveBeenCalledWith(
      "/specialties/subspecialties/lookup?specialty_code=OBGYN",
    );
    expect(options[0]).toMatchObject({ code: "MFM", label: "Maternal Fetal" });
  });

  it("does not fetch while a required placeholder is unresolved", () => {
    renderField(field("/specialties/subspecialties/lookup?specialty_code={specialty_code}"));
    expect(read().options).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("maps care-paths by code/name", async () => {
    mockFetch.mockResolvedValue({ data: [{ id: "c1", code: "ANC", name: "Antenatal" }] } as never);
    renderField(field("/care-paths"));
    const options = await optionsAfterLoad();
    expect(options[0]).toMatchObject({ code: "ANC", label: "Antenatal" });
  });
});

describe("useDynamicOptions — medications mapper", () => {
  it("appends paging with & when a query already exists and adds the strength suffix", async () => {
    mockFetch.mockResolvedValue({ data: [{ id: "m1", name: "Para", strength: "500mg" }] } as never);
    renderField(field("/medications?search=pa"));
    const options = await optionsAfterLoad();
    expect(mockFetch).toHaveBeenCalledWith("/medications?search=pa&page=1&limit=100");
    expect(options[0]).toMatchObject({ code: "m1", label: "Para (500mg)" });
  });

  it("omits the strength suffix when absent and does not re-append paging when limit is present", async () => {
    mockFetch.mockResolvedValue({ data: [{ id: "m2", name: "Drug" }] } as never);
    renderField(field("/medications?limit=5"));
    const options = await optionsAfterLoad();
    expect(mockFetch).toHaveBeenCalledWith("/medications?limit=5");
    expect(options[0]).toMatchObject({ code: "m2", label: "Drug" });
  });
});

describe("useDynamicOptions — financial services mapper", () => {
  it("appends limit and submits the service id as the option code", async () => {
    mockFetch.mockResolvedValue({ data: [{ id: "svc-1", name: "Consultation" }] } as never);
    renderField(field("/financial/catalog/services"));
    const options = await optionsAfterLoad();
    expect(mockFetch).toHaveBeenCalledWith("/financial/catalog/services?limit=100");
    expect(options[0]).toMatchObject({ code: "svc-1", label: "Consultation" });
  });
});

describe("useDynamicOptions — generic fallback", () => {
  it("maps a bare array payload", async () => {
    mockFetch.mockResolvedValue([{ code: "A", label: "Alpha" }] as never);
    renderField(field("/custom/options"));
    const options = await optionsAfterLoad();
    expect(options[0]).toMatchObject({ code: "A", label: "Alpha" });
  });

  it("maps a { data: [...] } payload", async () => {
    mockFetch.mockResolvedValue({ data: [{ code: "B", label: "Beta" }] } as never);
    renderField(field("/custom/wrapped"));
    const options = await optionsAfterLoad();
    expect(options[0]).toMatchObject({ code: "B", label: "Beta" });
  });
});

describe("useDynamicOptions — error", () => {
  it("surfaces isError when the request rejects", async () => {
    mockFetch.mockRejectedValue(new Error("boom"));
    renderField(field("/care-paths"));
    await waitFor(() => expect(read().isError).toBe(true));
    expect(read().options).toEqual([]);
  });
});
