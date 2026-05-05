// src/features/notifications/hooks/useNotifications.ts
"use client";

import { useState } from "react";
import type { Notification, UseNotificationsReturn } from "../types/notification.types";

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    category: "appointment",
    title: "Appointment confirmed",
    description: "Ahmed Hassan — tomorrow 10:30 AM",
    is_read: false,
    navigate_to: undefined,
    created_at: new Date(Date.now() - 2 * 60_000).toISOString(),
  },
  {
    id: "2",
    category: "staff",
    title: "Staff invite accepted",
    description: "Dr. Sara Al-Mansouri joined the team",
    is_read: false,
    navigate_to: undefined,
    created_at: new Date(Date.now() - 60 * 60_000).toISOString(),
  },
  {
    id: "3",
    category: "medicine",
    title: "Low stock alert",
    description: "Amoxicillin 500mg — 5 units remaining",
    is_read: false,
    navigate_to: undefined,
    created_at: new Date(Date.now() - 3 * 60 * 60_000).toISOString(),
  },
  {
    id: "4",
    category: "patient",
    title: "New patient registered",
    description: "Layla Khalid — added by reception",
    is_read: false,
    navigate_to: undefined,
    created_at: new Date(Date.now() - 5 * 60 * 60_000).toISOString(),
  },
  {
    id: "5",
    category: "report",
    title: "Monthly report ready",
    description: "April 2026 analytics are available",
    is_read: false,
    navigate_to: undefined,
    created_at: new Date(Date.now() - 24 * 60 * 60_000).toISOString(),
  },
  {
    id: "6",
    category: "system",
    title: "Branch settings updated",
    description: "Working hours changed for Al-Nour branch",
    is_read: true,
    navigate_to: undefined,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString(),
  },
  {
    id: "7",
    category: "appointment",
    title: "Appointment cancelled",
    description: "Omar Farouk — 2:00 PM on May 3rd",
    is_read: true,
    navigate_to: undefined,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60_000).toISOString(),
  },
];

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([...MOCK_NOTIFICATIONS]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  return {
    notifications,
    unreadCount,
    isLoading: false,
    markAsRead,
    markAllAsRead,
  };
}
