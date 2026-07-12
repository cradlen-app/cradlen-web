import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./posthog", () => ({ initAnalytics: vi.fn(), capturePageview: vi.fn() }));
vi.mock("./consent", () => ({ applyConsent: vi.fn(), getConsent: () => "granted" }));
vi.mock("next/navigation", () => ({ usePathname: () => "/en" }));

import { initAnalytics } from "./posthog";
import { PostHogProvider } from "./PostHogProvider";

describe("PostHogProvider", () => {
  it("renders children and initializes analytics once", () => {
    render(
      <PostHogProvider>
        <span>child</span>
      </PostHogProvider>,
    );
    expect(screen.getByText("child")).toBeInTheDocument();
    expect(initAnalytics).toHaveBeenCalledOnce();
  });
});
