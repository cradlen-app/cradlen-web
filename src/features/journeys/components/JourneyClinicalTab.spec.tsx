import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { JourneyClinicalTab } from "./JourneyClinicalTab";
import type { JourneyDescriptorDto } from "../types/journey.types";
import type { FormTemplateDto } from "@/builder/templates/template.types";
import * as templatesApi from "@/builder/templates/templates.api";
import * as journeyClinicalApi from "../lib/journey-clinical.api";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}));

const TEMPLATE: FormTemplateDto = {
  id: "tpl",
  code: "obgyn_pregnancy",
  name: "Pregnancy",
  description: null,
  scope: "JOURNEY_CLINICAL",
  version: 1,
  activated_at: null,
  specialty_id: null,
  sections: [
    {
      id: "s1",
      code: "profile",
      name: "Pregnancy profile",
      order: 0,
      config: {},
      fields: [
        {
          id: "f-notes",
          code: "notes",
          label: "Notes",
          type: "TEXT",
          order: 0,
          required: false,
          binding: { namespace: "VISIT_ENCOUNTER", path: "notes" },
          config: {},
        },
      ],
    },
  ],
} as unknown as FormTemplateDto;

const DESCRIPTOR: JourneyDescriptorDto = {
  journey_id: "j1",
  episode_id: "e1",
  care_path_code: "OBGYN_PREGNANCY",
  specialty_code: "OBGYN",
  label: "Pregnancy",
  status: "ACTIVE",
  started_at: "2026-01-01T00:00:00.000Z",
  ended_at: null,
  clinical_surface: { template_code: "obgyn_pregnancy", label: "Pregnancy" },
};

const ENVELOPE = { journey_id: "j1", version: 3, notes: "hello" };

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  vi.spyOn(templatesApi, "fetchFormTemplate").mockResolvedValue(TEMPLATE);
  vi.spyOn(journeyClinicalApi, "getJourneyClinical").mockResolvedValue({
    data: ENVELOPE,
  });
  vi.spyOn(journeyClinicalApi, "patchJourneyClinical").mockResolvedValue({
    data: { ...ENVELOPE, version: 4 },
  });
});

describe("JourneyClinicalTab", () => {
  it("renders the surface template and hydrates fields from the envelope", async () => {
    render(<JourneyClinicalTab visitId="v1" descriptor={DESCRIPTOR} />, {
      wrapper,
    });
    await waitFor(() =>
      expect(screen.getByText("Notes")).toBeInTheDocument(),
    );
    expect(screen.getByDisplayValue("hello")).toBeInTheDocument();
  });

  it("saves the flattened body (last-write-wins, no If-Match)", async () => {
    const spy = vi.spyOn(journeyClinicalApi, "patchJourneyClinical");
    render(<JourneyClinicalTab visitId="v1" descriptor={DESCRIPTOR} />, {
      wrapper,
    });
    await waitFor(() => screen.getByText("Notes"));

    fireEvent.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({
        visitId: "v1",
        journeyId: "j1",
        body: { notes: "hello" },
      }),
    );
  });
});
