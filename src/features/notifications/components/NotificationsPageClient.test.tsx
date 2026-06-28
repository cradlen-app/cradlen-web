import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithIntl } from "@/test/render";
import type {
  Notification,
  NotificationMeta,
} from "../types/notification.types";

const push = vi.fn();
const markAsRead = vi.fn();
const markAllAsRead = vi.fn();
const openReview = vi.fn();
const useNotifications = vi.fn();

vi.mock("../hooks/useNotifications", () => ({
  useNotifications: (args: unknown) => useNotifications(args),
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/features/investigations/store/investigationReviewStore", () => ({
  useInvestigationReviewStore: { getState: () => ({ open: openReview }) },
}));

import { NotificationsPageClient } from "./NotificationsPageClient";

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: "n1",
    category: "appointment",
    title: "Appointment reminder",
    description: "A visit is scheduled.",
    is_read: false,
    read_at: null,
    navigate_to: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function meta(overrides: Partial<NotificationMeta> = {}): NotificationMeta {
  return {
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1,
    unreadCount: 1,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  useNotifications.mockReturnValue({
    notifications: [makeNotification()],
    isLoading: false,
    meta: meta(),
    markAsRead,
    markAllAsRead,
  });
});

describe("NotificationsPageClient", () => {
  it("renders the page header and a notification row", () => {
    renderWithIntl(<NotificationsPageClient />);
    expect(
      screen.getByRole("heading", { name: "Notifications" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Appointment reminder")).toBeInTheDocument();
  });

  it("renders all category filter chips", () => {
    renderWithIntl(<NotificationsPageClient />);
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Appointments" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Billing" })).toBeInTheDocument();
  });

  it("re-queries with the selected category when a chip is clicked", () => {
    renderWithIntl(<NotificationsPageClient />);
    fireEvent.click(screen.getByRole("button", { name: "Billing" }));
    expect(useNotifications).toHaveBeenLastCalledWith(
      expect.objectContaining({ category: "billing", page: 1 }),
    );
  });

  it("shows the empty state when there are no notifications", () => {
    useNotifications.mockReturnValue({
      notifications: [],
      isLoading: false,
      meta: meta({ total: 0 }),
      markAsRead,
      markAllAsRead,
    });
    renderWithIntl(<NotificationsPageClient />);
    expect(screen.getByText("You're all caught up")).toBeInTheDocument();
  });

  it("renders pagination and advances the page", () => {
    useNotifications.mockReturnValue({
      notifications: [makeNotification()],
      isLoading: false,
      meta: meta({ total: 25, totalPages: 3 }),
      markAsRead,
      markAllAsRead,
    });
    renderWithIntl(<NotificationsPageClient />);
    // Page-number button "2"
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    expect(useNotifications).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2 }),
    );
  });

  it("marks all as read from the header button", () => {
    renderWithIntl(<NotificationsPageClient />);
    fireEvent.click(screen.getByRole("button", { name: "Mark all as read" }));
    expect(markAllAsRead).toHaveBeenCalled();
  });

  it("opens the investigation drawer on item click with metadata", () => {
    useNotifications.mockReturnValue({
      notifications: [
        makeNotification({ metadata: { investigationId: "inv-3" } }),
      ],
      isLoading: false,
      meta: meta(),
      markAsRead,
      markAllAsRead,
    });
    renderWithIntl(<NotificationsPageClient />);
    fireEvent.click(screen.getByText("Appointment reminder"));
    expect(markAsRead).toHaveBeenCalledWith("n1");
    expect(openReview).toHaveBeenCalledWith("inv-3");
  });
});
