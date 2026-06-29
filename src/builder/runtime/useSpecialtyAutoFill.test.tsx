import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  TemplateExecutionContextProvider,
  useTemplateExecution,
} from "./TemplateExecutionContext";
import { useSpecialtyAutoFill } from "./useSpecialtyAutoFill";
import type { FormFieldDto, FormTemplateDto } from "../templates/template.types";

const auth = vi.hoisted(() => ({ organizationId: "org-1" as string | null, branchId: "branch-1" as string | null }));

vi.mock("@/features/auth/store/authContextStore", () => ({
  useAuthContextStore: (selector: (s: { organizationId: string | null; branchId: string | null }) => unknown) =>
    selector({ organizationId: auth.organizationId, branchId: auth.branchId }),
}));

const STAFF_URL = "/organizations/org-1/branches/branch-1/staff?page=1&limit=100";
const STAFF_SOURCE = "/organizations/{org_id}/branches/{branch_id}/staff";

function doctorField(code: string, opts: { entity?: boolean } = {}): FormFieldDto {
  return {
    id: `f-${code}`,
    code,
    label: code,
    type: "SELECT",
    order: 0,
    required: false,
    binding: { namespace: "VISIT", path: "assigned_doctor_id" },
    config: {
      ui: { optionsSource: STAFF_SOURCE },
      logic: opts.entity ? { entity: "doctor" } : {},
    },
  };
}

function specialtySystemField(): FormFieldDto {
  return {
    id: "f-spec",
    code: "specialty_code",
    label: "Specialty",
    type: "SELECT",
    order: 1,
    required: false,
    binding: { namespace: "SYSTEM", path: "specialty_code" },
    config: { logic: { is_discriminator: true } },
  };
}

function makeTemplate(fields: FormFieldDto[]): FormTemplateDto {
  return {
    id: "tpl",
    code: "tpl",
    name: "T",
    description: null,
    scope: "BOOK_VISIT",
    version: 1,
    activated_at: null,
    specialty_id: null,
    sections: [{ id: "s", code: "sec", name: "S", order: 0, config: {}, fields }],
  };
}

function Harness({ doctorCode }: { doctorCode: string }) {
  useSpecialtyAutoFill();
  const { state, setFieldValue } = useTemplateExecution();
  return (
    <div>
      <output data-testid="specialty">{String(state.systemValues.specialty_code ?? "∅")}</output>
      <button onClick={() => setFieldValue(doctorCode, "doc-1")}>pick</button>
    </div>
  );
}

function renderWith(
  fields: FormFieldDto[],
  doctorCode: string,
  {
    cache,
    initialSystemValues = {},
  }: { cache?: unknown; initialSystemValues?: Record<string, unknown> } = {},
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  if (cache !== undefined) client.setQueryData(["form-template-options", STAFF_URL], cache);
  render(
    <QueryClientProvider client={client}>
      <TemplateExecutionContextProvider
        template={makeTemplate(fields)}
        initialSystemValues={initialSystemValues}
      >
        <Harness doctorCode={doctorCode} />
      </TemplateExecutionContextProvider>
    </QueryClientProvider>,
  );
}

function specialty() {
  return screen.getByTestId("specialty").textContent;
}

beforeEach(() => {
  auth.organizationId = "org-1";
  auth.branchId = "branch-1";
});

describe("useSpecialtyAutoFill", () => {
  it("writes specialty_code from the picked doctor's first cached specialty (assigned_doctor_ prefix)", () => {
    renderWith([doctorField("assigned_doctor_id"), specialtySystemField()], "assigned_doctor_id", {
      cache: { data: [{ staff_id: "doc-1", specialties: [{ code: "OBGYN" }] }] },
    });
    expect(specialty()).toBe("∅");
    act(() => screen.getByText("pick").click());
    expect(specialty()).toBe("OBGYN");
  });

  it("detects a doctor field via config.logic.entity === 'doctor'", () => {
    renderWith([doctorField("who", { entity: true }), specialtySystemField()], "who", {
      cache: { data: [{ staff_id: "doc-1", specialties: [{ code: "CARDIO" }] }] },
    });
    act(() => screen.getByText("pick").click());
    expect(specialty()).toBe("CARDIO");
  });

  it("does not overwrite an already-chosen specialty_code", () => {
    renderWith([doctorField("assigned_doctor_id"), specialtySystemField()], "assigned_doctor_id", {
      cache: { data: [{ staff_id: "doc-1", specialties: [{ code: "OBGYN" }] }] },
      initialSystemValues: { specialty_code: "PEDS" },
    });
    act(() => screen.getByText("pick").click());
    expect(specialty()).toBe("PEDS");
  });

  it("is a no-op when the picked doctor has no specialties in cache", () => {
    renderWith([doctorField("assigned_doctor_id"), specialtySystemField()], "assigned_doctor_id", {
      cache: { data: [{ staff_id: "doc-1", specialties: [] }] },
    });
    act(() => screen.getByText("pick").click());
    expect(specialty()).toBe("∅");
  });

  it("is a no-op when the doctor is not found in the cached list", () => {
    renderWith([doctorField("assigned_doctor_id"), specialtySystemField()], "assigned_doctor_id", {
      cache: { data: [{ staff_id: "someone-else", specialties: [{ code: "OBGYN" }] }] },
    });
    act(() => screen.getByText("pick").click());
    expect(specialty()).toBe("∅");
  });

  it("is a no-op when the template has no SYSTEM specialty_code field", () => {
    // No specialty field → systemFieldCodes lacks it → hook returns early. The
    // doctor value still changes but no specialty is written.
    renderWith([doctorField("assigned_doctor_id")], "assigned_doctor_id", {
      cache: { data: [{ staff_id: "doc-1", specialties: [{ code: "OBGYN" }] }] },
    });
    act(() => screen.getByText("pick").click());
    expect(specialty()).toBe("∅");
  });
});
