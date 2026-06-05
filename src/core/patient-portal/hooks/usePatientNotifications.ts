"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchPatientNotifications,
  markAllPatientNotificationsRead,
  markPatientNotificationRead,
} from "../data/patient-portal.api";
import { patientPortalQueryKeys } from "../queryKeys";
import type { ApiPatientNotification } from "../data/patient-notifications.api.types";

const DROPDOWN_LIMIT = 8;

/**
 * Patient notifications for the bell dropdown: the recent list + unread count,
 * with mark-read / mark-all-read mutations. Polls every 60s so new notifications
 * (e.g. after a completed visit) appear without a reload. Patient-scoped via the
 * `/api/patient-portal/notifications` proxy (cookie auth), not the staff feed.
 */
export function usePatientNotifications() {
  const queryClient = useQueryClient();
  const queryKey = patientPortalQueryKeys.notifications();

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchPatientNotifications({ limit: DROPDOWN_LIMIT }),
    refetchInterval: 60_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const markRead = useMutation({
    mutationFn: (id: string) => markPatientNotificationRead(id),
    onSuccess: invalidate,
  });

  const markAllRead = useMutation({
    mutationFn: () => markAllPatientNotificationsRead(),
    onSuccess: invalidate,
  });

  const notifications: ApiPatientNotification[] = data?.data ?? [];

  return {
    notifications,
    unreadCount: data?.meta?.unreadCount ?? 0,
    isLoading,
    markRead: (id: string) => markRead.mutate(id),
    markAllRead: () => markAllRead.mutate(),
  };
}
