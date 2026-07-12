import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const captureMock = vi.fn();

vi.mock("@/infrastructure/analytics/posthog", () => ({
  capture: (...args: unknown[]) => captureMock(...args),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
    onClick?: (e: unknown) => void;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import TrackedLink from "./TrackedLink";

describe("TrackedLink", () => {
  beforeEach(() => captureMock.mockReset());

  it("keeps the href so the link still navigates", () => {
    render(
      <TrackedLink
        href="/sign-up"
        event="cta_start_free"
        eventProps={{ location: "hero" }}
      >
        Start free
      </TrackedLink>,
    );

    expect(screen.getByRole("link", { name: "Start free" })).toHaveAttribute(
      "href",
      "/sign-up",
    );
  });

  it("captures the event with its props on click", async () => {
    render(
      <TrackedLink
        href="/sign-up"
        event="cta_choose_plan"
        eventProps={{ location: "pricing", plan: "center" }}
      >
        Choose Center
      </TrackedLink>,
    );

    await userEvent.click(screen.getByRole("link", { name: "Choose Center" }));

    expect(captureMock).toHaveBeenCalledWith("cta_choose_plan", {
      location: "pricing",
      plan: "center",
    });
  });

  it("still calls a caller-supplied onClick", async () => {
    // The mobile nav closes its menu from onClick. An earlier version of this
    // component set `onClick={track}` after spreading props, silently swallowing
    // the caller's handler and leaving the menu stuck open.
    const onClick = vi.fn();

    render(
      <TrackedLink
        href="/sign-up"
        event="cta_start_free"
        eventProps={{ location: "header_mobile" }}
        onClick={onClick}
      >
        Start free
      </TrackedLink>,
    );

    await userEvent.click(screen.getByRole("link", { name: "Start free" }));

    expect(captureMock).toHaveBeenCalledWith("cta_start_free", {
      location: "header_mobile",
    });
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
