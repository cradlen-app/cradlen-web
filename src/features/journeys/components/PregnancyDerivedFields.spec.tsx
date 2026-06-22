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
  const { getRepeatableRows } = useTemplateExecution();
  return <div data-testid="count">{getRepeatableRows("fetuses").length}</div>;
}

describe("PregnancyDerivedFields", () => {
  it("auto-opens fetus rows to match the fetus count (Twins → 2)", async () => {
    render(
      <TemplateExecutionContextProvider
        template={template}
        initialFormValues={{ pregnancy_type: "TWINS", number_of_fetuses: 2 }}
        initialRepeatableRows={{ fetuses: [] }}
      >
        <PregnancyDerivedFields />
        <Probe />
      </TemplateExecutionContextProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("2"),
    );
  });
});
