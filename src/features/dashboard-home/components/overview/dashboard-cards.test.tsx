import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { num, SectionCard, RankedBars } from "./dashboard-cards";

describe("num", () => {
  it("coerces numeric strings to numbers", () => {
    expect(num("42.5")).toBe(42.5);
  });

  it("returns 0 for non-finite or invalid values", () => {
    expect(num("abc")).toBe(0);
    expect(num(null)).toBe(0);
    expect(num(undefined)).toBe(0);
    expect(num(Infinity)).toBe(0);
  });
});

describe("SectionCard", () => {
  it("renders the title, action, and children", () => {
    render(
      <SectionCard title="Top doctors" action={<button>More</button>}>
        <p>body content</p>
      </SectionCard>,
    );
    expect(screen.getByText("Top doctors")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More" })).toBeInTheDocument();
    expect(screen.getByText("body content")).toBeInTheDocument();
  });
});

describe("RankedBars", () => {
  it("renders the empty label when there are no rows", () => {
    render(<RankedBars rows={[]} emptyLabel="No data yet" />);
    expect(screen.getByText("No data yet")).toBeInTheDocument();
  });

  it("renders one row per entry with formatted amounts", () => {
    render(
      <RankedBars
        rows={[
          { label: "Dr. Adel", amount: 5000 },
          { label: "Dr. Mona", amount: 2500 },
        ]}
        emptyLabel="No data yet"
      />,
    );
    expect(screen.getByText("Dr. Adel")).toBeInTheDocument();
    expect(screen.getByText("Dr. Mona")).toBeInTheDocument();
    expect(screen.getByText("EGP 5,000.00")).toBeInTheDocument();
    expect(screen.getByText("EGP 2,500.00")).toBeInTheDocument();
    expect(screen.queryByText("No data yet")).not.toBeInTheDocument();
  });
});
