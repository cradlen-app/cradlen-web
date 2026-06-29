import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TemplateExecutionContextProvider } from "@/builder/runtime/TemplateExecutionContext";
import { JourneyClinicalFormShell } from "./JourneyClinicalFormShell";
import type { FormTemplateDto } from "@/builder/templates/template.types";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const TEMPLATE = {
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

function renderShell(props: {
  onSave: (body: Record<string, unknown>) => Promise<void>;
  saving?: boolean;
  readOnly?: boolean;
}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TemplateExecutionContextProvider
        template={TEMPLATE}
        initialFormValues={{ notes: "hello" }}
      >
        <JourneyClinicalFormShell
          template={TEMPLATE}
          onSave={props.onSave}
          saving={props.saving ?? false}
          readOnly={props.readOnly}
        />
      </TemplateExecutionContextProvider>
    </QueryClientProvider>,
  );
}

describe("JourneyClinicalFormShell", () => {
  it("renders the template fields hydrated from the execution state", () => {
    renderShell({ onSave: vi.fn() });
    expect(screen.getByText("Notes")).toBeInTheDocument();
    expect(screen.getByDisplayValue("hello")).toBeInTheDocument();
  });

  it("flattens the bindings and passes the body to onSave", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderShell({ onSave });
    fireEvent.click(screen.getByRole("button", { name: "save" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith({ notes: "hello" });
  });

  it("hides the Save button in read-only mode", () => {
    renderShell({ onSave: vi.fn(), readOnly: true });
    expect(
      screen.queryByRole("button", { name: "save" }),
    ).not.toBeInTheDocument();
  });

  it("disables Save while saving", () => {
    renderShell({ onSave: vi.fn(), saving: true });
    expect(screen.getByRole("button", { name: "save" })).toBeDisabled();
  });
});
