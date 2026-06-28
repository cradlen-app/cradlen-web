import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithIntl } from "@/test/render";
import { NotificationItem } from "./NotificationItem";
import type { Notification } from "../types/notification.types";

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: "n1",
    category: "appointment",
    title: "New appointment booked",
    description: "Sara Mostafa booked a follow-up visit.",
    is_read: false,
    read_at: null,
    navigate_to: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("NotificationItem", () => {
  it("renders the title and description (compact variant)", () => {
    renderWithIntl(
      <NotificationItem
        notification={makeNotification()}
        variant="compact"
        categoryLabel="Appointments"
        onClick={() => {}}
      />,
    );
    expect(screen.getByText("New appointment booked")).toBeInTheDocument();
    expect(
      screen.getByText("Sara Mostafa booked a follow-up visit."),
    ).toBeInTheDocument();
  });

  it("does not render the category badge in the compact variant", () => {
    renderWithIntl(
      <NotificationItem
        notification={makeNotification()}
        variant="compact"
        categoryLabel="Appointments"
        onClick={() => {}}
      />,
    );
    expect(screen.queryByText("Appointments")).not.toBeInTheDocument();
  });

  it("renders the category badge in the full variant", () => {
    renderWithIntl(
      <NotificationItem
        notification={makeNotification()}
        variant="full"
        categoryLabel="Appointments"
        onClick={() => {}}
      />,
    );
    expect(screen.getByText("Appointments")).toBeInTheDocument();
  });

  it("calls onClick with the notification when pressed", () => {
    const onClick = vi.fn();
    const notification = makeNotification();
    renderWithIntl(
      <NotificationItem
        notification={notification}
        variant="full"
        categoryLabel="Appointments"
        onClick={onClick}
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledWith(notification);
  });

  it("renders the category emoji icon", () => {
    renderWithIntl(
      <NotificationItem
        notification={makeNotification({ category: "medicine" })}
        variant="full"
        categoryLabel="Medicine"
        onClick={() => {}}
      />,
    );
    expect(screen.getByText("💊")).toBeInTheDocument();
  });
});
