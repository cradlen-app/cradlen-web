import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { TemplateExecutionContextProvider } from "../runtime/TemplateExecutionContext";
import { TemplateRenderer } from "./TemplateRenderer";
import type {
  FormFieldDto,
  FormSectionDto,
  FormTemplateDto,
} from "../templates/template.types";

vi.mock("@/features/auth/store/authContextStore", () => ({
  useAuthContextStore: (selector: (s: { organizationId: string | null; branchId: string | null }) => unknown) =>
    selector({ organizationId: "org-1", branchId: "branch-1" }),
}));

let seq = 0;
function field(partial: Partial<FormFieldDto> & { code: string }): FormFieldDto {
  seq += 1;
  return {
    id: `f-${seq}`,
    label: partial.code,
    type: "TEXT",
    order: seq,
    required: false,
    binding: { namespace: "VISIT", path: partial.code },
    config: {},
    ...partial,
  } as FormFieldDto;
}

function section(partial: Partial<FormSectionDto> & { code: string; fields: FormFieldDto[] }): FormSectionDto {
  return {
    id: `s-${partial.code}`,
    name: partial.code,
    order: 0,
    config: {},
    ...partial,
  } as FormSectionDto;
}

function makeTemplate(sections: FormSectionDto[], extra: Partial<FormTemplateDto> = {}): FormTemplateDto {
  return {
    id: "tpl",
    code: "tpl",
    name: "T",
    description: null,
    scope: "BOOK_VISIT",
    version: 1,
    activated_at: null,
    specialty_id: null,
    sections,
    ...extra,
  };
}

function renderTemplate(
  template: FormTemplateDto,
  props: Partial<Parameters<typeof TemplateRenderer>[0]> = {},
  initialFormValues: Record<string, unknown> = {},
  initialSystemValues: Record<string, unknown> = {},
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <TemplateExecutionContextProvider
        template={template}
        initialFormValues={initialFormValues}
        initialSystemValues={initialSystemValues}
      >
        <TemplateRenderer template={template} {...props} />
      </TemplateExecutionContextProvider>
    </QueryClientProvider>,
  );
}

describe("TemplateRenderer — section ordering + rendering", () => {
  it("renders sections sorted by order with their fields", () => {
    const template = makeTemplate([
      section({ code: "second", name: "Second", order: 2, fields: [field({ code: "b_field" })] }),
      section({ code: "first", name: "First", order: 1, fields: [field({ code: "a_field" })] }),
    ]);
    renderTemplate(template);
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.getByText("a_field")).toBeInTheDocument();
    expect(screen.getByText("b_field")).toBeInTheDocument();
  });

  it("omits hidden section codes entirely", () => {
    const template = makeTemplate([
      section({ code: "keep", name: "Keep", order: 1, fields: [field({ code: "keep_f" })] }),
      section({ code: "drop", name: "Drop", order: 2, fields: [field({ code: "drop_f" })] }),
    ]);
    renderTemplate(template, { hiddenSectionCodes: new Set(["drop"]) });
    expect(screen.getByText("Keep")).toBeInTheDocument();
    expect(screen.queryByText("Drop")).not.toBeInTheDocument();
    expect(screen.queryByText("drop_f")).not.toBeInTheDocument();
  });

  it("hides a section whose visible predicate is unsatisfied", () => {
    const template = makeTemplate([
      section({
        code: "cond",
        name: "Conditional",
        order: 1,
        fields: [field({ code: "cond_f" })],
        config: { logic: { predicates: [{ effect: "visible", when: { eq: { show: true } } }] } },
      }),
    ]);
    renderTemplate(template);
    expect(screen.queryByText("Conditional")).not.toBeInTheDocument();
    // Now satisfy the predicate.
    renderTemplate(template, {}, {}, { show: true });
    expect(screen.getByText("Conditional")).toBeInTheDocument();
  });
});

describe("TemplateRenderer — display only", () => {
  it("renders fields as static text when the template is display-only", () => {
    const template = makeTemplate(
      [section({ code: "s", name: "S", order: 1, fields: [field({ code: "greeting" })] })],
      { is_display_only: true },
    );
    renderTemplate(template, {}, { greeting: "Hello" });
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});

describe("TemplateRenderer — grouping", () => {
  it("renders a group heading and forwards a header slot", () => {
    const template = makeTemplate([
      section({
        code: "g1",
        name: "Sec1",
        order: 1,
        fields: [field({ code: "g1f" })],
        config: { ui: { group: "Clinical" } },
      }),
    ]);
    renderTemplate(template, {
      renderGroupHeaderSlot: (name) => <span>slot:{name}</span>,
    });
    expect(screen.getByRole("heading", { name: "Clinical" })).toBeInTheDocument();
    expect(screen.getByText("slot:Clinical")).toBeInTheDocument();
  });

  it("collapses a group to its heading only", () => {
    const template = makeTemplate([
      section({
        code: "g1",
        name: "Sec1",
        order: 1,
        fields: [field({ code: "hidden_when_collapsed" })],
        config: { ui: { group: "Clinical" } },
      }),
    ]);
    renderTemplate(template, { collapsedGroups: new Set(["Clinical"]) });
    expect(screen.getByRole("heading", { name: "Clinical" })).toBeInTheDocument();
    expect(screen.queryByText("hidden_when_collapsed")).not.toBeInTheDocument();
  });
});

describe("TemplateRenderer — id targets + repeatable + errors", () => {
  it("does not render a field that is the idTarget of an entity-search", () => {
    const template = makeTemplate([
      section({
        code: "s",
        name: "S",
        order: 1,
        fields: [
          field({
            code: "drug_search",
            config: { ui: { searchEntity: { kind: "medication", idTarget: "drug_id" } } },
          }),
          field({ code: "drug_id" }),
        ],
      }),
    ]);
    renderTemplate(template);
    expect(screen.queryByText("drug_id")).not.toBeInTheDocument();
  });

  it("renders a repeatable section via the repeatable renderer", () => {
    const template = makeTemplate([
      section({
        code: "rep",
        name: "Repeatable",
        order: 1,
        is_repeatable: true,
        fields: [field({ code: "row_f", binding: { namespace: "VISIT", path: "rows.row_f" } })],
      }),
    ]);
    renderTemplate(template);
    expect(screen.getByText("+ Add row")).toBeInTheDocument();
  });

  it("forwards a field error message", () => {
    const template = makeTemplate([
      section({ code: "s", name: "S", order: 1, fields: [field({ code: "name" })] }),
    ]);
    renderTemplate(template, { errors: { name: "Name is required" } });
    expect(screen.getByText("Name is required")).toBeInTheDocument();
  });
});
