import { render, screen } from "@testing-library/react";

vi.mock("next-intl/server", () => ({
  getTranslations: async () => ((key: string) => key) as unknown,
}));

vi.mock("./WorkspaceMockup", () => ({
  default: () => <div data-testid="workspace-mockup" />,
}));

import HeroMedia from "./HeroMedia";

describe("HeroMedia", () => {
  it("renders the framed mockup with floating journey cards", async () => {
    render(await HeroMedia());

    // App-window frame exposes an accessible label.
    expect(screen.getByRole("img", { name: "mediaAlt" })).toBeInTheDocument();
    expect(screen.getByText("app.cradlen.com")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-mockup")).toBeInTheDocument();

    // Floating "next on the journey" card.
    expect(screen.getByText("mediaNextLabel")).toBeInTheDocument();
    expect(screen.getByText("mediaNextValue")).toBeInTheDocument();

    // Floating patient journey card.
    expect(screen.getByText("patientName")).toBeInTheDocument();
    expect(screen.getByText("patientMeta")).toBeInTheDocument();
    expect(screen.getByText("statusActive")).toBeInTheDocument();
    expect(screen.getByText("tri1Title")).toBeInTheDocument();
    expect(screen.getByText("tri2Title")).toBeInTheDocument();
    expect(screen.getByText("tri3Title")).toBeInTheDocument();
  });
});
