import { render, screen } from "@testing-library/react";

const OLD_WAY = ["Disconnected visits", "Lost context", "Duplicate records"];
const NEW_WAY = ["Continuous journeys", "Shared context", "One record"];

vi.mock("next-intl/server", () => ({
  getTranslations: async () => {
    const t = ((key: string) => key) as unknown as {
      (key: string): string;
      raw: (key: string) => unknown;
      rich: (key: string) => unknown;
    };
    t.raw = (key: string) => {
      if (key === "oldWay") return OLD_WAY;
      if (key === "newWay") return NEW_WAY;
      return key;
    };
    t.rich = (key: string) => key;
    return t;
  },
}));

import WhyJourneys from "./WhyJourneys";

describe("WhyJourneys", () => {
  it("renders the heading fragments and rich lead", async () => {
    render(await WhyJourneys());

    expect(screen.getByText("eyebrow")).toBeInTheDocument();
    expect(screen.getByText("headingHighlight")).toBeInTheDocument();
    expect(screen.getByText("lead")).toBeInTheDocument();
  });

  it("renders the old-way and new-way comparison lists", async () => {
    render(await WhyJourneys());

    expect(screen.getByText("oldWayLabel")).toBeInTheDocument();
    expect(screen.getByText("newWayLabel")).toBeInTheDocument();

    for (const item of [...OLD_WAY, ...NEW_WAY]) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }
  });
});
