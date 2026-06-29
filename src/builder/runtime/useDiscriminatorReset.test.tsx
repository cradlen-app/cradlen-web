import { render, screen, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  TemplateExecutionContextProvider,
  useTemplateExecution,
} from "./TemplateExecutionContext";
import { useDiscriminatorReset } from "./useDiscriminatorReset";
import type { FormFieldDto, FormTemplateDto } from "../templates/template.types";

function sysField(code: string, isDiscriminator: boolean): FormFieldDto {
  return {
    id: `f-${code}`,
    code,
    label: code,
    type: "SELECT",
    order: 0,
    required: false,
    binding: { namespace: "SYSTEM", path: code },
    config: isDiscriminator ? { logic: { is_discriminator: true } } : {},
  };
}

function patientField(code: string): FormFieldDto {
  return {
    id: `f-${code}`,
    code,
    label: code,
    type: "TEXT",
    order: 1,
    required: false,
    binding: { namespace: "PATIENT", path: code },
    config: {},
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

function Harness() {
  useDiscriminatorReset();
  const { state, setFieldValue } = useTemplateExecution();
  return (
    <div>
      <output data-testid="full_name">{String(state.formValues.full_name ?? "∅")}</output>
      <output data-testid="visitor_type">{String(state.systemValues.visitor_type ?? "∅")}</output>
      <output data-testid="ui_flag">{String(state.systemValues.ui_flag ?? "∅")}</output>
      <button onClick={() => setFieldValue("visitor_type", "MEDICAL_REP")}>flip-disc</button>
      <button onClick={() => setFieldValue("ui_flag", "ON")}>flip-nondisc</button>
    </div>
  );
}

function renderWith(fields: FormFieldDto[]) {
  return render(
    <TemplateExecutionContextProvider
      template={makeTemplate(fields)}
      initialSystemValues={{ visitor_type: "PATIENT" }}
      initialFormValues={{ full_name: "Aisha" }}
    >
      <Harness />
    </TemplateExecutionContextProvider>,
  );
}

describe("useDiscriminatorReset", () => {
  it("does not reset on first mount", () => {
    renderWith([sysField("visitor_type", true), patientField("full_name")]);
    expect(screen.getByTestId("full_name").textContent).toBe("Aisha");
  });

  it("wipes formValues but preserves systemValues when a discriminator changes", () => {
    renderWith([sysField("visitor_type", true), patientField("full_name")]);
    act(() => {
      screen.getByText("flip-disc").click();
    });
    expect(screen.getByTestId("full_name").textContent).toBe("∅");
    expect(screen.getByTestId("visitor_type").textContent).toBe("MEDICAL_REP");
  });

  it("does not reset when a non-discriminator SYSTEM field changes", () => {
    renderWith([
      sysField("visitor_type", true),
      sysField("ui_flag", false),
      patientField("full_name"),
    ]);
    act(() => {
      screen.getByText("flip-nondisc").click();
    });
    expect(screen.getByTestId("ui_flag").textContent).toBe("ON");
    // The non-discriminator change must not wipe the form.
    expect(screen.getByTestId("full_name").textContent).toBe("Aisha");
  });

  it("never resets when the template carries no discriminators", () => {
    renderWith([sysField("ui_flag", false), patientField("full_name")]);
    act(() => {
      screen.getByText("flip-nondisc").click();
    });
    expect(screen.getByTestId("full_name").textContent).toBe("Aisha");
  });
});
