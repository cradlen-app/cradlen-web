import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/render";
import { StaffStatusBadge } from "./StaffStatusBadge";

describe("StaffStatusBadge", () => {
  it("renders translated availability text", () => {
    renderWithIntl(<StaffStatusBadge status="available" />);

    expect(screen.getByText("Available")).toBeInTheDocument();
  });

  it("renders translated unavailable text in pill mode", () => {
    renderWithIntl(<StaffStatusBadge status="notAvailable" variant="pill" />);

    expect(screen.getByText("Not Available")).toBeInTheDocument();
  });
});
