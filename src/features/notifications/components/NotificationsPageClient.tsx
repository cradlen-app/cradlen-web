"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useNotifications } from "../hooks/useNotifications";
import { NotificationItem } from "./NotificationItem";
import type { Notification, NotificationCategory } from "../types/notification.types";

const PAGE_SIZE = 10;

type CategoryFilter = "all" | NotificationCategory;

const CATEGORY_FILTERS: CategoryFilter[] = [
  "all",
  "appointment",
  "staff",
  "medicine",
  "patient",
  "report",
  "system",
];

export function NotificationsPageClient() {
  const t = useTranslations("notifications");
  const router = useRouter();
  const { notifications, isLoading, markAsRead, markAllAsRead } = useNotifications();

  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [page, setPage] = useState(1);

  const filtered =
    activeCategory === "all"
      ? notifications
      : notifications.filter((n) => n.category === activeCategory);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  function handleCategoryChange(cat: CategoryFilter) {
    setActiveCategory(cat);
    setPage(1);
  }

  function handleItemClick(notification: Notification) {
    markAsRead(notification.id);
    if (notification.navigate_to) {
      router.push(notification.navigate_to as Parameters<typeof router.push>[0]);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
          {filtered.length > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">
              {t("showing", {
                from: start + 1,
                to: Math.min(start + PAGE_SIZE, filtered.length),
                total: filtered.length,
              })}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={markAllAsRead}
          className="text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg px-3.5 py-2 hover:bg-gray-50 transition-colors"
        >
          {t("markAllRead")}
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {CATEGORY_FILTERS.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => handleCategoryChange(cat)}
            className={cn(
              "text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all duration-100",
              activeCategory === cat
                ? "bg-emerald-50 text-brand-primary border-emerald-200"
                : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100",
            )}
          >
            {t(`categories.${cat}`)}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3.5 px-6 py-3.5">
                <div className="size-10 rounded-xl bg-gray-100 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                  <div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/2" />
                  <div className="h-2 bg-gray-100 rounded animate-pulse w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : pageItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-sm font-semibold text-gray-600">{t("allCaughtUp")}</p>
            <p className="text-xs text-gray-400">{t("allCaughtUpSub")}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pageItems.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                variant="full"
                categoryLabel={t(`categories.${n.category}`)}
                onClick={handleItemClick}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-50">
            <span className="text-xs text-gray-500">
              {t("showing", {
                from: start + 1,
                to: Math.min(start + PAGE_SIZE, filtered.length),
                total: filtered.length,
              })}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage === 1}
                onClick={() => setPage((p) => p - 1)}
                className="size-8 flex items-center justify-center rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={cn(
                    "size-8 flex items-center justify-center rounded-lg border text-sm font-medium transition-colors",
                    p === safePage
                      ? "bg-brand-primary text-white border-brand-primary"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50",
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={safePage === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="size-8 flex items-center justify-center rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
