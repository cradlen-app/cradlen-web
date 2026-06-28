import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Users } from "lucide-react";
import {
  deltaPercent,
  TrendChip,
  StatTrendCard,
  StatTrendCardSkeleton,
} from "./StatTrendCard";

describe("deltaPercent", () => {
  it("returns null when there is no prior baseline", () => {
    expect(deltaPercent({ current: 5, previous: 0 })).toBeNull();
  });

  it("computes the percent change vs the baseline", () => {
    expect(deltaPercent({ current: 150, previous: 100 })).toBe(50);
    expect(deltaPercent({ current: 50, previous: 100 })).toBe(-50);
  });
});

describe("TrendChip", () => {
  it("renders the newLabel when there is a value but no baseline", () => {
    render(
      <TrendChip
        metric={{ current: 3, previous: 0 }}
        noPriorLabel="no prior"
        newLabel="+3 new"
      />,
    );
    expect(screen.getByText("+3 new")).toBeInTheDocument();
  });

  it("renders the emptyLabel for a true empty state", () => {
    render(
      <TrendChip
        metric={{ current: 0, previous: 0 }}
        noPriorLabel="no prior"
        emptyLabel="No data yet"
      />,
    );
    expect(screen.getByText("No data yet")).toBeInTheDocument();
  });

  it("falls back to noPriorLabel when delta is null and no special labels", () => {
    render(
      <TrendChip metric={{ current: 0, previous: 0 }} noPriorLabel="no prior" />,
    );
    expect(screen.getByText("no prior")).toBeInTheDocument();
  });

  it("renders 0% for an unchanged metric", () => {
    render(
      <TrendChip metric={{ current: 100, previous: 100 }} noPriorLabel="no prior" />,
    );
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("renders a positive delta with a + prefix", () => {
    const { container } = render(
      <TrendChip metric={{ current: 120, previous: 100 }} noPriorLabel="no prior" />,
    );
    expect(container.textContent?.replace(/\s/g, "")).toContain("+20%");
    expect(container.querySelector(".text-emerald-600")).toBeInTheDocument();
  });

  it("renders a negative delta without a + prefix", () => {
    const { container } = render(
      <TrendChip metric={{ current: 80, previous: 100 }} noPriorLabel="no prior" />,
    );
    const text = container.textContent?.replace(/\s/g, "") ?? "";
    expect(text).toContain("-20%");
    expect(text).not.toContain("+");
    expect(container.querySelector(".text-red-500")).toBeInTheDocument();
  });
});

describe("StatTrendCard", () => {
  it("renders the label, the metric current value and the vs caption", () => {
    render(
      <StatTrendCard
        icon={Users}
        label="Patients"
        metric={{ current: 42, previous: 30 }}
        vsLastMonthLabel="vs last month"
        noPriorLabel="no prior"
      />,
    );
    expect(screen.getByText("Patients")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("vs last month")).toBeInTheDocument();
  });

  it("prefers a provided display value over metric.current", () => {
    render(
      <StatTrendCard
        icon={Users}
        label="Revenue"
        metric={{ current: 1000, previous: 800 }}
        vsLastMonthLabel="vs last month"
        noPriorLabel="no prior"
        value="$1,000"
      />,
    );
    expect(screen.getByText("$1,000")).toBeInTheDocument();
  });

  it("renders a skeleton without throwing", () => {
    const { container } = render(<StatTrendCardSkeleton />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });
});
