import { render, screen } from "@testing-library/react";

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

import { Callout, Steps, Step, Figure } from "./mdx";

describe("guide mdx primitives", () => {
  it("Callout renders a title and children (default note type)", () => {
    render(
      <Callout title="Heads up">
        <p>Body content</p>
      </Callout>,
    );
    expect(screen.getByText("Heads up")).toBeInTheDocument();
    expect(screen.getByText("Body content")).toBeInTheDocument();
  });

  it("Callout supports the warn type without a title", () => {
    render(
      <Callout type="warn">
        <p>Be careful</p>
      </Callout>,
    );
    expect(screen.getByText("Be careful")).toBeInTheDocument();
    expect(screen.queryByText("Heads up")).not.toBeInTheDocument();
  });

  it("Steps renders Step titles and bodies", () => {
    render(
      <Steps>
        <Step title="First step">
          <p>Do this first</p>
        </Step>
        <Step title="Second step" />
      </Steps>,
    );
    expect(screen.getByText("First step")).toBeInTheDocument();
    expect(screen.getByText("Do this first")).toBeInTheDocument();
    expect(screen.getByText("Second step")).toBeInTheDocument();
  });

  it("Figure renders an alt-text placeholder when no src is given", () => {
    render(<Figure alt="Dashboard screenshot" caption="The dashboard" />);
    expect(screen.getByText("Dashboard screenshot")).toBeInTheDocument();
    expect(screen.getByText("The dashboard")).toBeInTheDocument();
    // No <img> when there is no source.
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("Figure renders an image when a src is provided", () => {
    render(<Figure src="/shot.png" alt="A captured screen" />);
    expect(screen.getByRole("img", { name: "A captured screen" })).toBeInTheDocument();
  });
});
