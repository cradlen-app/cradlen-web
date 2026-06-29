import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/render";
import type { ApiVitalsTrendPoint } from "../../../types/visits.api.types";
import { BmiTrendChart } from "./BmiTrendChart";

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

describe("BmiTrendChart", () => {
  it("shows the empty label when no points carry a BMI", () => {
    renderWithIntl(
      <BmiTrendChart points={[point()]} emptyLabel="No weight readings" />,
    );
    expect(screen.getByText("No weight readings")).toBeInTheDocument();
  });

  it("shows the empty label for an empty list", () => {
    renderWithIntl(<BmiTrendChart points={[]} emptyLabel="No weight readings" />);
    expect(screen.getByText("No weight readings")).toBeInTheDocument();
  });

  it("renders the chart when a BMI value exists", () => {
    renderWithIntl(
      <BmiTrendChart
        points={[point({ bmi: 22.4, weight_kg: 60 })]}
        emptyLabel="No weight readings"
      />,
    );
    expect(screen.queryByText("No weight readings")).toBeNull();
  });
});
