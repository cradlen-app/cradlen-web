import { describe, expect, it } from "vitest";
import { ApiError } from "@/infrastructure/http/api";
import type { FormTemplateDto } from "@/builder/templates/template.types";
import { mapVisitApiError } from "./mapVisitApiError";

// Minimal template: only `sections[].fields[].code` + `binding.path` are read by
// the server-error mappers, so a structural cast is enough.
const template = {
  sections: [
    {
      fields: [
        { code: "national_id", binding: { path: "national_id" } },
        { code: "full_name", binding: { path: "full_name" } },
      ],
    },
  ],
} as unknown as FormTemplateDto;

function apiErr(body: unknown, status = 400) {
  return new ApiError(status, "request failed", body);
}

describe("mapVisitApiError", () => {
  it("returns errorGeneric for a non-ApiError value", () => {
    expect(mapVisitApiError(new Error("boom"), template)).toEqual({
      kind: "toastKey",
      key: "errorGeneric",
    });
  });

  it("maps the PATIENT_HAS_OPEN_VISIT code to a known toast key", () => {
    const result = mapVisitApiError(
      apiErr({ error: { code: "PATIENT_HAS_OPEN_VISIT" } }),
      template,
    );
    expect(result).toEqual({ kind: "toastKey", key: "errorPatientHasOpenVisit" });
  });

  it("maps structured details.fields onto template field codes", () => {
    const result = mapVisitApiError(
      apiErr({
        error: {
          details: { fields: { national_id: ["has an invalid format"] } },
        },
      }),
      template,
    );
    expect(result).toEqual({
      kind: "fields",
      fieldErrors: { national_id: "has an invalid format" },
    });
  });

  it("maps a '<code> <message>' message array onto field codes", () => {
    const result = mapVisitApiError(
      apiErr({
        error: {
          message: ["national_id has an invalid format", "unknown_field nope"],
        },
      }),
      template,
    );
    expect(result).toEqual({
      kind: "fields",
      fieldErrors: { national_id: "has an invalid format" },
    });
  });

  it("falls back to a joined toast when no message-array entry maps to a field", () => {
    const result = mapVisitApiError(
      apiErr({ error: { message: ["server exploded", "try again"] } }),
      template,
    );
    expect(result).toEqual({
      kind: "toastMessage",
      message: "server exploded, try again",
    });
  });

  it("toasts a single server message verbatim", () => {
    const result = mapVisitApiError(
      apiErr({ error: { message: "Booking window closed" } }),
      template,
    );
    expect(result).toEqual({ kind: "toastMessage", message: "Booking window closed" });
  });

  it("returns errorGeneric for an ApiError with no usable body", () => {
    expect(mapVisitApiError(apiErr(undefined), template)).toEqual({
      kind: "toastKey",
      key: "errorGeneric",
    });
  });

  it("passes the blocking visitId through on PATIENT_HAS_OPEN_VISIT", () => {
    const result = mapVisitApiError(
      apiErr({
        error: {
          code: "PATIENT_HAS_OPEN_VISIT",
          details: { visitId: "visit-9" },
        },
      }),
      template,
    );
    expect(result).toEqual({
      kind: "toastKey",
      key: "errorPatientHasOpenVisit",
      visitId: "visit-9",
    });
  });

  describe("JOURNEY_ALLOWANCE_EXCEEDED", () => {
    it("parses the allowance counters", () => {
      const result = mapVisitApiError(
        apiErr(
          {
            error: {
              code: "JOURNEY_ALLOWANCE_EXCEEDED",
              details: { remaining: 0, needed: 1, allowance: 50, consumed: 50 },
            },
          },
          403,
        ),
        template,
      );
      expect(result).toEqual({
        kind: "allowanceExceeded",
        remaining: 0,
        needed: 1,
        allowance: 50,
        consumed: 50,
      });
    });

    it("defaults missing counters to zero rather than throwing", () => {
      const result = mapVisitApiError(
        apiErr({ error: { code: "JOURNEY_ALLOWANCE_EXCEEDED" } }, 403),
        template,
      );
      expect(result).toEqual({
        kind: "allowanceExceeded",
        remaining: 0,
        needed: 0,
        allowance: 0,
        consumed: 0,
      });
    });

    it("is not swallowed by the details.fields branch", () => {
      // Its `details` is a counter bag, not a field map — the code check has to
      // run first or this lands in the field mapper as garbage.
      const result = mapVisitApiError(
        apiErr(
          {
            error: {
              code: "JOURNEY_ALLOWANCE_EXCEEDED",
              details: { remaining: 2, needed: 3, allowance: 10, consumed: 8 },
            },
          },
          403,
        ),
      );
      expect(result.kind).toBe("allowanceExceeded");
    });
  });

  describe("without a template (the quick-start dialog)", () => {
    it("degrades details.fields to a joined toast", () => {
      const result = mapVisitApiError(
        apiErr({
          error: {
            details: {
              fields: {
                service_id: ["is required"],
                scheduled_at: ["must be a date"],
              },
            },
          },
        }),
      );
      expect(result).toEqual({
        kind: "toastMessage",
        message: "is required, must be a date",
      });
    });

    it("degrades a message array to a joined toast", () => {
      const result = mapVisitApiError(
        apiErr({ error: { message: ["national_id has an invalid format"] } }),
      );
      expect(result).toEqual({
        kind: "toastMessage",
        message: "national_id has an invalid format",
      });
    });

    it("still resolves known codes", () => {
      expect(
        mapVisitApiError(apiErr({ error: { code: "PATIENT_HAS_OPEN_VISIT" } })),
      ).toEqual({ kind: "toastKey", key: "errorPatientHasOpenVisit" });
    });
  });
});
