import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  TemplateExecutionContextProvider,
  type RepeatableRow,
} from "../runtime/TemplateExecutionContext";
import { RepeatableSectionRenderer } from "./RepeatableSectionRenderer";
import type {
  FormFieldDto,
  FormSectionDto,
  FormTemplateDto,
} from "../templates/template.types";

function field(partial: Partial<FormFieldDto> & Pick<FormFieldDto, "code">): FormFieldDto {
  return {
    id: partial.code,
    label: partial.code,
    type: "TEXT",
    order: 0,
    required: false,
    binding: { namespace: "PATIENT", path: `rows.${partial.code}` },
    config: {},
    ...partial,
  };
}

const SECTION: FormSectionDto = {
  id: "allergies",
  code: "allergies",
  name: "Allergies",
  order: 0,
  is_repeatable: true,
  config: {},
  fields: [field({ code: "allergy_to", label: "Allergy to" })],
};

function renderSection(
  props: {
    section?: FormSectionDto;
    displayOnly?: boolean;
    initialRows?: RepeatableRow[];
  } = {},
) {
  const section = props.section ?? SECTION;
  const template = {
    id: "t",
    code: "c",
    name: "n",
    description: null,
    scope: "PATIENT_HISTORY",
    version: 1,
    activated_at: null,
    specialty_id: null,
    sections: [section],
  } as FormTemplateDto;
  return render(
    <TemplateExecutionContextProvider
      template={template}
      initialRepeatableRows={
        props.initialRows ? { [section.code]: props.initialRows } : {}
      }
    >
      <RepeatableSectionRenderer section={section} displayOnly={props.displayOnly} />
    </TemplateExecutionContextProvider>,
  );
}

describe("RepeatableSectionRenderer (edit mode)", () => {
  it("seeds a single empty row on mount and shows the add button", () => {
    renderSection();
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.queryByText("#2")).not.toBeInTheDocument();
    expect(screen.getByText("+ Add row")).toBeInTheDocument();
    // Single row → no Remove control.
    expect(screen.queryByText("Remove")).not.toBeInTheDocument();
  });

  it("auto-appends a trailing empty row once the last row holds a value", () => {
    renderSection({ initialRows: [{ rowKey: "r1", values: { allergy_to: "Latex" } }] });
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
    // More than one row → each row exposes a Remove control.
    expect(screen.getAllByText("Remove").length).toBe(2);
  });

  it("adds a row when the add button is clicked", () => {
    renderSection();
    fireEvent.click(screen.getByText("+ Add row"));
    expect(screen.getByText("#2")).toBeInTheDocument();
  });

  it("removes a row when its Remove control is clicked", () => {
    renderSection({
      initialRows: [
        { rowKey: "r1", values: { allergy_to: "Latex" } },
        { rowKey: "r2", values: { allergy_to: "Dust" } },
      ],
    });
    // Two seeded + one auto-appended trailing empty = 3 rows.
    expect(screen.getByText("#3")).toBeInTheDocument();
    const removes = screen.getAllByText("Remove");
    fireEvent.click(removes[0]);
    // One row gone.
    expect(screen.queryByText("#3")).not.toBeInTheDocument();
  });

  it("hides the resolved-id sibling field of an entity-search picker", () => {
    const section: FormSectionDto = {
      ...SECTION,
      code: "meds",
      fields: [
        field({
          code: "drug_search",
          label: "Drug",
          config: { ui: { searchEntity: { kind: "medication", idTarget: "med_id" } } },
        }),
        field({ code: "med_id", label: "Hidden Med Id" }),
        field({ code: "notes", label: "Notes" }),
      ],
    };
    renderSection({ section });
    expect(screen.getByText("Notes")).toBeInTheDocument();
    // The idTarget sibling is filtered out of the rendered fields.
    expect(screen.queryByText("Hidden Med Id")).not.toBeInTheDocument();
  });
});

describe("RepeatableSectionRenderer (display-only)", () => {
  it("renders an em-dash placeholder when there are no content rows", () => {
    renderSection({ displayOnly: true });
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("+ Add row")).not.toBeInTheDocument();
  });

  it("shows only rows that carry a value and no add/remove controls", () => {
    renderSection({
      displayOnly: true,
      initialRows: [
        { rowKey: "r1", values: { allergy_to: "Latex" } },
        { rowKey: "r2", values: {} },
      ],
    });
    expect(screen.getByText("#1")).toBeInTheDocument();
    // The empty row is filtered out in display-only mode.
    expect(screen.queryByText("#2")).not.toBeInTheDocument();
    expect(screen.queryByText("+ Add row")).not.toBeInTheDocument();
    expect(screen.queryByText("Remove")).not.toBeInTheDocument();
  });
});
