import { render, screen } from "@testing-library/react";

vi.mock("next-intl/server", () => ({
  getTranslations: async () => ((key: string) => key) as unknown,
}));

import Testimonial from "./Testimonial";

describe("Testimonial", () => {
  it("renders the quote, attribution and photo placeholder copy", async () => {
    render(await Testimonial());

    expect(screen.getByText("quote")).toBeInTheDocument();
    expect(screen.getByText("name")).toBeInTheDocument();
    expect(screen.getByText("role")).toBeInTheDocument();
    expect(screen.getByText("dropPhoto")).toBeInTheDocument();
    expect(screen.getByText("browse")).toBeInTheDocument();
  });
});
