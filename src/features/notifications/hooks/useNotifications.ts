"use client";

import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { apiAuthFetch, ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "sonner";
import type {
  NotificationsResponse,
  NotificationCategory,
  UseNotificationsReturn,
} from "../types/notification.types";

type UseNotificationsParams = {
  page?: number;
  limit?: number;
  category?: NotificationCategory | "all";
};

export function useNotifications({
  page = 1,
  limit = 20,
  category,
}: UseNotificationsParams = {}): UseNotificationsReturn {
  const queryClient = useQueryClient();

  const queryKey = queryKeys.notifications.list({ page, limit, category });

  const searchParams = new URLSearchParams();
  searchParams.set("page", String(page));
  searchParams.set("limit", String(limit));
  if (category && category !== "all") {
    searchParams.set("category", category);
  }

  const { data, isLoading } = useQuery<NotificationsResponse>({
    queryKey,
    queryFn: () =>
      apiAuthFetch<NotificationsResponse>(`/notifications?${searchParams.toString()}`),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) =>
      apiAuthFetch(`/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() }),
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? (error.messages[0] ?? "An error occurred")
          : "An error occurred";
      toast.error(message);
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () =>
      apiAuthFetch("/notifications/read-all", { method: "PATCH" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() }),
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? (error.messages[0] ?? "An error occurred")
          : "An error occurred";
      toast.error(message);
    },
  });

  return {
    notifications: data?.data ?? [],
    unreadCount: data?.meta?.unreadCount ?? 0,
    isLoading,
    meta: data?.meta ?? null,
    markAsRead: (id) => markAsReadMutation.mutate(id),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
  };
}
