import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithIntl } from "@/test/render";
import type { Notification } from "../types/notification.types";

const push = vi.fn();
const markAsRead = vi.fn();
const markAllAsRead = vi.fn();
const openReview = vi.fn();

let mockReturn: {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: typeof markAsRead;
  markAllAsRead: typeof markAllAsRead;
};

vi.mock("../hooks/useNotifications", () => ({
  useNotifications: () => mockReturn,
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/features/auth/store/authContextStore", () => ({
  useAuthContextStore: (selector: (s: unknown) => unknown) =>
    selector({ organizationId: "org-1", branchId: "branch-1" }),
}));

vi.mock("@/features/investigations/store/investigationReviewStore", () => ({
  useInvestigationReviewStore: { getState: () => ({ open: openReview }) },
}));

import { NotificationDropdown } from "./NotificationDropdown";

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: "n1",
    category: "appointment",
    title: "New appointment",
    description: "A patient booked a visit.",
    is_read: false,
    read_at: null,
    navigate_to: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockReturn = {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    markAsRead,
    markAllAsRead,
  };
});

describe("NotificationDropdown", () => {
  it("shows the unread badge count, capped at 99+", () => {
    mockReturn.unreadCount = 150;
    renderWithIntl(<NotificationDropdown />);
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("renders no badge when there are no unread notifications", () => {
    renderWithIntl(<NotificationDropdown />);
    expect(screen.queryByText("99+")).not.toBeInTheDocument();
    // Trigger button is still present
    expect(screen.getByRole("button", { name: "Notifications" })).toBeInTheDocument();
  });

  it("renders the empty state when opened with no notifications", () => {
    renderWithIntl(<NotificationDropdown />);
    fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
    expect(screen.getByText("You're all caught up")).toBeInTheDocument();
  });

  it("lists notifications and marks-all-as-read on click", () => {
    mockReturn.notifications = [makeNotification(), makeNotification({ id: "n2", title: "Second" })];
    mockReturn.unreadCount = 2;
    renderWithIntl(<NotificationDropdown />);
    fireEvent.click(screen.getByRole("button", { name: "Notifications" }));

    expect(screen.getByText("New appointment")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Mark all as read"));
    expect(markAllAsRead).toHaveBeenCalled();
  });

  it("opens the investigation drawer when the notification has an investigationId", () => {
    mockReturn.notifications = [
      makeNotification({ metadata: { investigationId: "inv-9" } }),
    ];
    renderWithIntl(<NotificationDropdown />);
    fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
    fireEvent.click(screen.getByText("New appointment"));

    expect(markAsRead).toHaveBeenCalledWith("n1");
    expect(openReview).toHaveBeenCalledWith("inv-9");
    expect(push).not.toHaveBeenCalled();
  });

  it("navigates via navigate_to when there is no investigation link", () => {
    mockReturn.notifications = [
      makeNotification({ navigate_to: "/somewhere" }),
    ];
    renderWithIntl(<NotificationDropdown />);
    fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
    fireEvent.click(screen.getByText("New appointment"));

    expect(push).toHaveBeenCalledWith("/somewhere");
  });

  it("navigates to the notifications page from view-all", () => {
    mockReturn.notifications = [makeNotification()];
    renderWithIntl(<NotificationDropdown />);
    fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
    fireEvent.click(screen.getByText(/View all notifications/));

    expect(push).toHaveBeenCalledWith(
      "/org-1/branch-1/dashboard/notifications",
    );
  });
});
