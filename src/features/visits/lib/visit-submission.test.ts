import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildSubmission } from "@/builder/templates/submission-builder";
import type { ExecutionSnapshot } from "@/builder/templates/submission-builder";
import type { FormTemplateDto } from "@/builder/templates/template.types";
import { buildVisitPayload } from "./visit-submission";

vi.mock("@/builder/templates/submission-builder", () => ({
  buildSubmission: vi.fn(),
}));

const mockBuild = vi.mocked(buildSubmission);

// buildSubmission is mocked, so these are opaque placeholders.
const template = {} as FormTemplateDto;
const snapshot = {} as ExecutionSnapshot;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("buildVisitPayload — booking (isEdit false)", () => {
  it("stamps branch_id onto a new booking", () => {
    mockBuild.mockReturnValueOnce({ patient_id: "p-1" });
    const body = buildVisitPayload(template, snapshot, {
      isEdit: false,
      branchId: "br-1",
    });
    expect(body.branch_id).toBe("br-1");
    expect(body.patient_id).toBe("p-1");
  });

  it("expands a 16-char datetime-local scheduled_at to a full ISO timestamp", () => {
    mockBuild.mockReturnValueOnce({ scheduled_at: "2026-06-28T09:00" });
    const body = buildVisitPayload(template, snapshot, {
      isEdit: false,
      branchId: "br-1",
    });
    // datetime-local is interpreted as local time; assert it became a real ISO
    // instant rather than the bare 16-char form.
    expect(body.scheduled_at).not.toBe("2026-06-28T09:00");
    expect(String(body.scheduled_at)).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
  });

  it("leaves an already-ISO scheduled_at untouched (length != 16)", () => {
    const iso = "2026-06-28T09:00:00.000Z";
    mockBuild.mockReturnValueOnce({ scheduled_at: iso });
    const body = buildVisitPayload(template, snapshot, {
      isEdit: false,
      branchId: "br-1",
    });
    expect(body.scheduled_at).toBe(iso);
  });

  it("leaves an invalid 16-char scheduled_at unchanged", () => {
    mockBuild.mockReturnValueOnce({ scheduled_at: "not-a-datetime!" });
    const body = buildVisitPayload(template, snapshot, {
      isEdit: false,
      branchId: "br-1",
    });
    expect(body.scheduled_at).toBe("not-a-datetime!");
  });

  it("keeps lookup ids on a new booking", () => {
    mockBuild.mockReturnValueOnce({ patient_id: "p-1", medical_rep_id: "rep-1" });
    const body = buildVisitPayload(template, snapshot, {
      isEdit: false,
      branchId: "br-1",
    });
    expect(body.patient_id).toBe("p-1");
    expect(body.medical_rep_id).toBe("rep-1");
  });
});

describe("buildVisitPayload — edit (isEdit true)", () => {
  it("does NOT stamp branch_id and strips leftover lookup ids", () => {
    mockBuild.mockReturnValueOnce({
      full_name: "Sara",
      patient_id: "p-1",
      medical_rep_id: "rep-1",
    });
    const body = buildVisitPayload(template, snapshot, {
      isEdit: true,
      branchId: "br-1",
    });
    expect(body.branch_id).toBeUndefined();
    expect("patient_id" in body).toBe(false);
    expect("medical_rep_id" in body).toBe(false);
    expect(body.full_name).toBe("Sara");
  });
});
