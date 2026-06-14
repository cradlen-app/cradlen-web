import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render";
import {
  PaymentStatusBadge,
  SubscriptionStatusBadge,
} from "./status-badges";

describe("SubscriptionStatusBadge", () => {
  it("renders the translated subscription status", () => {
    renderWithIntl(<SubscriptionStatusBadge status="ACTIVE" />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders the expired status", () => {
    renderWithIntl(<SubscriptionStatusBadge status="EXPIRED" />);
    expect(screen.getByText("Expired")).toBeInTheDocument();
  });
});

describe("PaymentStatusBadge", () => {
  it("renders the translated payment status", () => {
    renderWithIntl(<PaymentStatusBadge status="AWAITING_VERIFICATION" />);
    expect(screen.getByText("Awaiting verification")).toBeInTheDocument();
  });

  it("renders the verified status", () => {
    renderWithIntl(<PaymentStatusBadge status="VERIFIED" />);
    expect(screen.getByText("Verified")).toBeInTheDocument();
  });
});
