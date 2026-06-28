import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/render";
import type { ApiVitalsTrendPoint } from "../../../types/visits.api.types";
import { BpTrendChart } from "./BpTrendChart";

function point(over: Partial<ApiVitalsTrendPoint> = {}): ApiVitalsTrendPoint {
  return {
    completed_at: "2026-03-12T00:00:00.000Z",
    systolic_bp: null,
    diastolic_bp: null,
    bmi: null,
    weight_kg: null,
    ...over,
  } as ApiVitalsTrendPoint;
}

describe("BpTrendChart", () => {
  it("shows the empty label when no points carry blood-pressure readings", () => {
    renderWithIntl(<BpTrendChart points={[point()]} emptyLabel="No BP readings" />);
    expect(screen.getByText("No BP readings")).toBeInTheDocument();
  });

  it("shows the empty label when given an empty point list", () => {
    renderWithIntl(<BpTrendChart points={[]} emptyLabel="No BP readings" />);
    expect(screen.getByText("No BP readings")).toBeInTheDocument();
  });

  it("renders the chart (no empty label) when readings exist", () => {
    renderWithIntl(
      <BpTrendChart
        points={[point({ systolic_bp: 120, diastolic_bp: 78 })]}
        emptyLabel="No BP readings"
      />,
    );
    expect(screen.queryByText("No BP readings")).toBeNull();
  });
});
