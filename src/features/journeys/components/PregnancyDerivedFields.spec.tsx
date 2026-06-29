import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  TemplateExecutionContextProvider,
  useTemplateExecution,
} from "@/builder/runtime/TemplateExecutionContext";
import { PregnancyDerivedFields } from "./PregnancyDerivedFields";
import type { FormTemplateDto } from "@/builder/templates/template.types";

const template = {
  id: "t",
  code: "obgyn_pregnancy",
  name: "P",
  version: 3,
  scope: "JOURNEY_CLINICAL",
  sections: [
    {
      id: "s",
      code: "fetuses",
      name: "Fetus",
      order: 0,
      is_repeatable: true,
      config: {},
      fields: [],
    },
  ],
} as unknown as FormTemplateDto;

function Probe() {
  const { state, getRepeatableRows } = useTemplateExecution();
  return (
    <>
      <div data-testid="count">{getRepeatableRows("fetuses").length}</div>
      <div data-testid="fetuses">
        {String(state.formValues.number_of_fetuses ?? "")}
      </div>
      <div data-testid="risk">{String(state.formValues.risk_level ?? "")}</div>
    </>
  );
}

function renderWith(
  initialFormValues: Record<string, unknown>,
  initialRepeatableRows: Record<string, { rowKey: string; values: Record<string, unknown> }[]> = {
    fetuses: [],
  },
) {
  return render(
    <TemplateExecutionContextProvider
      template={template}
      initialFormValues={initialFormValues}
      initialRepeatableRows={initialRepeatableRows}
    >
      <PregnancyDerivedFields />
      <Probe />
    </TemplateExecutionContextProvider>,
  );
}

describe("PregnancyDerivedFields", () => {
  it("auto-opens fetus rows to match the fetus count (Twins → 2)", async () => {
    renderWith({ pregnancy_type: "TWINS", number_of_fetuses: 2 });
    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("2"),
    );
  });

  it("maps SINGLETON to one fetus and leaves risk untouched", async () => {
    renderWith({ pregnancy_type: "SINGLETON" });
    await waitFor(() =>
      expect(screen.getByTestId("fetuses").textContent).toBe("1"),
    );
    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(screen.getByTestId("risk").textContent).toBe("");
  });

  it("maps TRIPLETS to three fetuses and nudges risk to HIGH", async () => {
    renderWith({ pregnancy_type: "TRIPLETS" });
    await waitFor(() =>
      expect(screen.getByTestId("fetuses").textContent).toBe("3"),
    );
    expect(screen.getByTestId("risk").textContent).toBe("HIGH");
  });

  it("nudges risk to HIGH for multiples when risk is unset", async () => {
    renderWith({ pregnancy_type: "TWINS" });
    await waitFor(() =>
      expect(screen.getByTestId("risk").textContent).toBe("HIGH"),
    );
  });

  it("treats NORMAL as an unset baseline and still nudges to HIGH", async () => {
    renderWith({ pregnancy_type: "TWINS", risk_level: "NORMAL" });
    await waitFor(() =>
      expect(screen.getByTestId("risk").textContent).toBe("HIGH"),
    );
  });

  it("never overrides an explicit (non-normal) risk choice", async () => {
    renderWith({ pregnancy_type: "TWINS", risk_level: "LOW" });
    // Count still maps (proves the effect ran), but the doctor's risk stays.
    await waitFor(() =>
      expect(screen.getByTestId("fetuses").textContent).toBe("2"),
    );
    expect(screen.getByTestId("risk").textContent).toBe("LOW");
  });

  it("never removes fetus rows when the count is lower than existing rows", async () => {
    renderWith(
      { pregnancy_type: "SINGLETON", number_of_fetuses: 1 },
      {
        fetuses: [
          { rowKey: "a", values: {} },
          { rowKey: "b", values: {} },
          { rowKey: "c", values: {} },
        ],
      },
    );
    // SINGLETON wants 1 row but 3 already exist with biometrics — keep all 3.
    await waitFor(() =>
      expect(screen.getByTestId("fetuses").textContent).toBe("1"),
    );
    expect(screen.getByTestId("count").textContent).toBe("3");
  });
});
