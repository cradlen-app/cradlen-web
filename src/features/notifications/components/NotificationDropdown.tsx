// src/features/notifications/components/NotificationDropdown.tsx
"use client";

import { Popover } from "radix-ui";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { cn } from "@/lib/utils";
import { useNotifications } from "../hooks/useNotifications";
import { NotificationItem } from "./NotificationItem";
import type { Notification } from "../types/notification.types";

const DROPDOWN_LIMIT = 6;

function SkeletonRow() {
  return (
    <div className="flex items-start gap-2.5 px-4 py-2.5 border-b border-gray-50">
      <div className="size-8 rounded-lg bg-gray-100 animate-pulse shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 bg-gray-100 rounded animate-pulse w-4/5" />
        <div className="h-2 bg-gray-100 rounded animate-pulse w-3/5" />
        <div className="h-2 bg-gray-100 rounded animate-pulse w-2/5" />
      </div>
    </div>
  );
}

export function NotificationDropdown() {
  const t = useTranslations("notifications");
  const router = useRouter();
  const organizationId = useAuthContextStore((s) => s.organizationId);
  const branchId = useAuthContextStore((s) => s.branchId);
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } =
    useNotifications({ limit: DROPDOWN_LIMIT });

  function handleItemClick(notification: Notification) {
    markAsRead(notification.id);
    if (notification.navigate_to) {
      router.push(notification.navigate_to as Parameters<typeof router.push>[0]);
    }
  }

  function handleViewAll() {
    if (organizationId && branchId) {
      router.push(
        `/${organizationId}/${branchId}/dashboard/notifications` as Parameters<typeof router.push>[0],
      );
    }
  }

  const badgeLabel =
    unreadCount === 0 ? undefined : unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={t("title")}
          className={cn(
            "relative size-9 flex items-center justify-center rounded-full",
            "text-gray-400 hover:text-brand-primary hover:bg-brand-primary/8",
            "transition-all duration-150",
            "data-[state=open]:text-brand-primary data-[state=open]:bg-brand-primary/8",
          )}
        >
          <Bell className="size-5" />
          {badgeLabel && (
            <span className="absolute top-0.5 inset-e-0.5 min-w-[17px] h-[17px] rounded-full bg-brand-primary border-[1.5px] border-white text-white text-[9px] font-bold flex items-center justify-center px-1 leading-none">
              {badgeLabel}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className={cn(
            "z-50 w-[352px] rounded-2xl bg-white border border-gray-100",
            "shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)]",
            "outline-none",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">{t("title")}</span>
              {unreadCount > 0 && (
                <span className="text-xs text-gray-400">
                  {t("unreadCount", { count: unreadCount })}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-brand-primary hover:text-brand-primary/80 transition-colors"
              >
                {t("markAllRead")}
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <>
                {Array.from({ length: DROPDOWN_LIMIT }, (_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Bell className="size-9 text-gray-200" />
                <p className="text-sm font-semibold text-gray-600">{t("allCaughtUp")}</p>
                <p className="text-xs text-gray-400 text-center max-w-[200px] leading-relaxed">
                  {t("allCaughtUpSub")}
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  variant="compact"
                  categoryLabel={t(`categories.${n.category}`)}
                  onClick={handleItemClick}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {!isLoading && notifications.length > 0 && (
            <div className="border-t border-gray-50 px-4 py-2.5 flex justify-center">
              <button
                type="button"
                onClick={handleViewAll}
                className="text-xs font-semibold text-brand-primary hover:text-brand-primary/80 transition-colors"
              >
                {t("viewAll")} →
              </button>
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
