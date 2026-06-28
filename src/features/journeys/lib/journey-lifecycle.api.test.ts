import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiAuthFetch } from "@/infrastructure/http/api";
import { activatePregnancy, closePregnancy } from "./pregnancy.api";
import {
  PREGNANCY_ACTIVE_REQUIRES_CLOSE,
  activateSurgical,
  closeSurgical,
} from "./surgical.api";
import { getJourneyClinical, patchJourneyClinical } from "./journey-clinical.api";

vi.mock("@/infrastructure/http/api", () => ({
  apiAuthFetch: vi.fn(),
}));

const mockFetch = vi.mocked(apiAuthFetch);

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({ data: {} } as never);
});

describe("activatePregnancy", () => {
  it("POSTs an empty body to the encoded visit pregnancy endpoint by default", () => {
    activatePregnancy("v 1");
    expect(mockFetch).toHaveBeenCalledWith("/visits/v%201/pregnancy", {
      method: "POST",
      body: JSON.stringify({}),
    });
  });

  it("serializes the activation body", () => {
    const body = { risk_level: "HIGH", lmp: "2024-01-01" };
    activatePregnancy("v-1", body);
    expect(mockFetch).toHaveBeenCalledWith("/visits/v-1/pregnancy", {
      method: "POST",
      body: JSON.stringify(body),
    });
  });
});

describe("closePregnancy", () => {
  it("POSTs the outcome wrapped under an outcome key", () => {
    const outcome = { outcome_type: "LIVE_BIRTH" as const, date: "2024-09-01" };
    closePregnancy("v-1", outcome);
    expect(mockFetch).toHaveBeenCalledWith("/visits/v-1/pregnancy/close", {
      method: "POST",
      body: JSON.stringify({ outcome }),
    });
  });
});

describe("activateSurgical", () => {
  it("POSTs an empty body by default to the encoded visit surgical endpoint", () => {
    activateSurgical("v 1");
    expect(mockFetch).toHaveBeenCalledWith("/visits/v%201/surgical", {
      method: "POST",
      body: JSON.stringify({}),
    });
  });

  it("serializes the activation body", () => {
    const body = { procedure_code: "CES", urgency: "ELECTIVE" };
    activateSurgical("v-1", body);
    expect(mockFetch).toHaveBeenCalledWith("/visits/v-1/surgical", {
      method: "POST",
      body: JSON.stringify(body),
    });
  });

  it("exports the pregnancy-active 409 code constant", () => {
    expect(PREGNANCY_ACTIVE_REQUIRES_CLOSE).toBe("PREGNANCY_ACTIVE_REQUIRES_CLOSE");
  });
});

describe("closeSurgical", () => {
  it("POSTs the outcome wrapped under an outcome key", () => {
    const outcome = { outcome_type: "COMPLETED" as const };
    closeSurgical("v-1", outcome);
    expect(mockFetch).toHaveBeenCalledWith("/visits/v-1/surgical/close", {
      method: "POST",
      body: JSON.stringify({ outcome }),
    });
  });
});

describe("getJourneyClinical", () => {
  it("GETs the encoded visit/journey clinical surface and forwards the signal", () => {
    const controller = new AbortController();
    getJourneyClinical("v 1", "j 2", controller.signal);
    expect(mockFetch).toHaveBeenCalledWith(
      "/visits/v%201/journeys/j%202/clinical",
      { signal: controller.signal },
    );
  });

  it("passes an undefined signal when none provided", () => {
    getJourneyClinical("v-1", "j-2");
    expect(mockFetch).toHaveBeenCalledWith(
      "/visits/v-1/journeys/j-2/clinical",
      { signal: undefined },
    );
  });
});

describe("patchJourneyClinical", () => {
  it("PATCHes the serialized body to the clinical surface", () => {
    const body = { systolic_bp: 120 };
    patchJourneyClinical({ visitId: "v-1", journeyId: "j-2", body });
    expect(mockFetch).toHaveBeenCalledWith(
      "/visits/v-1/journeys/j-2/clinical",
      { method: "PATCH", body: JSON.stringify(body) },
    );
  });
});
