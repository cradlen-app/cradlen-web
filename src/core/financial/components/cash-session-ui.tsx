"use client";

import { Banknote } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { Button } from "@/components/ui/button";
import { formatMoney } from "../lib/format";
import type { CashSession, CashSessionStatus } from "../types/financial.types";

const STATUS_STYLES: Record<CashSessionStatus, string> = {
  OPEN: "bg-emerald-50 text-emerald-700",
  CLOSED: "bg-amber-50 text-amber-700",
  RECONCILED: "bg-gray-100 text-gray-600",
};

/** Formats a nullable decimal-string amount, falling back to an em dash. */
export function money(value: string | null) {
  return value == null ? "—" : formatMoney(Number(value));
}

/** Formats a nullable ISO timestamp to a locale string, falling back to em dash. */
export function dateTime(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function Stat({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd
        className={cn(
          "mt-0.5 tabular-nums",
          emphasis ? "text-base font-semibold text-gray-900" : "text-sm text-gray-700",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/** The open cash drawer: status, open time, and the live float/collected stats. */
export function CurrentCashSessionCard({
  current,
  onClose,
}: {
  current: CashSession;
  onClose: () => void;
}) {
  const t = useTranslations("financial.cashSessions");
  return (
    <section className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Banknote className="size-4 text-emerald-600" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-gray-800">
              {t("currentSession")}
            </h2>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                STATUS_STYLES[current.status],
              )}
            >
              {t(`status.${current.status}`)}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {t("openedAt", { time: dateTime(current.opened_at) })}
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={onClose}>
          {t("close")}
        </Button>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label={t("openingFloat")} value={money(current.opening_float)} />
        <Stat
          label={t("collected")}
          value={money(current.summary?.collected ?? "0")}
        />
        <Stat
          label={t("paymentCount", { count: current.summary?.payment_count ?? 0 })}
          value={String(current.summary?.payment_count ?? 0)}
        />
        <Stat
          label={t("expectedSoFar")}
          value={money(current.summary?.expected_so_far ?? current.opening_float)}
          emphasis
        />
      </dl>
    </section>
  );
}

/** History of past cash sessions with their variance and a reconcile action. */
export function CashSessionsHistoryTable({
  sessions,
  isLoading,
  nameByProfileId,
  profileId,
  onReconcile,
}: {
  sessions: CashSession[];
  isLoading: boolean;
  nameByProfileId: Map<string, string>;
  profileId: string | null | undefined;
  onReconcile: (session: CashSession) => void;
}) {
  const t = useTranslations("financial.cashSessions");
  return (
    <section>
      <h2 className="mb-2 text-sm font-medium text-gray-700">{t("history")}</h2>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-gray-400">{t("loading")}</p>
        ) : sessions.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">{t("empty")}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                <th className="px-4 py-2.5 text-start font-medium">{t("columns.opened")}</th>
                <th className="px-4 py-2.5 text-start font-medium">{t("columns.openedBy")}</th>
                <th className="px-4 py-2.5 text-end font-medium">{t("columns.openingFloat")}</th>
                <th className="px-4 py-2.5 text-end font-medium">{t("columns.expected")}</th>
                <th className="px-4 py-2.5 text-end font-medium">{t("columns.counted")}</th>
                <th className="px-4 py-2.5 text-end font-medium">{t("columns.variance")}</th>
                <th className="px-4 py-2.5 text-start font-medium">{t("columns.status")}</th>
                <th className="px-4 py-2.5 text-end font-medium" />
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const ownedByMe = s.profile_id === profileId;
                return (
                  <tr
                    key={s.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3 text-gray-600">{dateTime(s.opened_at)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {ownedByMe
                        ? t("you")
                        : nameByProfileId.get(s.profile_id) || t("anotherCashier")}
                    </td>
                    <td className="px-4 py-3 text-end tabular-nums text-gray-700">
                      {money(s.opening_float)}
                    </td>
                    <td className="px-4 py-3 text-end tabular-nums text-gray-700">
                      {money(s.expected_amount ?? s.summary?.expected_so_far ?? null)}
                    </td>
                    <td className="px-4 py-3 text-end tabular-nums text-gray-700">
                      {money(s.counted_amount)}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-end tabular-nums",
                        s.variance != null && Number(s.variance) !== 0
                          ? "text-red-600"
                          : "text-gray-400",
                      )}
                    >
                      {money(s.variance)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          s.status === "OPEN" && !ownedByMe
                            ? "bg-gray-100 text-gray-500"
                            : STATUS_STYLES[s.status],
                        )}
                      >
                        {t(`status.${s.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-end">
                      {s.status === "CLOSED" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onReconcile(s)}
                        >
                          {t("reconcile")}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
